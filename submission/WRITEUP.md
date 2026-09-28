# Supero build challenge — Reclaim

**Live URL:** _(filled in at submission)_
**Source:** https://github.com/aethyriion/reclaim
**Built:** over MCP, from Claude Code, against `app.supero.dev/mcp/v1/messages`.

Full technical detail on the platform findings, with runnable reproductions, is in
[`FINDINGS.md`](./FINDINGS.md) and [`repro/`](./repro). Captured output is in
[`EVIDENCE.txt`](./EVIDENCE.txt).

---

## What I was modelling

Environment leases on a shared Kubernetes fleet — the thing I ran at my last job,
where one production cluster, two staging and a handful of dev clusters were claimed
by teams and, routinely, not given back. All data here is invented.

I picked it because it is the same shape as the open problem in your own posting:

> "is this app live?" still has two disjoint sources of truth — a backend record and
> five fields the browser writes — and no teardown path reconciles them.

Five entities: `cluster`, `environment`, `lease`, `drift_finding`, and a one-row
`fleet_policy` per organisation.

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

`staleness.ts` is pure and takes `now` as an argument, so the verdict rendered on
screen can never drift from the one an action is checked against. It has the only
unit tests in the project.

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
them.

The seed ships one of each: one actionable, one **unresolvable** (unreachable
cluster, six-hour-old observation), one parked awaiting a second approver.

## Multi-tenancy

On from the first run, not retrofitted. And because "survives a second tenant" can
be passed by hard-coding two, I added a **third** — Fabrikam Industrial — after the
app was built, deployed and verified.

```
northwind=2 clusters   contoso=2 clusters   fabrikam=2 clusters
nw-admin sees 2, 0 foreign · ct-admin sees 2, 0 foreign · fb-admin sees 2, 0 foreign
windows: northwind=30m   contoso=20m   fabrikam=10m
fb-lab-2 observed 13m ago  ->  Fabrikam stale=True, Northwind stale=False
```

That last line is the one I care about: the **same reading** is stale for one
organisation and fresh for another, because the staleness window is tenant policy
rather than a constant. Isolation held three ways.

Adding the tenant cost a `config.py` entry, two users, seed rows and one platform
tenant record — **zero schema changes, zero policy changes, zero UI changes.**

It found exactly one bug, and it was mine: the tenant switcher listed the two seeded
organisations as literal `<option>` elements, so Fabrikam existed on the platform and
in the data and was invisible in the UI. That is precisely the failure a second tenant
is supposed to catch, and it took a third to catch it. The switcher now loads its list
at runtime.

I also attacked the boundary directly, as invited. Seven probes, in
[`TENANT-PROBE.txt`](./TENANT-PROBE.txt): **6 held, 0 breached.** Cross-tenant reads
and writes are refused (`Access denied: this reclaim:cluster belongs to another
tenant`), a forged `X-Tenant` header changes nothing, an engineer cannot resolve
drift, and lease reads are owner-scoped server-side. The seventh is not a breach but
is not clean either — it is finding 1.

**On the flag itself, since you asked.** You are right that it is opt-in and defaults
off, and the failure is worse than "it is off": tenants get created, data is
partitioned correctly, the server enforces isolation, and the UI silently behaves as
though none of that happened. Nothing errors.

I would not default it on. I would stop having a flag that can disagree with the
data. `config.py` `tenants[]` already states the answer, and go-live already derives
the flag from it — so derive it everywhere, not just at go-live. If a flag must
remain, make disagreement loud: `build_doctor` already reported
`named_tenants: ["contoso", "northwind"]` for my bundle, so "tenants declared, flag
off" is a warning it is already holding both inputs for.

The general rule is the one I applied inside Reclaim: **a flag is only honest when
turning it on later is cheap.** `require_dual_approval` passes that test. Tenancy
fails it. Which is why, in my app, tenancy is structural and the approval gate is the
flag — and why deriving `SUPERO_IS_MULTI_TENANT` beats defaulting it.

## One decision I reversed

I started with a per-*team* scope for engineers — "an engineer sees their team's
leases" — and it survived about as long as it took to read how record filters work.
The platform resolves one record filter per (role, entity) and applies it to reads
*and* writes, and the only sanctioned owner field is `owner_username` matched against
`$user.name`. There is no `owner_in`, no multi-field filter, so "my team's rows" is
not expressible without either widening to the whole organisation or inventing a role
per team.

I reversed to strict `owner_username` scoping and moved team-level visibility into
the *fleet* view, which reads environments organisation-wide and carries a
denormalised `current_holder`. An engineer can see who holds what, but only their own
lease records with the error detail on them.

That is a worse product and a more honest one. The alternative was a UI that filtered
by team client-side while the server returned everything — identical in a demo, a
data leak in production.

## What I liked most

**The MCP data-plane contract, and that it is enforced by the docs rather than hoped
for.** The server instructions open by forbidding the agent from reading local project
state, running a local CLI, or inferring anything from disk — and separately forbid
tunnelling a locally-run app through cloudflared and calling it a deployment. Both are
things an agent will absolutely do to make a task look finished. Writing them down as
a contract, at the top, is someone having watched it happen and closed the door.

Second, and more concretely: **`build_smoke_test(expected_app_js_sha1=...)` saved this
submission.** A deploy reported `running` with the new version's `generation_uuid`
while serving the previous bundle. That check caught it, named the remedy, and the
remedy worked. It is the only reason I did not ship a stale build and call it done.

## What I would improve

Five items. Two are confirmed bugs with reproductions; two are quality issues; one is
a root cause for something you already catch.

**Before those, three retractions.** I initially had eight findings. Three were me not
having read the documentation, and I would rather hand you a corrected list than a
confident wrong one.

### 1. Policy record filters and `hidden_fields` leak across roles — confirmed

SKILLS §6 states: *"The platform resolves one record filter per (role, entity)."*
Per (role, entity). It does not.

`tenant_admin` has an explicit rule on `lease` with **no** `filter_field` and on
`drift_finding` with **no** `hidden_fields`. The `tenant_user` restrictions on the
same entities are applied to it anyway:

```
ground truth (API key)              4 leases in northwind; wasted_cost_usd stored
tenant_admin lists leases           1     ← its own rule has no filter
tenant_admin reads wasted_cost_usd  False ← its own rule hides nothing
tenant_user  (control)              3 own leases, field correctly hidden
```

Fail-closed, so not a data leak — but an operator silently loses rows and fields they
own, and it is unfixable from the policy file because the permissive rule is already
there and is being ignored.

It cost me a deploy before I understood it: the seed principal is an admin, so
`setup.py` 403'd on exactly the three entities my `tenant_user` policy had made
read-only, **lost 16 of 27 records, and exited 0.** A permission denial during seed
should fail the build; the log currently classifies it as "transient/unclassified".

*Repro: `repro/01_policy_scope_leak.py`*

### 2. `build_stage_bundle` returns an address only reachable inside your cluster — confirmed

```
upload_url: http://platform-core-service:8083/api/v1/files/<domain>/upload
host resolves: False    →  [Errno -3] Temporary failure in name resolution
```

The same path on `https://api.supero.dev` works first try and returns a valid
`file_id`. The endpoint is right; only the host is wrong, and it is `http://`. The
tool's entire audience is external MCP clients, the documented flow cannot be
completed as written, and no doc mentions the upload host.

*Repro: `repro/02_stage_bundle_internal_url.py`*

### 3. `build_plan`'s vertical detector misclassifies, and it cascades silently

A description naming Kubernetes, clusters, environments and drift reconciliation is
classified **real estate / property** — on the word *lease*. It then recommends Photo
Gallery, Floor Plan, Location & Neighborhood and Agent Contact for a Kubernetes
cluster, a photographic/serif theme for an internal ops tool, and
`commerce-marketplace` as the reference app.

The response prints a confidence for the hero archetype and **none for the vertical**,
so a caller has nothing to gate on. Surfacing one, and saying "unsure" below a
threshold, would cost little.

*Repro: `repro/03_vertical_misclassification.py`*

### 4. `build_doctor` stops checking a UI it does not recognise, and does not say so

Two minimal bundles, identical except `ui/app.js` — one hand-written React, one a
loader injecting a compiled bundle:

```
A) React    richness present: true (score 4)   is_path_b: true    components: 3
B) loader   richness present: FALSE            is_path_b: false   components: 0
both: errors 0, verdict "ready (review warnings)"
```

For B the `richness` block is **absent**, not scored zero, and the verdict is
unchanged. The app has a landing page, a tenant picker and ten routed screens; none is
visible to a grep over one file.

I am not asking you to support bundlers. A gate that no-ops on unrecognised input
passes a real regression for the same reason it passes this. One line fixes the
feedback without changing a check: *"ui/app.js looks like a loader; UI checks
skipped."*

*Repro: `repro/04_doctor_skips_bundled_ui.py`*

### 5. Deploys use a mutable `:latest` tag — a cause for something you already catch

```
image_uri: .../superoapps/preview-<domain>-<project>:latest
```

A floating per-service tag, reused every deploy. A revision pinned to it carries
nothing identifying which build it got, so nothing can detect it got the wrong one —
and `build_teardown` fixes it because deleting the service forces a fresh pull.

Deploy by digest or tag per version (`build_publish` already returns a `checksum`),
and return the running artifact's hash from `build_deploy_status`, so `running` means
running *this*. That makes "which version is in that pod" the five-second question
your posting says it should be.

*Repro: `repro/05_deploy_status_artifact.py`*

### Retracted — my errors

- **The workflow definition schema is fully documented.** I reported `workflow_id`,
  `status` and the per-step `compensate` requirement as undocumented, and framed
  `build_doctor` rejecting my definitions as the linter disagreeing with SKILLS.
  `build_get_skills(doc='workflows')` specifies all three. The doctor was right; I
  built from the §6 summary without fetching the companion doc. The only thing I would
  still raise is signposting: §6 reads as complete, and a one-line pointer to the
  authoritative schema would have saved a cycle.
- **Multi-tenancy: I was wrong twice, in opposite directions.** I first claimed the
  flag was a `build_plan` inference — wrong mechanism. Then I retracted too far. The
  flag is real and is `SUPERO_IS_MULTI_TENANT`, and SKILLS §7.5a is explicit that
  without it *"your tenant switcher / scoping UI never shows, **even though the
  tenants exist**"*. My answer to what I would do about it is below, under
  "Multi-tenancy".
- **`workflows` import being refused is documented, and `build_doctor` warned me in
  plain text.** Not a bug. The narrower point that stands: SKILLS tells builders a
  product-grade app wires "2–3 real workflows + `EVENT_BINDINGS`", while the standard
  deploy path cannot run them, and those two statements live in different documents.
  Reclaim gives every workflow-driven action a direct-CRUD fallback so it degrades
  honestly rather than shipping dead buttons.

---

## Notes on scope

Five entities, two roles, one unhappy path, no integrations needing a secret.

I went past the 90-minute target. The model, the unhappy path and the first findings
were inside it. Two things took the rest: rebuilding the frontend as a real
TypeScript + Svelte + Tailwind project to see whether the platform tolerates a normal
toolchain — it does, and finding 4 came out of it — and then auditing every claim
above against all twelve documentation files, which is what produced the three
retractions.

The audit was worth more than the extra findings. Three of eight were wrong, and I
would rather you receive five I can defend with a script you can run than eight I
cannot.
