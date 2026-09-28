"""Reclaim — the demo fleet, as data.

Imported by `setup.py` (the in-bundle seed) and by `submission/seed_api.py` (the
operator-side seeder used when a cloud deploy's principal is refused create
access). One definition, two callers, so the two can never drift.
"""

from datetime import datetime, timedelta, timezone

NOW = datetime.now(timezone.utc).replace(microsecond=0)


def iso(dt):
    return dt.isoformat().replace("+00:00", "Z")


def ago(**kw):
    return iso(NOW - timedelta(**kw))


def ahead(**kw):
    return iso(NOW + timedelta(**kw))


FLEETS = {
    "northwind": {
        # Dual approval OFF — a single admin may act, with an audit record.
        "policy": {
            "name": "northwind-fleet-policy", "display_name": "Northwind fleet policy",
            "description": "Safety settings for the Northwind Systems fleet.",
            "require_dual_approval": False,
            "stale_observation_minutes": 30,
            "auto_release_grace_minutes": 15,
            "escalation_channel": "#platform-oncall",
        },
        "clusters": [
            {"name": "nw-prod-a", "display_name": "nw-prod-a",
             "description": "Production cluster, us-east1, carries customer traffic.",
             "provider": "gcp", "region": "us-east1", "capacity": 8,
             "cluster_state": "healthy", "last_observed_at": ago(minutes=2),
             "observation_note": "Reconciler polled successfully."},
            # Unreachable, and the last successful observation is well past the
            # 30-minute staleness window. This is what blocks resolution.
            {"name": "nw-edge-2", "display_name": "nw-edge-2",
             "description": "Edge cluster, europe-west4, currently unreachable from the reconciler.",
             "provider": "aws", "region": "eu-west-1", "capacity": 4,
             "cluster_state": "unreachable", "last_observed_at": ago(hours=6),
             "observation_note": "Reconciler has not completed a poll since the VPN flap."},
        ],
    },
    "contoso": {
        # Dual approval ON — the same act now needs a second person.
        "policy": {
            "name": "contoso-fleet-policy", "display_name": "Contoso fleet policy",
            "description": "Safety settings for the Contoso Cloud fleet.",
            "require_dual_approval": True,
            "stale_observation_minutes": 20,
            "auto_release_grace_minutes": 30,
            "escalation_channel": "#cloud-platform",
        },
        "clusters": [
            {"name": "ct-stage-1", "display_name": "ct-stage-1",
             "description": "Staging cluster, us-central1, shared across product teams.",
             "provider": "gcp", "region": "us-central1", "capacity": 6,
             "cluster_state": "healthy", "last_observed_at": ago(minutes=4),
             "observation_note": "Reconciler polled successfully."},
            {"name": "ct-dev-3", "display_name": "ct-dev-3",
             "description": "Development cluster, ap-south-1, ephemeral preview workloads.",
             "provider": "aws", "region": "ap-south-1", "capacity": 10,
             "cluster_state": "degraded", "last_observed_at": ago(minutes=9),
             "observation_note": "Two nodes cordoned; observation still current."},
        ],
    },
}

# (environment, lease, finding) rows per tenant, keyed by the cluster they sit on.
ENVIRONMENTS = {
    "northwind": [
        # --- Scenario 1: actionable drift. Fresh observation, single approval. ---
        {"cluster": "nw-prod-a", "env": {
            "name": "nw-prod-a-preview-4821", "display_name": "preview-4821",
            "description": "Preview environment for the checkout rewrite spike.",
            "env_kind": "preview", "env_state": "disputed", "observed_allocation": "allocated",
            "namespace_path": "team-atlas/preview-4821", "current_holder": "nw-eng@northwind.example",
            "current_team": "atlas", "monthly_cost_usd": 412.0},
         "lease": {
            "name": "lease-nw-4821", "display_name": "preview-4821 · atlas",
            "description": "Expired lease whose release attempt failed three times.",
            "team": "atlas", "requested_by": "nw-eng@northwind.example",
            "owner_username": "nw-eng@northwind.example", "purpose": "Checkout rewrite spike",
            "claimed_at": ago(days=6), "expires_at": ago(hours=19),
            "lease_state": "release_failed", "release_attempts": 3,
            "last_release_error": "namespace terminating: 2 finalizers remain on statefulset/checkout-db"},
         "finding": {
            "name": "drift-nw-4821", "display_name": "preview-4821 still allocated",
            "description": "Lease released in the record but the cluster still reports the namespace allocated.",
            "claimed_allocation": "free", "observed_allocation": "allocated",
            "detected_at": ago(hours=18), "observation_age_minutes": 2,
            "severity": "high", "finding_state": "open", "resolution": "unresolved",
            "wasted_cost_usd": 261.4}},

        # --- Scenario 2: UNRESOLVABLE. Cluster unreachable, observation stale. ---
        {"cluster": "nw-edge-2", "env": {
            "name": "nw-edge-2-persistent-01", "display_name": "edge-persistent-01",
            "description": "Long-lived edge environment on an unreachable cluster.",
            "env_kind": "persistent", "env_state": "disputed", "observed_allocation": "unknown",
            "namespace_path": "team-borealis/edge-01", "current_holder": "nw-eng@northwind.example",
            "current_team": "borealis", "monthly_cost_usd": 880.0},
         "lease": {
            "name": "lease-nw-edge-01", "display_name": "edge-persistent-01 · borealis",
            "description": "Expired lease on a cluster the reconciler cannot currently reach.",
            "team": "borealis", "requested_by": "nw-eng@northwind.example",
            "owner_username": "nw-eng@northwind.example", "purpose": "Edge latency testing",
            "claimed_at": ago(days=21), "expires_at": ago(days=2),
            "lease_state": "release_failed", "release_attempts": 7,
            "last_release_error": "dial tcp: i/o timeout contacting cluster API server"},
         "finding": {
            "name": "drift-nw-edge-01", "display_name": "edge-persistent-01 state unknown",
            "description": "Cannot confirm whether the workload is dead or the cluster is merely partitioned.",
            "claimed_allocation": "free", "observed_allocation": "unknown",
            "detected_at": ago(days=2), "observation_age_minutes": 360,
            "severity": "high", "finding_state": "open", "resolution": "unresolved",
            "wasted_cost_usd": 58.7}},

        # --- Healthy rows, so the fleet view is not all fire. ---
        {"cluster": "nw-prod-a", "env": {
            "name": "nw-prod-a-preview-4902", "display_name": "preview-4902",
            "description": "Active preview environment for the billing migration.",
            "env_kind": "preview", "env_state": "claimed", "observed_allocation": "allocated",
            "namespace_path": "team-atlas/preview-4902", "current_holder": "nw-eng@northwind.example",
            "current_team": "atlas", "monthly_cost_usd": 388.0},
         "lease": {
            "name": "lease-nw-4902", "display_name": "preview-4902 · atlas",
            "description": "Active lease with two days remaining.",
            "team": "atlas", "requested_by": "nw-eng@northwind.example",
            "owner_username": "nw-eng@northwind.example", "purpose": "Billing migration",
            "claimed_at": ago(days=2), "expires_at": ahead(days=2),
            "lease_state": "active", "release_attempts": 0},
         "finding": None},

        {"cluster": "nw-prod-a", "env": {
            "name": "nw-prod-a-preview-4910", "display_name": "preview-4910",
            "description": "Preview environment expiring within the day.",
            "env_kind": "preview", "env_state": "expiring", "observed_allocation": "allocated",
            "namespace_path": "team-cinder/preview-4910", "current_holder": "nw-admin@northwind.example",
            "current_team": "cinder", "monthly_cost_usd": 402.0},
         "lease": {
            "name": "lease-nw-4910", "display_name": "preview-4910 · cinder",
            "description": "Lease expiring in under six hours.",
            "team": "cinder", "requested_by": "nw-admin@northwind.example",
            "owner_username": "nw-admin@northwind.example", "purpose": "Search relevance tuning",
            "claimed_at": ago(days=5), "expires_at": ahead(hours=5),
            "lease_state": "expiring", "release_attempts": 0},
         "finding": None},

        {"cluster": "nw-edge-2", "env": {
            "name": "nw-edge-2-preview-11", "display_name": "edge-preview-11",
            "description": "Free preview slot on the edge cluster, awaiting a claim.",
            "env_kind": "preview", "env_state": "available", "observed_allocation": "free",
            "namespace_path": "pool/edge-preview-11", "monthly_cost_usd": 0.0},
         "lease": None, "finding": None},
    ],

    "contoso": [
        # --- Scenario 3: parked awaiting a second approver. ---
        {"cluster": "ct-stage-1", "env": {
            "name": "ct-stage-1-preview-77", "display_name": "preview-77",
            "description": "Preview environment disputed and awaiting a second approval.",
            "env_kind": "preview", "env_state": "disputed", "observed_allocation": "allocated",
            "namespace_path": "team-quartz/preview-77", "current_holder": "ct-eng@contoso.example",
            "current_team": "quartz", "monthly_cost_usd": 520.0},
         "lease": {
            "name": "lease-ct-77", "display_name": "preview-77 · quartz",
            "description": "Expired lease whose release failed on a stuck volume detach.",
            "team": "quartz", "requested_by": "ct-eng@contoso.example",
            "owner_username": "ct-eng@contoso.example", "purpose": "Ingest pipeline load test",
            "claimed_at": ago(days=9), "expires_at": ago(days=1),
            "lease_state": "release_failed", "release_attempts": 4,
            "last_release_error": "persistentvolumeclaim still bound: detach timed out after 300s"},
         "finding": {
            "name": "drift-ct-77", "display_name": "preview-77 awaiting second approval",
            "description": "Force reclaim requested by one admin and waiting on a second approver.",
            "claimed_allocation": "free", "observed_allocation": "allocated",
            "detected_at": ago(hours=22), "observation_age_minutes": 4,
            "severity": "high", "finding_state": "awaiting_second_approval",
            "resolution": "force_reclaim",
            "requested_by": "ct-admin@contoso.example", "requested_at": ago(hours=3),
            "resolution_note": "Namespace has been idle for 22h; proposing a force reclaim.",
            "wasted_cost_usd": 476.2}},

        {"cluster": "ct-stage-1", "env": {
            "name": "ct-stage-1-preview-81", "display_name": "preview-81",
            "description": "Active staging preview for the reporting service.",
            "env_kind": "preview", "env_state": "claimed", "observed_allocation": "allocated",
            "namespace_path": "team-quartz/preview-81", "current_holder": "ct-eng@contoso.example",
            "current_team": "quartz", "monthly_cost_usd": 340.0},
         "lease": {
            "name": "lease-ct-81", "display_name": "preview-81 · quartz",
            "description": "Active lease with four days remaining.",
            "team": "quartz", "requested_by": "ct-eng@contoso.example",
            "owner_username": "ct-eng@contoso.example", "purpose": "Reporting service rework",
            "claimed_at": ago(days=1), "expires_at": ahead(days=4),
            "lease_state": "active", "release_attempts": 0},
         "finding": None},

        {"cluster": "ct-dev-3", "env": {
            "name": "ct-dev-3-persistent-02", "display_name": "dev-persistent-02",
            "description": "Shared development environment for the platform team.",
            "env_kind": "persistent", "env_state": "claimed", "observed_allocation": "allocated",
            "namespace_path": "team-platform/dev-02", "current_holder": "ct-admin@contoso.example",
            "current_team": "platform", "monthly_cost_usd": 610.0},
         "lease": {
            "name": "lease-ct-dev-02", "display_name": "dev-persistent-02 · platform",
            "description": "Long-running platform team lease.",
            "team": "platform", "requested_by": "ct-admin@contoso.example",
            "owner_username": "ct-admin@contoso.example", "purpose": "Shared tooling",
            "claimed_at": ago(days=30), "expires_at": ahead(days=60),
            "lease_state": "active", "release_attempts": 0},
         "finding": None},

        {"cluster": "ct-dev-3", "env": {
            "name": "ct-dev-3-preview-14", "display_name": "dev-preview-14",
            "description": "Free development preview slot, awaiting a claim.",
            "env_kind": "preview", "env_state": "available", "observed_allocation": "free",
            "namespace_path": "pool/dev-preview-14", "monthly_cost_usd": 0.0},
         "lease": None, "finding": None},

        {"cluster": "ct-dev-3", "env": {
            "name": "ct-dev-3-preview-15", "display_name": "dev-preview-15",
            "description": "Free development preview slot, awaiting a claim.",
            "env_kind": "preview", "env_state": "available", "observed_allocation": "free",
            "namespace_path": "pool/dev-preview-15", "monthly_cost_usd": 0.0},
         "lease": None, "finding": None},
    ],
}
