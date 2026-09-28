"""Reclaim — policies, roles, workflows and seed data.

Seeded so that every interesting state exists on first load, including the two
that have no clean resolution:

  * northwind / nw-prod-a  — released record, cluster still says allocated,
                             observation FRESH. An admin can act.
  * northwind / nw-edge-2  — same disagreement, but the cluster is unreachable
                             and the observation is STALE. Nobody can safely act;
                             the UI must refuse and say why.
  * contoso  / ct-stage-1  — same disagreement, but Contoso requires a second
                             approver, so the resolution is parked awaiting one.
"""

import os
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from supero.app_setup import (  # noqa: E402
    AppSetup, PolicyDef, PolicyRule, make_seed_record, ref_link,
)
from config import AppConfig  # noqa: E402
from schemas import ALL_SCHEMAS, PUBLIC_SCHEMAS  # noqa: E402
from seed_data import FLEETS, ENVIRONMENTS  # noqa: E402

seed_record = make_seed_record(ALL_SCHEMAS)

NOW = datetime.now(timezone.utc).replace(microsecond=0)


def iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def ago(**kw):
    return iso(NOW - timedelta(**kw))


def ahead(**kw):
    return iso(NOW + timedelta(**kw))


# ---------------------------------------------------------------------------
# Roles and access
# ---------------------------------------------------------------------------

# NO CUSTOM ROLE. A custom RoleDef needs domain-level create access, which the
# project-scoped key a cloud deploy runs under does not have. When registration
# fails the platform does not drop the matching PolicyDef — it NORMALISES it onto
# a built-in role, so a restrictive engineer policy lands on top of tenant_admin
# and strips the admin (and the seed principal) of create access. That is how the
# first deploy lost 16 seed records. Engineers therefore use the built-in
# non-privileged role, which is what they were being normalised to regardless.

# NOTE: `default_access="full"` with `rules=[]` is the pattern SKILLS §6 shows for
# an admin role, and on this platform it does NOT confer create access to app
# schemas — a tenant_admin holding exactly that policy gets
# `403 Your role does not have create access to cluster`. The admin's rights have
# to be enumerated per entity, so they are.
_ADMIN_ENTITIES = ["cluster", "environment", "lease", "drift_finding", "fleet_policy"]

POLICIES = [
    PolicyDef(role="tenant_admin", default_access="full", rules=[
        PolicyRule(entity=e, can_read=True, can_create=True,
                   can_update=True, can_delete=True)
        for e in _ADMIN_ENTITIES
    ]),
    PolicyDef(
        role="tenant_user",
        default_access="none",
        rules=[
            # The fleet is visible to everyone in the organisation — you cannot
            # plan a claim against capacity you cannot see.
            PolicyRule(entity="cluster", can_read=True),
            PolicyRule(entity="environment", can_read=True),
            PolicyRule(entity="fleet_policy", can_read=True),

            # Drift is visible but NOT actionable: resolving it is an admin act.
            # The money field is admin-only, enforced server-side.
            # An engineer may REPORT drift but never resolve it: create + read,
            # no update. The money field stays admin-only, server-enforced.
            PolicyRule(entity="drift_finding", can_read=True, can_create=True,
                       hidden_fields=["wasted_cost_usd"]),

            # Leases are owner-scoped: read-own + write-own. The platform applies
            # one record filter per (role, entity) to every verb, so this is
            # deliberately "my leases", not "my team's leases" — see README.
            PolicyRule(entity="lease", can_read=True, can_create=True, can_update=True,
                       filter_field="owner_username", filter_match="$user.name"),
        ],
    ),
]


# ---------------------------------------------------------------------------
# Workflows
# ---------------------------------------------------------------------------

WORKFLOW_DEFINITIONS = [
    # A release attempt failed. Record that truthfully rather than asserting the
    # environment came back. Compensating: if we cannot finish recording the
    # disagreement, we must not leave the lease looking cleanly released.
    {
        "id": "reconcile_failed_release",
        "workflow_id": "reconcile_failed_release",
        "status": "Active",
        "name": "Reconcile a failed release",
        "description": "Marks a lease's release as failed and puts its environment into dispute.",
        "on_error": "compensate",
        "input_schema": {
            "lease_uuid": {"type": "string", "required": True},
            "environment_uuid": {"type": "string", "required": True},
            "observed": {"type": "string", "required": True},
            "error_text": {"type": "string", "required": False},
        },
        "steps": [
            {
                "id": "flag_lease",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:lease",
                "record_uuid": "{{input.lease_uuid}}",
                "data": {"lease_state": "release_failed",
                         "last_release_error": "{{input.error_text}}"},
                "compensate": {
                    "kind": "automatic",
                    "type": "crud_operation",
                    "operation": "update",
                    "object_type": "reclaim:lease",
                    "record_uuid": "{{input.lease_uuid}}",
                    "input_map": {"lease_state": "active", "last_release_error": ""},
                },
            },
            {
                "id": "dispute_env",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:environment",
                "record_uuid": "{{input.environment_uuid}}",
                "data": {"env_state": "disputed",
                         "observed_allocation": "{{input.observed}}"},
                "compensate": {
                    "kind": "automatic",
                    "type": "crud_operation",
                    "operation": "update",
                    "object_type": "reclaim:environment",
                    "record_uuid": "{{input.environment_uuid}}",
                    "input_map": {"env_state": "releasing"},
                },
            },
            {
                "id": "stamp",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:lease",
                "record_uuid": "{{input.lease_uuid}}",
                "data": {"workflow_status": "processed",
                         "processed_at": "{{context.timestamp}}"},
                "compensate": {"kind": "skip_acknowledged",
                               "reason": "bookkeeping stamp \u2014 nothing external to undo"},
            },
        ],
    },

    # An admin resolved a finding. Where the environment lands depends on which
    # of the three bad options they chose — hence the branch.
    {
        "id": "apply_drift_resolution",
        "workflow_id": "apply_drift_resolution",
        "status": "Active",
        "name": "Apply a drift resolution",
        "description": "Applies an admin decision on a drift finding and moves the environment accordingly.",
        "input_schema": {
            "finding_uuid": {"type": "string", "required": True},
            "environment_uuid": {"type": "string", "required": True},
            "resolution": {"type": "string", "required": True},
            "approver": {"type": "string", "required": True},
        },
        "steps": [
            {
                "id": "branch_env",
                "type": "condition",
                "condition": "{{input.resolution}} == force_reclaim",
                "then_steps": [
                    # Reclaimed: the workload is gone, the slot returns to the pool.
                    {"id": "env_free", "type": "crud_operation", "operation": "update",
                     "object_type": "reclaim:environment",
                     "record_uuid": "{{input.environment_uuid}}",
                     "data": {"env_state": "available", "observed_allocation": "free",
                              "current_holder": "", "current_team": ""}},
                ],
                "else_steps": [
                    # Marked external or escalated: the slot is NOT free, and we
                    # refuse to pretend otherwise. Quarantined keeps it out of the
                    # claimable pool while stopping the repeat alerts.
                    {"id": "env_quarantine", "type": "crud_operation", "operation": "update",
                     "object_type": "reclaim:environment",
                     "record_uuid": "{{input.environment_uuid}}",
                     "data": {"env_state": "quarantined"}},
                ],
            },
            {
                "id": "stamp_finding",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:drift_finding",
                "record_uuid": "{{input.finding_uuid}}",
                "data": {"finding_state": "resolved",
                         "approved_by": "{{input.approver}}",
                         "approved_at": "{{context.timestamp}}",
                         "workflow_status": "processed",
                         "processed_at": "{{context.timestamp}}"},
            },
        ],
    },

    # Releasing is a REQUEST, not an assertion. If the cluster still reports the
    # namespace allocated, the release has not happened, and saying otherwise is
    # the bug this whole app exists to prevent. So the else-branch records the
    # failure and opens a finding instead of marking the lease cleanly released.
    {
        "id": "release_lease",
        "workflow_id": "release_lease",
        "status": "Active",
        "name": "Release a lease",
        "description": "Releases an environment, or records a drift finding when the cluster disagrees.",
        "input_schema": {
            "lease_uuid": {"type": "string", "required": True},
            "environment_uuid": {"type": "string", "required": True},
            "observed": {"type": "string", "required": True},
            "env_label": {"type": "string", "required": False},
        },
        "steps": [
            {
                "id": "branch_release",
                "type": "condition",
                "condition": "{{input.observed}} == free",
                "then_steps": [
                    {"id": "lease_done", "type": "crud_operation", "operation": "update",
                     "object_type": "reclaim:lease", "record_uuid": "{{input.lease_uuid}}",
                     "data": {"lease_state": "released"}},
                    {"id": "env_free", "type": "crud_operation", "operation": "update",
                     "object_type": "reclaim:environment", "record_uuid": "{{input.environment_uuid}}",
                     "data": {"env_state": "available", "observed_allocation": "free",
                              "current_holder": "", "current_team": ""}},
                ],
                "else_steps": [
                    {"id": "lease_failed", "type": "crud_operation", "operation": "update",
                     "object_type": "reclaim:lease", "record_uuid": "{{input.lease_uuid}}",
                     "data": {"lease_state": "release_failed",
                              "last_release_error": "cluster still reports the namespace allocated at release time"}},
                    {"id": "env_disputed", "type": "crud_operation", "operation": "update",
                     "object_type": "reclaim:environment", "record_uuid": "{{input.environment_uuid}}",
                     "data": {"env_state": "disputed"}},
                    {"id": "open_finding", "type": "crud_operation", "operation": "create",
                     "object_type": "reclaim:drift_finding",
                     "data": {"display_name": "{{input.env_label}} still allocated after release",
                              "description": "Release requested but the cluster still reports the namespace allocated.",
                              "environment_uuid": "{{input.environment_uuid}}",
                              "lease_uuid": "{{input.lease_uuid}}",
                              "claimed_allocation": "free",
                              "observed_allocation": "{{input.observed}}",
                              "detected_at": "{{context.timestamp}}",
                              "severity": "high", "finding_state": "open",
                              "resolution": "unresolved"}},
                ],
            },
            {
                "id": "stamp",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:lease",
                "record_uuid": "{{input.lease_uuid}}",
                "data": {"workflow_status": "processed",
                         "processed_at": "{{context.timestamp}}"},
            },
        ],
    },

    # Fires when an engineer creates a lease. An engineer has read-only access to
    # environments by design, so the environment transition happens here, under
    # the workflow engine's privilege, rather than as a second client write.
    {
        "id": "on_lease_claimed",
        "workflow_id": "on_lease_claimed",
        "status": "Active",
        "name": "On lease claimed",
        "description": "Marks an environment claimed when an engineer creates a lease against it.",
        "input_schema": {
            "lease_uuid": {"type": "string", "required": True},
            "environment_uuid": {"type": "string", "required": True},
            "holder": {"type": "string", "required": False},
            "team": {"type": "string", "required": False},
        },
        "steps": [
            {
                "id": "claim_env",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:environment",
                "record_uuid": "{{input.environment_uuid}}",
                "data": {"env_state": "claimed", "observed_allocation": "allocated",
                         "current_holder": "{{input.holder}}", "current_team": "{{input.team}}"},
            },
            {
                "id": "stamp",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:lease",
                "record_uuid": "{{input.lease_uuid}}",
                "data": {"workflow_status": "processed",
                         "processed_at": "{{context.timestamp}}"},
            },
        ],
    },

    # Fires automatically whenever a finding is created (see EVENT_BINDINGS).
    {
        "id": "on_drift_detected",
        "workflow_id": "on_drift_detected",
        "status": "Active",
        "name": "On drift detected",
        "description": "Puts an environment into dispute the moment a drift finding is recorded against it.",
        "input_schema": {
            "finding_uuid": {"type": "string", "required": True},
            "severity": {"type": "string", "required": False},
        },
        "steps": [
            {
                "id": "stamp_finding",
                "type": "crud_operation",
                "operation": "update",
                "object_type": "reclaim:drift_finding",
                "record_uuid": "{{input.finding_uuid}}",
                "data": {"workflow_status": "processed",
                         "processed_at": "{{context.timestamp}}"},
            },
        ],
    },
]

EVENT_BINDINGS = [
    {
        "event": "@create:reclaim:lease",
        "workflow_id": "on_lease_claimed",
        "input_map": {"lease_uuid": "uuid", "environment_uuid": "environment_uuid",
                      "holder": "requested_by", "team": "team"},
    },
    {
        "event": "@create:reclaim:drift_finding",
        "workflow_id": "on_drift_detected",
        "input_map": {"finding_uuid": "uuid", "severity": "severity"},
    },
]


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------

def seed_test_data(s, base, domain, tenant_uuid, progress):
    total = 0

    for tenant_name, fleet in FLEETS.items():
        # One policy row per organisation. This is the flag the brief asked for.
        if seed_record(s, base, domain, "FleetPolicy", fleet["policy"],
                       progress=progress, tenant_name=tenant_name):
            total += 1

        cluster_uuids = {}
        for rec in fleet["clusters"]:
            u = seed_record(s, base, domain, "Cluster", rec,
                            progress=progress, tenant_name=tenant_name)
            if u:
                cluster_uuids[rec["name"]] = u
                total += 1

        for row in ENVIRONMENTS[tenant_name]:
            env_uuid = seed_record(s, base, domain, "Environment", row["env"],
                                   progress=progress, tenant_name=tenant_name)
            if not env_uuid:
                continue
            total += 1

            cluster_uuid = cluster_uuids.get(row["cluster"])
            if cluster_uuid:
                ref_link(s, base, domain, ALL_SCHEMAS,
                         "Environment", env_uuid, "Cluster", cluster_uuid)

            lease_uuid = None
            if row["lease"]:
                lease_rec = dict(row["lease"], environment_uuid=env_uuid)
                lease_uuid = seed_record(s, base, domain, "Lease", lease_rec,
                                         progress=progress, tenant_name=tenant_name)
                if lease_uuid:
                    total += 1
                    ref_link(s, base, domain, ALL_SCHEMAS,
                             "Lease", lease_uuid, "Environment", env_uuid)

            if row["finding"]:
                find_rec = dict(row["finding"], environment_uuid=env_uuid,
                                lease_uuid=(lease_uuid or ""))
                f_uuid = seed_record(s, base, domain, "DriftFinding", find_rec,
                                     progress=progress, tenant_name=tenant_name)
                if f_uuid:
                    total += 1
                    ref_link(s, base, domain, ALL_SCHEMAS,
                             "DriftFinding", f_uuid, "Environment", env_uuid)
                    if lease_uuid:
                        ref_link(s, base, domain, ALL_SCHEMAS,
                                 "DriftFinding", f_uuid, "Lease", lease_uuid)

    progress.ok("Seeded %d records across %d organisations." % (total, len(FLEETS)))


def main():
    setup = AppSetup(AppConfig(), ALL_SCHEMAS, PUBLIC_SCHEMAS)
    setup.run(
        seed_fn=seed_test_data,
        policies=POLICIES,
        workflow_definitions=WORKFLOW_DEFINITIONS,
        event_bindings=EVENT_BINDINGS,
    )


if __name__ == "__main__":
    main()
