# Reclaim — platform findings

Everything below came out of building one small app on Supero over MCP. Each item
says what I expected, what happened, what the documentation says, and how to
reproduce it.

**Before reading the findings, read the retractions.** I initially wrote up eight
issues. Three of them were me not having read the documentation. I have left them
in, corrected, because a list of what I got wrong is more useful to you than a
list of confident claims — and because two of the three point at a discoverability
problem that is worth more than the "bugs" I thought I had found.

Reproductions live in `repro/`. Each is standalone, needs only Python 3 and an API
key, and prints expected-versus-observed:

```sh
cd repro && SUPERO_API_KEY=ak_... ./run_all.sh     # writes ../EVIDENCE.txt
```

Captured output from my run is in `EVIDENCE.txt`.

| # | Finding | Status | Repro |
|---|---|---|---|
| 1 | Policy record filters and `hidden_fields` leak across roles | **Confirmed bug** — contradicts SKILLS §6 | `01` |
| 2 | `build_stage_bundle` returns an in-cluster upload URL | **Confirmed bug** — undocumented | `02` |
| 3 | `build_plan` vertical misclassification cascades silently | Quality issue | `03` |
| 4 | `build_doctor` stops checking a UI it does not recognise | Quality issue | `04` |
| 5 | Deploys use a mutable `:latest` image tag | Root cause for a known, already-mitigated issue | `05` |
| 6 | `setTenantOverride()` / `X-Tenant` ignored on reads | **Confirmed bug** — documented mechanism is inert | inline |
| V | Model survives a third tenant added post-hoc | Verification, not a finding | `06` |
| R1 | ~~Workflow definition schema is undocumented~~ | **Retracted — my error** | — |
| R2 | Multi-tenancy flag — over-claimed, then over-retracted | **Corrected; claim stands, mechanism was wrong** | `06` |
| R3 | ~~`workflows` cannot be imported by the deploy key~~ | **Documented, and I was warned** | — |

---

## 1. Policy record filters and `hidden_fields` are applied per-ENTITY, not per-(role, entity)

**Confirmed. This is the one I would fix first.**

SKILLS.md §6 states the contract:

> The platform resolves **one record filter per (role, entity)** and applies it to
> every verb.

Reclaim declares two policies. `tenant_admin` gets an explicit rule on `lease`
with **no** `filter_field`, and on `drift_finding` with **no** `hidden_fields`.
`tenant_user` gets a filtered rule on `lease` and a `hidden_fields` rule on
`drift_finding`.

The admin's own unfiltered rule is ignored. The `tenant_user` restrictions are
applied to `tenant_admin` as well:

```
ground truth (northwind, API key)   4 leases across 2 owners; 2 drift findings
tenant_admin lists leases           1 lease    ← expected 4; its rule has no filter
tenant_user  lists leases           3 leases, 0 foreign     (control: correct)
field stored on the record          wasted_cost_usd present: True
tenant_admin reads wasted_cost_usd  False      ← its rule has no hidden_fields
tenant_user  reads wasted_cost_usd  False                   (control: correct)
```

**It is fail-closed, so it is not a data leak.** The engineer never sees more than
the admin. But an operator silently loses rows and fields they own, and it cannot
be fixed from the policy file, because the permissive rule is already there and is
being ignored. The only workaround is to stop restricting the lesser role.

This cost me a deploy before I understood it. The seed principal is an admin, and
`setup.py` seeding 403'd on exactly the three entities my `tenant_user` policy had
made read-only — `cluster`, `environment`, `fleet_policy` — while succeeding on the
two I had granted `can_create`. **16 of 27 records were lost and the run still
exited 0.**

Two smaller things fall out of that:

- **A seed that loses 16 of 27 records should not exit 0.** The log classifies
  `403 Forbidden` as "transient/unclassified, not structural" and points at
  `SUPERO_STRICT_SEED=1`. A permission denial is the most structural failure there
  is. I would invert the default: fail the build, and let `SUPERO_LENIENT_SEED=1`
  opt out.
- **SKILLS §6 line ~1075 says** *"The seed/admin/API-key principal has
  `default_access="full"` and no record filter, so its writes pass through
  untouched."* That was not true for my seed principal. I could not isolate
  whether `default_access="full"` is independently broken or whether this is the
  same leak wearing a different hat, so I am not claiming the former.

**Repro:** `repro/01_policy_scope_leak.py`

---

## 2. `build_stage_bundle` returns an address only reachable from inside your cluster

**Confirmed. One-line fix, but nothing catches it.**

The tool exists so an external MCP client can upload a large bundle out-of-band.
The URL it returns is in-cluster service DNS, over plain HTTP:

```
upload_url: http://platform-core-service:8083/api/v1/files/<domain>/upload

host 'platform-core-service' resolves: False
upload → URLError: [Errno -3] Temporary failure in name resolution
```

The same path on the public host works first try:

```
https://api.supero.dev/api/v1/files/<domain>/upload → HTTP 201 file_id=file_dRgd9mDcLz3J
```

The endpoint is right; only the host in the response is wrong. Also note `http://`.

The documented flow cannot be completed as instructed by the only clients that
call this tool, and the failure surfaces as a client-side network error rather
than a bad value in a response. Nothing in the 12 documentation files mentions the
upload host, so there is no way to discover the correct one except by guessing it.

**Repro:** `repro/02_stage_bundle_internal_url.py`

---

## 3. `build_plan`'s vertical detector misclassifies, and the error cascades with no confidence signal

Quality issue rather than a contract violation — the tool disclaims its output
("Deterministic guidance derived from your description — adapt to your exact
requirements"). Included because the failure is silent and the blast radius is large.

A description naming Kubernetes, clusters, environments, platform engineering and
drift reconciliation is classified as **real estate / property**, apparently on the
word *lease*:

```
Detected vertical: 'real estate / property'
recommends: Photo Gallery, Floor Plan, Location & Neighborhood,
            Agent Contact, Features & Amenities, square feet
reference app: 'commerce-marketplace'        (ops-dashboard is the fit)
theme: photographic / lifestyle / serif      (for an internal ops tool)
```

Passing `is_multi_tenant: true` and `public_facing: false` explicitly corrects the
login section and leaves the vertical wrong.

The response already prints a confidence for the hero archetype
(`confidence: signal`) but **none for the vertical**, so a caller has nothing to
gate on. Surfacing the same confidence there, and saying "unsure — tell me" below
a threshold, would cost little. As it stands an agent that trusts this output
ships a Floor Plan tab on a Kubernetes cluster.

**Repro:** `repro/03_vertical_misclassification.py`

---

## 4. `build_doctor` stops checking the UI when it does not recognise it, and does not say so

Not a claim that Supero must support bundlers. The docs assume the app lives in
`ui/app.js` — `11.custom.web.md` Lesson 6 explicitly says not to precompile it —
and every doctor UI check is a grep against that file, which is reasonable given
the assumption.

The observation is narrower: **when the assumption does not hold, nothing says so.**

Two minimal bundles, identical except for `ui/app.js` — one hand-written React, one
a loader that injects a compiled bundle:

```
A) hand-written React   richness present: true  (score 4)  is_path_b: true   components: 3
B) loader + bundle.js   richness present: FALSE (none)     is_path_b: false  components: 0

both: errors 0, verdict "ready (review warnings)"
```

For B the `richness` block is **absent from the response entirely** — not scored
zero — and `is_path_b`, `has_landing` and `has_tenant_selector` all report false
for an app that has all of them. The verdict is unchanged.

This matters beyond bundlers: a gate that no-ops on input it does not recognise
passes a genuine regression for the same reason it passes this. One line would fix
the feedback, without changing a single check:

> `ui/app.js looks like a loader, not an application; UI checks skipped.`

There is a second-order effect worth knowing, which I hit myself. Once the
application lives in `ui/bundle.js`, `ui/app.js` becomes a stable loader whose
hash never changes — so **`build_smoke_test(expected_app_js_sha1=...)` stops
detecting stale rolls for that app.** It kept reporting the same sha1 across two
completely different application versions. The check that caught a real stale roll
for me earlier is silently defeated by the same architecture the linter cannot see.

If the bundled-SPA shape is something you want to support rather than merely
tolerate, the fix for both is the same: identify the deployed artifact by the
bundle `checksum` that `build_publish` already returns, rather than by hashing one
conventionally-named file.

**Repro:** `repro/04_doctor_skips_bundled_ui.py`

---

## 5. Deploys use a mutable `:latest` image tag — a root cause, not a discovery

**You already know about stale rolls and you already ship the fix.** SKILLS
documents `build_smoke_test(..., expected_app_js_sha1=...)` as the way to "confirm
the roll landed", and during this build it caught a real one:

```
DEPLOYED app.js does NOT match your published bundle
(served sha1 c6a60c344060 != expected 114c0335bcc1)
```

`build_deploy_status` had reported `status: "running"` with the new version's
`generation_uuid` while the container served the previous bundle. The check worked
exactly as designed and is the only reason I did not ship a stale build.

What may be worth having is the likely cause, visible in the same response:

```
image_uri: .../superoapps/preview-<domain>-<project>:latest
```

A mutable per-service tag, reused by every deploy. A Cloud Run revision pinned to
a floating tag carries nothing identifying which build it received, so nothing can
detect that it got the wrong one — and `build_teardown` resolves it precisely
because deleting the service forces a fresh pull.

Two changes would close it:

1. **Deploy by immutable digest, or tag per version.** `build_publish` already
   computes and returns a bundle `checksum` that would serve as the tag.
2. **Return the running revision's artifact hash from `build_deploy_status`**, so
   `running` means running *this*. `build_smoke_test` already derives that value
   after the fact by fetching `app.js` over HTTP and hashing it.

**Repro:** `repro/05_deploy_status_artifact.py`

---

## 6. `client.setTenantOverride()` does nothing — `X-Tenant` is ignored on reads

**Confirmed.** SKILLS §7.5a documents the super-admin tenant switcher like this:

> `client.setTenantOverride(name)` — it sets the `X-Tenant` header on every later
> CRUD call.

It does set the header. The API ignores it. Reading `cluster` as a super-admin with
every possible override value returns an identical result set:

```
no override                → 6 clusters, tenants=[contoso, fabrikam, northwind]
X-Tenant: northwind        → 6 clusters, tenants=[contoso, fabrikam, northwind]
X-Tenant: contoso          → 6 clusters, tenants=[contoso, fabrikam, northwind]
X-Tenant: fabrikam         → 6 clusters, tenants=[contoso, fabrikam, northwind]
X-Tenant: default-tenant   → 6 clusters, tenants=[contoso, fabrikam, northwind]
```

This is not an isolation failure — a super-admin in `default-tenant` is not
tenant-scoped and is *supposed* to see every organisation. Tenant-scoped users are
correctly confined, which finding 1's controls and the boundary probe both show.

The problem is that the documented way to build a tenant switcher silently does
nothing, so an app that follows SKILLS ships a control that looks like it enforces
a scope and enforces none. I shipped exactly that for two versions before testing
it. Reclaim now filters client-side and labels the control `Viewing: <org>`, because
calling an API that does nothing, to imply a boundary that is not enforced, is worse
than not offering the control.

Either honour the header for principals entitled to cross-tenant reads, or reject it
with a 400 so the caller learns immediately. Accepting and ignoring it is the one
option that produces a convincing lie.

**Repro:** the override table above; `repro/01_policy_scope_leak.py` covers the
related read-path scoping.

---

## Retractions

### R1. The workflow definition schema is fully documented — I had not read the doc

I reported that `WORKFLOW_DEFINITIONS` required keys nowhere in the documentation:
`workflow_id` (SKILLS shows `id`), a mandatory `status`, and a `compensate` block
on every step. `build_doctor` rejected my definitions and I wrote that up as
SKILLS and its own linter disagreeing.

They do not. `build_get_skills(doc='workflows')` specifies all of it:

```
| workflow_id | string | yes | Unique ID, snake_case verb_noun |
| status      | string | yes | Active, Draft, Disabled, or Archived |

16. Every service_call AND crud_operation step in a compensate-mode workflow
    MUST have a compensate block
```

The doctor was right, the documentation was right, and I had built from the SKILLS
§6 summary without fetching the companion doc it points to. **Entirely my error.**

The one thing I would still raise is discoverability: SKILLS §6 reads as a complete
specification, and the deeper contract is in a separate document that a builder has
to know to ask for. A single line — *"§6 is a summary; the authoritative workflow
schema is `doc='workflows'`"* — would have saved me a cycle. But that is a
signposting suggestion, not a bug.

### R2. Multi-tenancy — I was wrong twice, in opposite directions

**First I over-claimed, then I over-retracted.** Both corrections matter, because
you explicitly asked what I would do about this.

My original claim was that tenancy "defaults to inference" because
`build_create_project` has no tenancy parameter and `build_plan`'s
`is_multi_tenant` says *"Inferred from the description if omitted"*. That was the
wrong mechanism, and I retracted it.

The retraction went too far. **The flag you describe is real.** SKILLS §7.5a:

> **Turn the flag ON via ENV VARS** — **NOT** `config.py`. There is no `AppConfig`
> field for this... Without `SUPERO_IS_MULTI_TENANT=true`, `cfg.isMultiTenant` is
> `false` and your tenant switcher / scoping UI never shows, **even though the
> tenants exist**.

Opt-in, defaults off, someone has to remember — exactly as you put it. And the
failure mode is worse than "it is off": the tenants are created, the data is
correctly partitioned, the server enforces isolation, and **the UI silently
pretends none of it exists**. Nothing errors. You get a single-tenant-looking app
sitting on correctly multi-tenant data, and the only symptom is a missing switcher
you were not necessarily expecting to see.

There is a real mitigation already: on a cloud go-live the platform auto-derives
the flag from `config.py` `tenants[]`. So the trap is mostly local `supero run` —
which is exactly where a builder forms their mental model of what they built.

**What I would do about it.** Not "default it on". The honest fix is to stop having
a flag that can disagree with the data:

1. **Derive it everywhere, not just at go-live.** The `tenants[]` list in
   `config.py` already says whether this app is multi-tenant. Two named tenants and
   `isMultiTenant: false` is not a configuration, it is a contradiction. The CLI
   writes `ui/config.js`; it can read `config.py` the same way go-live already does.
2. **If a flag must remain, make disagreement loud.** `build_doctor` already knows
   both facts — it reported `named_tenants: ["contoso", "northwind"]` for my bundle.
   Tenants declared with the flag off is a one-line warning it is already holding
   the inputs for.
3. **The general rule I applied inside my own app:** a flag is only honest when
   turning it on later is cheap. `require_dual_approval` qualifies — flip it and the
   next decision changes, nothing stored becomes wrong. Tenancy does not: retrofitting
   it rewrites every query, every policy and the login path. So in Reclaim tenancy is
   structural and always on, and the approval gate is the flag. That is the same test
   I would apply to this one — and by it, `SUPERO_IS_MULTI_TENANT` fails, which is
   why deriving it beats defaulting it.

**And I tested the claim rather than just agreeing with it.** After the app was
built, deployed and verified, I added a third organisation — Fabrikam Industrial —
to see whether the model survived more than the two it was written with.

```
northwind=2 clusters  contoso=2 clusters  fabrikam=2 clusters
nw-admin sees 2 clusters, 0 foreign        ct-admin sees 2, 0 foreign
fb-admin sees 2 clusters, 0 foreign
windows: northwind=30m  contoso=20m  fabrikam=10m
fb-lab-2 observed 13m ago -> Fabrikam stale=True, Northwind stale=False
```

That last line is the one I care about. The same reading is stale for one
organisation and fresh for another, because the staleness window is tenant policy
rather than a constant. Isolation held three ways.

Adding the tenant cost: a `config.py` entry, two users, seed rows, one platform
tenant record. **Zero schema changes, zero policy changes, zero UI changes.**

It did find one bug — in my code, not yours. The tenant switcher listed the two
seeded organisations as literal `<option>` elements, so Fabrikam existed on the
platform and in the data and was invisible in the UI. That is precisely the failure
a second tenant is meant to catch, and it took a third to catch it. The switcher now
loads its list at runtime.

*Repro: `repro/06_third_tenant.py`*

### R3. `workflows` import being refused is documented, and `build_doctor` warned me

I reported that the `workflows` service cannot be imported by the key a cloud
deploy runs under, so no workflow or event binding can run in production.

That is true, and it is documented: *"import is permission-gated — a PROJECT-SCOPED
key is refused"* (SKILLS §7.6). `build_doctor` also warned me in plain text before
I deployed:

> `config.py` imports service(s) `['workflows']` that usually need elevated
> permission — with a project-scoped key the deploy may log "Permission denied".

Not a bug, and I should not have filed it as one. The narrower point I would still
make as product feedback: SKILLS tells builders that a product-grade app wires
"2–3 real workflows + `EVENT_BINDINGS`", while the standard cloud deploy path
cannot run them. Those two pieces of guidance sit in different documents and
contradict each other in practice. Reclaim handles it by giving every
workflow-driven action an equivalent direct-CRUD fallback, so the app degrades
honestly instead of shipping dead buttons — but a builder who follows the advice
and trusts it ships a broken app.

---

## Things I noticed but am not filing

- **The public API rejects Python's default User-Agent.** A plain `urllib` request
  gets `HTTP 403` with Cloudflare error `1010`; the same request with a browser UA
  succeeds, and `curl` is never blocked. SKILLS documents WAF 403s for code-bearing
  MCP calls and prescribes `files_b64gz`, so the class of problem is known — but it
  bites ordinary REST clients too, and the error body gives no hint. Every script in
  `repro/` sets a browser UA for this reason.
- **`X-Tenant` is ignored on create**, and routing is by `parent_uuid` instead.
  Arguably correct — tenancy comes from the parent hierarchy, and the supported
  seeding path is `seed_record(tenant_name=...)`. But see finding 6: the same
  header is also ignored on reads, where it *is* the documented mechanism.
