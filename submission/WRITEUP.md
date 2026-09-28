# Supero build challenge — Reclaim

**Live URL:** _(filled in below)_
**Source:** _(optional GitHub link)_
**Built:** over MCP, from Claude Code, against `app.supero.dev/mcp/v1/messages`.

---

## What I was modelling

Environment leases on a shared Kubernetes fleet — the thing I ran at my last job,
where one production cluster, two staging and a handful of dev clusters were claimed
by teams and, routinely, not given back. All data here is invented.

I picked it because it is the same shape as the open problem in your own posting:

> "is this app live?" still has two disjoint sources of truth — a backend record and
> five fields the browser writes — and no teardown path reconciles them.

Reclaim is four working entities plus one settings row:
`cluster`, `environment`, `lease`, `drift_finding`, `fleet_policy`.

**The one decision the rest follows from:** an environment stores what Reclaim
*believes* (`env_state`) separately from what the cluster last *reported*
(`observed_allocation`), and the cluster stores **when that report was taken**
(`last_observed_at`).

That third field is why the app works. Without it, these are the same row:

```
record says released · cluster says allocated · polled 2 minutes ago
record says released · cluster says allocated · not polled in 6 hours
```

The first is a leaked environment worth reclaiming. The second is a cluster you
cannot see. Treat them alike and you force-reclaim live workloads behind a network
partition and log it as a success. So the destructive resolution is **withheld**
whenever the observation is older than the organisation's staleness window, and the
UI says why rather than greying out a button.

## The state with no happy path

A lease expires, the release is attempted, and it **fails**. The record says
released; the cluster still says allocated. There is no correct automatic action, so
the environment goes to `disputed`, a finding opens, and an admin chooses between
three options that are all bad:

- **force reclaim** — destroys whatever is running, which may be someone's work
- **mark external** — someone vouches that it is legitimately managed elsewhere; the
  slot goes to `quarantined`, *not* back into the pool
- **escalate** — ownership is unclear; page the owning team, leave it open

Only the destructive one depends on a fresh observation. The other two are human
assertions about ownership, not inferences from a reading, so staleness does not bar
them. The seed ships one of each: one actionable, one **unresolvable** (unreachable
cluster, 6-hour-old observation), one parked awaiting a second approver.

## Multi-tenancy

On from generation. Two organisations — Northwind Systems and Contoso Cloud — with
different policies, so the second tenant is exercised from the first run rather than
being a claim. `platform_engineer` is owner-scoped on leases; `wasted_cost_usd` is
hidden from engineers at the field level, server-side.

I probed my own boundary, as invited. Findings are in `TENANT-PROBE.md`.

## One decision I reversed

I started with a per-*team* scope for engineers — "an engineer sees their team's
leases" — and it survived about as long as it took to read how record filters work.
The platform resolves **one** record filter per (role, entity) and applies it to
reads *and* writes, and the only sanctioned owner field is `owner_username` matched
against `$user.name`. There is no `owner_in`, no multi-field filter, so "my team's
rows" is not expressible without either widening to the whole organisation or
inventing a second role per team.

I reversed to strict `owner_username` scoping and moved the team-level visibility
into the *fleet* view, which reads environments (organisation-wide) and carries a
denormalised `current_holder`. So an engineer can see who holds what, but only their
own lease records with the error detail on them.

That is a worse product and a more honest one. The alternative was a UI that filtered
by team client-side while the server returned everything — which looks identical in a
demo and is a data leak in production.

## What I liked most

**The MCP data-plane contract, and that it is enforced by the docs rather than
hoped for.** The server instructions open by forbidding the agent from reading local
project state, running a local CLI, or inferring anything from disk — and separately
forbid tunnelling a locally-run app through cloudflared and calling it a deployment.
Both of those are things an agent will absolutely do to make a task look finished.
Writing them down as a contract, at the top, is someone having watched it happen and
closed the door.

Second: `build_doctor` earns its place. `build_validate` passed my bundle clean, and
doctor then caught four things that would have shipped broken — including two that
were *masked* by a third until I fixed it. That is a real preflight, not a linter.

## What I would improve

Four things, in the order I would fix them.

### 1. `build_stage_bundle` returns an unreachable internal address

It hands back:

```
"upload_url": "http://platform-core-service:8083/api/v1/files/stephen-rhodes/upload"
```

That is in-cluster service DNS. It resolves inside your namespace and nowhere else,
so it cannot work from any MCP client — which is the only thing that calls this tool.
The same path on `https://api.supero.dev` works first try and returns a valid
`file_id`. Also note `http://`, not `https://`.

Fix is a one-liner; the interesting part is that nothing catches it, which suggests
the large-bundle path has no end-to-end test from outside the cluster.

### 2. Multi-tenancy is not a flag on the MCP path — it is an *inference*

Your posting says it is "a generation-time flag, it defaults to off." Over MCP it is
not a flag at all. `build_create_project` has no tenancy parameter. The only
`is_multi_tenant` lives on `build_plan`, it is optional, and its own description says
*"Inferred from the description if omitted."*

That is worse than default-off, because default-off is at least legible. An inferred
hint means a keyword in your prose silently decides your tenancy model, nothing on
the project record says which way it went, and the consequence lands in the auth
layer — the most expensive place to retrofit.

**What I would do about it:** make it a required argument with no default, on
`build_create_project`, where it is durable and inspectable. Not "default on" —
*refuse to guess*. The test for whether something may be a flag is whether turning it
on later is cheap. I applied that test inside my own app: `require_dual_approval` is
a per-org flag defaulting off, because flipping it changes only the next decision and
invalidates nothing already stored. Tenancy fails the same test, so it should not be
a flag, and certainly not an inferred one.

### 3. The vertical detector misclassifies, silently, and it cascades

My description named Kubernetes, clusters, environments, platform engineering and
drift reconciliation. `build_plan` returned:

```
Detected vertical: real estate / property
```

It keyed on the word **lease**. Then it told me to build a Photo Gallery, Floor Plan,
Location & Neighborhood and Agent Contact, with a "hero image" — for a Kubernetes
cluster — and recommended `commerce-marketplace` as my reference app and a
photographic/lifestyle/serif theme for an internal ops tool. Passing
`is_multi_tenant: true` explicitly fixed the login section and left the vertical
wrong.

One misclassification cascaded into five wrong recommendations, none of them flagged
as low-confidence. The output does print a confidence signal for the hero archetype —
so surfacing the same for the vertical, and saying "I am not sure, tell me" below a
threshold, would cost little. An agent that trusts this output ships a Floor Plan tab.

### 4. `WORKFLOW_DEFINITIONS` and its own linter disagree on the schema

SKILLS §6 documents workflow definitions with `"id"`, and event bindings referencing
them with `"workflow_id"`. I wrote exactly that. `build_doctor` then reported every
definition as *missing `workflow_id`*, with `Available: ['<none defined>']`, and both
event bindings as dangling. Emitting **both** keys fixed it.

Once that cleared, doctor surfaced three further requirements that appear nowhere in
SKILLS: every definition needs `"status": "Active"|"Draft"|"Disabled"|"Archived"`; a
`crud_operation` compensate block needs its own `operation` verb and `record_uuid`;
and under `on_error: "compensate"` even a pure bookkeeping step needs an explicit
`skip_acknowledged`. All reasonable rules — none documented, and all invisible until
the key-name mismatch above was resolved, because that error short-circuited the rest
of the check.

The fix is not more docs. It is that SKILLS and the doctor should be generated from
one schema, so they cannot drift.

### 5. An unregisterable custom role does not disable its policy — it *escalates* it onto `tenant_admin`

This is the most serious thing I found, and it cost me a whole deploy.

I registered a custom role the documented way — `RoleDef(name="platform_engineer",
base_role="tenant_user", ...)` passed as `custom_roles=` to `setup.run`, with a
matching restrictive `PolicyDef`. Creating a role is a domain-level write, and a
cloud deploy runs under a **project-scoped** key, so registration was refused:

```
Permission denied: Domain-level objects require admin access
```

So far, fine — a capability my key lacks. What happened next is not fine. The
platform did not drop the orphaned policy, and did not fail the run. It
**normalised the policy onto a built-in role**:

```
role 'platform_engineer' is not a platform RBAC role -> mapped to 'tenant_admin'
```

My `default_access="none"` engineer policy landed **on top of the `tenant_admin`
policy and replaced it.** The seed principal is an admin, so the seed then failed:

```
Failed to seed Cluster nw-prod-a: HTTP 403 --
  "Your role does not have create access to reclaim:cluster"
SEED FAILURES — Cluster: 4 lost · Environment: 10 lost · FleetPolicy: 2 lost
```

Note exactly *which* entities failed. `cluster`, `environment` and `fleet_policy`
were the three my engineer policy made read-only. `lease` and `drift_finding` —
the two I had granted `can_create` — seeded fine. The restriction I wrote for the
**least**-privileged role was applied verbatim to the **most**-privileged one.

The app deployed "successfully" and served an empty fleet. The run exited 0.

**Three separate problems here, in descending severity:**

1. **Normalising an unknown role onto `tenant_admin` is a privilege-boundary
   violation in the dangerous direction.** A policy written for a restricted role
   should never be able to land on an admin role. If the target role cannot be
   resolved, the only safe outcomes are to drop the policy or to fail the setup.
   Silently retargeting it at the most privileged built-in is the one behaviour
   that can lock an operator out of their own project.
2. **The `base_role` was right there.** I declared `base_role="tenant_user"`, and
   the *users* carrying the role were correctly normalised to `tenant_user`. Only
   the *policy* went to `tenant_admin`. Users and policies normalise the same
   unknown role in opposite directions, which is how the two halves end up
   disagreeing about who the policy was for.
3. **A seed that loses 16 of 27 records should not exit 0.** The log says the
   failures are "transient/unclassified, not structural" and points at
   `SUPERO_STRICT_SEED=1`. A 403 on create is neither transient nor unclassified —
   it is the most structural failure there is. I would invert that default: a
   permission denial during seed fails the build, and `SUPERO_LENIENT_SEED=1` opts
   out.

SKILLS §6a does warn that an unregistered role gets "silently normalized to a
built-in" and says to register `RoleDef`s first — which I did. What it does not say
is that registration is **impossible** under the key a cloud deploy actually runs
with, or that the normalisation target for a *policy* is `tenant_admin` rather than
the `base_role` you declared.

**How I fixed it:** dropped the custom role entirely and wrote the engineer policy
against the built-in `tenant_user` — which is what the platform was normalising my
users to anyway, so the custom role was buying a label and costing an outage.

### 6. `workflows` cannot be imported by the key that deploys the app

Same root cause, less damage. My five workflow definitions are valid and pass
`build_doctor` with zero findings, but the deploy logs:

```
'workflows': Unexpected error: Permission denied: Domain-level objects require admin access
workflows            Import failed
Workflow 'on_lease_claimed': Create Failed: Schema not found for type
  'workflow_definition' in domain 'stephen-rhodes', namespace 'wf'
```

So on a cloud deploy, **no workflow and no event binding can ever run** — the
feature is effectively unavailable to exactly the deployment path the platform
steers you toward. `build_doctor` flags this as a warning and is right to, but the
warning reads as "may log a permission denied (non-fatal)" when the real
consequence is that a documented, heavily-recommended capability is simply absent
in production.

I designed for it: every workflow-driven action in Reclaim also names the CRUD
writes that are equivalent and falls back to them, running as the caller so RBAC
still decides. The app works either way. But an app that followed SKILLS' advice to
"wire 2-3 real workflows + EVENT_BINDINGS" and *trusted* them would ship with dead
buttons and a stale fleet view, and nothing in the deploy output says so loudly
enough.

---

## Notes on scope

Time-boxed per your instruction. Five entities, two roles, one unhappy path, no
integrations requiring a secret. I deliberately did not add a chart-heavy dashboard,
AI assistant, or a public catalog — the app is internal, so its logged-out surface is
a value-prop sign-in rather than a data catalog, which is also what SKILLS §8.4b
prescribes for this shape of app.
