# Reclaim

Environment lease tracking and drift reconciliation for shared Kubernetes fleets.
Built on [Supero](https://supero.dev) over MCP.

Teams claim time-boxed leases on environments. When a lease ends and the environment
does not come back, Reclaim records the disagreement instead of asserting a state it
cannot verify.

All data in this app is invented.

---

## The one decision everything else follows from

An environment carries **two separate truths**:

| Field | Meaning |
|---|---|
| `environment.env_state` | what Reclaim *believes* |
| `environment.observed_allocation` | what the cluster last *reported* |
| `cluster.last_observed_at` | **how old that report is** |

That third field is the load-bearing one. Without it these two situations are
byte-identical:

```
record says released · cluster says allocated · we polled 2 minutes ago
record says released · cluster says allocated · we have not polled in 6 hours
```

The first is a leaked environment. The second is a cluster we cannot see. A
reconciler that cannot tell them apart will force-reclaim live production
workloads behind a network partition, confidently, and log it as a success.

So `Reclaim` stores observation freshness as data, and **withholds the destructive
resolution whenever the observation is older than the organisation's staleness
window** — with the reason on screen, not a greyed-out button.

## Data model

```
Organisation (tenant)
  └── FleetPolicy          one per org: staleness window, dual-approval flag
  └── Cluster              provider, region, capacity, cluster_state, last_observed_at
        └── Environment    env_kind, env_state, observed_allocation, namespace_path
              └── Lease    team, requested_by, claimed_at, expires_at, lease_state
              └── DriftFinding   claimed vs observed, severity, finding_state, resolution
```

## The state that has no happy path

```
claim → active → expiring → release requested
                                 │
                   ┌─────────────┴─────────────┐
            cluster says free            cluster says allocated
                   │                             │
              released                     RELEASE FAILED
              env available                env disputed
                                           drift_finding opened
                                                   │
                        ┌──────────────────────────┼──────────────────────────┐
                  force_reclaim              mark_external                escalate
              destroys running work    someone vouches for it       pages the owning team
              ── withheld if the        env → quarantined            finding stays open
                 observation is stale   (NOT returned to the pool)
```

There is no "resolve automatically" branch, and that is the point. Every option
costs something, so the system surfaces the choice and records who made it and why.

`mark_external` and `escalate` stay available on a stale observation because they
are human assertions about ownership, not inferences from a reading. Only the
destructive one depends on the reading being fresh.

## Roles

| | platform_engineer | tenant_admin |
|---|---|---|
| Fleet, environments, policy | read | full |
| Leases | **own only** (owner-scoped, server-enforced) | full |
| Drift findings | read + **report**, never resolve | resolve |
| `drift_finding.wasted_cost_usd` | **hidden** (field-level, server-enforced) | visible |

`platform_engineer` is a custom role on a `tenant_user` base. Leases use
`filter_field="owner_username"`, which the platform applies to reads *and* writes —
so it is honestly "my leases", not "my team's leases". A per-team scope would need
a second-party filter the platform does not offer today; the fleet view carries the
denormalised holder so an engineer can still see who holds what.

## Multi-tenancy

On from generation, not retrofitted. Two organisations are seeded —
**Northwind Systems** (dual approval off) and **Contoso Cloud** (dual approval on) —
so the model is exercised against a second tenant from the first run, and the two
policy branches are both demoable.

Login passes `tenant=''` so the server resolves each user's own organisation by
email. Passing `cfg.tenant` would force every named-tenant user into
`default-tenant` and 401.

## Why dual-approval is a flag and tenancy is not

`fleet_policy.require_dual_approval` is per-organisation and defaults **off** —
deliberately the same shape Supero criticises in its own platform.

The distinction that makes it defensible: **a flag is only honest when turning it on
later is cheap.** Flipping dual-approval changes the next decision and nothing else;
nothing already stored becomes wrong. Retrofitting tenancy rewrites every query,
every policy and the login path. One qualifies as a setting. The other has to be
structural, so it is.

## Workflows

Five, all CRUD — no integration requires a secret configured outside the bundle.

| id | trigger | what it does |
|---|---|---|
| `on_lease_claimed` | event: `@create:reclaim:lease` | marks the environment claimed **server-side** (engineers are read-only on environments, so this cannot be a client write) |
| `release_lease` | UI | branches: releases cleanly, or records the failure and opens a finding |
| `reconcile_failed_release` | UI | compensating saga; unwinds if it cannot finish recording the dispute |
| `apply_drift_resolution` | UI | branches on which resolution was chosen |
| `on_drift_detected` | event: `@create:reclaim:drift_finding` | stamps the finding |

Every workflow-driven action also names the equivalent CRUD writes and falls back to
them, because importing the `workflows` service needs an elevated permission a
project-scoped deploy key can be refused — silently. The fallback runs as the caller,
so an engineer's fallback does strictly less than an admin's.

## Accounts

| Email | Role | Organisation |
|---|---|---|
| `nw-admin@northwind.example` | platform admin | Northwind Systems (dual approval **off**) |
| `nw-eng@northwind.example` | platform engineer | Northwind Systems |
| `ct-admin@contoso.example` | platform admin | Contoso Cloud (dual approval **on**) |
| `ct-eng@contoso.example` | platform engineer | Contoso Cloud |
| `admin@reclaim.dev` | super admin | can switch organisation |

Password for all: `Password123!`

## What to look at

1. **Fleet** — `nw-edge-2` is flagged: unreachable, last observed 6 hours ago.
2. **Drift queue** as `nw-admin` — two findings. One is actionable. The other
   (`edge-persistent-01`) has force-reclaim **withheld**, with the reason stated.
3. **Drift queue** as `ct-admin` — `preview-77` is parked awaiting a second
   approver, and the admin who requested it cannot approve their own request.
4. **Drift queue** as `nw-eng` — the `wasted_cost_usd` column reads *hidden*. The
   server strips it; the UI is not choosing to hide it.
5. **My leases** as `nw-eng` — only their own rows, filtered server-side.

## Running it locally

```sh
cp .env.example .env     # fill in SUPERO_API_KEY
./run.sh                 # uploads schemas, seeds, applies policies, serves on :5648
```
