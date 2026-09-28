"""Reclaim — data model.

The whole app turns on one distinction: what we BELIEVE about an environment
(`env_state`, set by us) versus what the cluster last actually REPORTED
(`observed_allocation`, plus `Cluster.last_observed_at` telling us how stale that
report is). A drift finding is what we open when those two disagree.

Storing the observation's age is the load-bearing decision. Without it,
"record says released, cluster says allocated" is indistinguishable from
"record says released, cluster is unreachable" — and a reconciler that cannot
tell those apart will happily destroy live workloads behind a network partition.
"""

# NOTE: every schema repeats the literal "reclaim" namespace on purpose. The SDK
# resolves it by static AST parsing of this file and never executes it, so a
# shared constant would be invisible to the resolver and fail at setup.

Cluster = {
    "schema_type": "object",
    "name": "Cluster",
    "namespace": "reclaim",
    "parent_type": "tenant",
    "description": "A Kubernetes cluster whose environments teams lease, with the freshness of our last observation.",
    "attributes": [
        {"name": "provider", "type": "string", "values": ["gcp", "aws"], "mandatory": True},
        {"name": "region", "type": "string", "mandatory": True},
        {"name": "capacity", "type": "integer", "mandatory": True},
        # cluster_state, not `state` — `state` is stripped from non-admin writes.
        {"name": "cluster_state", "type": "string",
         "values": ["healthy", "degraded", "unreachable"], "mandatory": True},
        # The freshness field. Everything downstream depends on it.
        {"name": "last_observed_at", "type": "datetime"},
        {"name": "observation_note", "type": "text"},
    ],
    "validations": [
        {"id": "capacity-positive",
         "assert": {">": [{"var": "capacity"}, 0]},
         "message": "A cluster must have capacity for at least one environment.",
         "severity": "error"},
    ],
}

Environment = {
    "schema_type": "object",
    "name": "Environment",
    "namespace": "reclaim",
    "parent_type": "tenant",
    "description": "A claimable slot on a cluster, carrying both our believed state and the cluster's last reported allocation.",
    "attributes": [
        {"name": "env_kind", "type": "string", "values": ["preview", "persistent"], "mandatory": True},
        # What WE believe.
        {"name": "env_state", "type": "string",
         "values": ["available", "claimed", "expiring", "releasing", "disputed", "quarantined"],
         "mandatory": True},
        # What the CLUSTER last told us. Deliberately a separate field.
        {"name": "observed_allocation", "type": "string",
         "values": ["free", "allocated", "unknown"], "mandatory": True},
        {"name": "namespace_path", "type": "string", "mandatory": True},
        {"name": "current_holder", "type": "string"},
        {"name": "current_team", "type": "string"},
        {"name": "monthly_cost_usd", "type": "float"},
        {"name": "workflow_status", "type": "string"},
        {"name": "processed_at", "type": "datetime"},
    ],
    "references": [
        {"name": "Cluster", "cardinality": "one", "back_ref_name": "environments"},
    ],
}

Lease = {
    "schema_type": "object",
    "name": "Lease",
    "namespace": "reclaim",
    "parent_type": "tenant",
    "description": "A time-boxed claim on an environment by one engineer, including how its release attempt failed.",
    "attributes": [
        # Denormalised alongside the real `Environment` reference below. Event
        # bindings read flat fields off the created row and cannot traverse a
        # *_refs array, so a relationship that must trigger a server-side
        # workflow needs a plain key as well as the reference.
        {"name": "environment_uuid", "type": "string"},
        {"name": "team", "type": "string", "mandatory": True},
        {"name": "requested_by", "type": "string", "mandatory": True},
        # owner_username is the sanctioned owner field; owner_uuid would be stripped.
        {"name": "owner_username", "type": "string"},
        {"name": "purpose", "type": "string"},
        {"name": "claimed_at", "type": "datetime", "mandatory": True},
        {"name": "expires_at", "type": "datetime", "mandatory": True},
        {"name": "lease_state", "type": "string",
         "values": ["active", "expiring", "released", "release_failed", "force_reclaimed"],
         "mandatory": True},
        {"name": "release_attempts", "type": "integer"},
        {"name": "last_release_error", "type": "text"},
        {"name": "workflow_status", "type": "string"},
        {"name": "processed_at", "type": "datetime"},
    ],
    "references": [
        {"name": "Environment", "cardinality": "one", "back_ref_name": "leases"},
    ],
    "validations": [
        {"id": "expiry-after-claim",
         "assert": {">=": [{"var": "expires_at"}, {"var": "claimed_at"}]},
         "message": "A lease cannot expire before it was claimed.",
         "severity": "error"},
    ],
}

DriftFinding = {
    "schema_type": "object",
    "name": "DriftFinding",
    "namespace": "reclaim",
    "parent_type": "tenant",
    "description": "A recorded disagreement between our believed environment state and the cluster's reported allocation.",
    "attributes": [
        {"name": "environment_uuid", "type": "string"},
        {"name": "lease_uuid", "type": "string"},
        {"name": "claimed_allocation", "type": "string", "mandatory": True},
        {"name": "observed_allocation", "type": "string", "mandatory": True},
        {"name": "detected_at", "type": "datetime", "mandatory": True},
        # Age of the observation the finding was raised from. Copied at detection
        # time so a later refresh of the cluster cannot silently rewrite history.
        {"name": "observation_age_minutes", "type": "integer"},
        {"name": "severity", "type": "string", "values": ["low", "medium", "high"], "mandatory": True},
        {"name": "finding_state", "type": "string",
         "values": ["open", "awaiting_second_approval", "resolved", "rejected"],
         "mandatory": True},
        {"name": "resolution", "type": "string",
         "values": ["unresolved", "force_reclaim", "mark_external", "escalate"],
         "mandatory": True},
        {"name": "requested_by", "type": "string"},
        {"name": "requested_at", "type": "datetime"},
        {"name": "approved_by", "type": "string"},
        {"name": "approved_at", "type": "datetime"},
        {"name": "resolution_note", "type": "text"},
        # Admin-only via hidden_fields on the engineer policy.
        {"name": "wasted_cost_usd", "type": "float"},
        {"name": "workflow_status", "type": "string"},
        {"name": "processed_at", "type": "datetime"},
    ],
    "references": [
        {"name": "Environment", "cardinality": "one", "back_ref_name": "findings"},
        {"name": "Lease", "cardinality": "one", "back_ref_name": "findings"},
    ],
}

FleetPolicy = {
    "schema_type": "object",
    "name": "FleetPolicy",
    "namespace": "reclaim",
    "parent_type": "tenant",
    "description": "Per-organisation safety settings governing how drift findings may be resolved and when.",
    "attributes": [
        # The flag the build brief asked for: default off, flippable per org.
        {"name": "require_dual_approval", "type": "boolean", "mandatory": True},
        # Refuse to act on an observation older than this. The guard that makes
        # force-reclaim safe to offer at all.
        {"name": "stale_observation_minutes", "type": "integer", "mandatory": True},
        {"name": "auto_release_grace_minutes", "type": "integer", "mandatory": True},
        {"name": "escalation_channel", "type": "string"},
    ],
    "validations": [
        {"id": "stale-window-sane",
         "assert": {">": [{"var": "stale_observation_minutes"}, 0]},
         "message": "The stale-observation window must be greater than zero minutes.",
         "severity": "error"},
    ],
}

ALL_SCHEMAS = [Cluster, Environment, Lease, DriftFinding, FleetPolicy]

# Internal tool: nothing is public. The logged-out surface is a value-prop
# sign-in screen backed by static copy, never a read of fleet data.
PUBLIC_SCHEMAS = []
