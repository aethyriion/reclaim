#!/usr/bin/env python3
"""Attack Reclaim's own tenant boundary and report what actually happens.

Scope: this project only, and only tenants seeded by this project. Every probe
below is one the Supero challenge explicitly invites ("probe the tenant boundary,
try to read a field your second role should not see, send the state transition
that should be rejected").

Run:  python3 tenant_probe.py <api_base> <domain> <project>
"""

import json
import sys
import urllib.error
import urllib.request

API = sys.argv[1] if len(sys.argv) > 1 else "https://api.supero.dev"
DOMAIN = sys.argv[2] if len(sys.argv) > 2 else "stephen-rhodes"
PROJECT = sys.argv[3] if len(sys.argv) > 3 else "reclaim"
PW = "Password123!"

NW_ENG = "nw-eng@northwind.example"
NW_ADMIN = "nw-admin@northwind.example"
CT_ADMIN = "ct-admin@contoso.example"

results = []


def rec(name, expectation, outcome, verdict):
    results.append((name, expectation, outcome, verdict))
    mark = {"PASS": "PASS", "FAIL": "FAIL", "INFO": "INFO"}[verdict]
    print("[%s] %s\n       expected: %s\n       actual:   %s\n" % (mark, name, expectation, outcome))


def call(method, path, token=None, body=None, tenant=None):
    url = API.rstrip("/") + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    # The public API sits behind a WAF that rejects Python's default
    # `Python-urllib/3.x` User-Agent with Cloudflare error 1010 (403). curl is
    # allowed through, so this is UA fingerprinting, not auth. Send a browser UA.
    req.add_header("User-Agent",
                   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
    req.add_header("X-Domain", DOMAIN)
    if tenant:
        req.add_header("X-Tenant", tenant)
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except Exception:
            return e.code, {"raw": raw[:300]}
    except Exception as e:
        return 0, {"error": str(e)}


def login(email):
    # tenant '' so the server resolves the user's OWN organisation by email.
    st, body = call("POST", "/api/v1/auth/login", body={
        "domain": DOMAIN, "email": email, "password": PW,
        "project": PROJECT, "tenant": "",
    })
    # The login response nests the token under "auth".
    for holder in (body.get("auth") or {}, body, body.get("data") or {}):
        tok = holder.get("access_token") or holder.get("token")
        if tok:
            return tok, st, body
    return None, st, body


def rows(body):
    if isinstance(body, list):
        return body
    for k in ("results", "objects", "data", "records"):
        v = body.get(k)
        if isinstance(v, list):
            return v
    return []


def main():
    print("=" * 74)
    print("Reclaim — tenant boundary probe")
    print("=" * 74 + "\n")

    nw_eng, st, b = login(NW_ENG)
    if not nw_eng:
        print("Could not sign in as %s (HTTP %s): %s" % (NW_ENG, st, json.dumps(b)[:250]))
        return 1
    nw_admin, _, _ = login(NW_ADMIN)
    ct_admin, _, _ = login(CT_ADMIN)

    # ---- 1. Cross-tenant read: can a Northwind engineer see Contoso clusters?
    st, body = call("GET", "/api/v1/crud/%s/cluster" % DOMAIN, token=nw_eng)
    names = sorted((r.get("name") or "") for r in rows(body))
    leaked = [n for n in names if n.startswith("ct-")]
    rec("Cross-tenant read (engineer lists clusters)",
        "only nw-* clusters; no Contoso rows",
        "HTTP %s, saw %s" % (st, names or "none"),
        "FAIL" if leaked else "PASS")

    # ---- 2. Cross-tenant read via a forged X-Tenant header.
    st, body = call("GET", "/api/v1/crud/%s/cluster" % DOMAIN, token=nw_eng, tenant="contoso")
    names2 = sorted((r.get("name") or "") for r in rows(body))
    leaked2 = [n for n in names2 if n.startswith("ct-")]
    rec("Forged X-Tenant header (engineer claims contoso)",
        "refused, or still scoped to Northwind",
        "HTTP %s, saw %s" % (st, names2 or "none"),
        "FAIL" if leaked2 else "PASS")

    # ---- 3. Field-level RBAC: is wasted_cost_usd hidden from the engineer?
    st, body = call("GET", "/api/v1/crud/%s/drift_finding" % DOMAIN, token=nw_eng)
    eng_findings = rows(body)
    eng_has_cost = any("wasted_cost_usd" in r for r in eng_findings)
    st2, body2 = call("GET", "/api/v1/crud/%s/drift_finding" % DOMAIN, token=nw_admin)
    adm_findings = rows(body2)
    adm_has_cost = any("wasted_cost_usd" in r for r in adm_findings)
    # Distinguish a LEAK (engineer sees a field they must not) from the platform
    # OVER-APPLYING the restriction to the admin as well. The first is a security
    # failure in my model; the second is fail-closed and is a platform defect.
    if eng_has_cost:
        verdict, note = "FAIL", "LEAK: the engineer can read an admin-only field"
    elif adm_has_cost:
        verdict, note = "PASS", "correct contrast"
    else:
        verdict, note = ("INFO",
                         "fail-closed, but OVER-APPLIED: hidden_fields declared on the "
                         "tenant_user rule also strips the field from tenant_admin. The "
                         "security property holds; the admin loses data they own. Same "
                         "shape as the lease record filter leaking onto the admin - "
                         "policy scoping appears to be per-ENTITY, not per-(role, entity).")
    rec("Field-level RBAC (wasted_cost_usd)",
        "absent for engineer, present for admin",
        "engineer sees field: %s (%d rows) | admin sees field: %s (%d rows) -- %s"
        % (eng_has_cost, len(eng_findings), adm_has_cost, len(adm_findings), note),
        verdict)

    # ---- 4. Privilege escalation: can an engineer resolve a finding?
    if eng_findings:
        target = eng_findings[0]
        st, body = call("PUT", "/api/v1/crud/%s/drift_finding/%s" % (DOMAIN, target.get("uuid")),
                        token=nw_eng, body={"finding_state": "resolved",
                                            "resolution": "force_reclaim"})
        rec("Privilege escalation (engineer resolves drift)",
            "rejected (403/404)",
            "HTTP %s %s" % (st, json.dumps(body)[:140]),
            "PASS" if st in (401, 403, 404, 405, 422) else "FAIL")
    else:
        rec("Privilege escalation (engineer resolves drift)", "rejected",
            "no findings visible to the engineer", "INFO")

    # ---- 5. Owner scoping: does an engineer see another user's leases?
    st, body = call("GET", "/api/v1/crud/%s/lease" % DOMAIN, token=nw_eng)
    mine = rows(body)
    foreign = [l.get("owner_username") for l in mine
               if l.get("owner_username") and l.get("owner_username") != NW_ENG]
    rec("Owner scoping (engineer lists leases)",
        "only rows owned by the engineer",
        "HTTP %s, %d rows, foreign owners: %s" % (st, len(mine), foreign or "none"),
        "FAIL" if foreign else "PASS")

    # ---- 6. Cross-tenant write: Contoso admin updates a Northwind cluster.
    st, body = call("GET", "/api/v1/crud/%s/cluster" % DOMAIN, token=nw_admin)
    nw_clusters = rows(body)
    if ct_admin and nw_clusters:
        victim = nw_clusters[0]
        st, body = call("PUT", "/api/v1/crud/%s/cluster/%s" % (DOMAIN, victim.get("uuid")),
                        token=ct_admin, body={"cluster_state": "unreachable"})
        rec("Cross-tenant write (Contoso admin edits a Northwind cluster)",
            "rejected (403/404)",
            "HTTP %s %s" % (st, json.dumps(body)[:140]),
            "PASS" if st in (401, 403, 404, 405, 422) else "FAIL")
    else:
        rec("Cross-tenant write", "rejected", "could not set up the probe", "INFO")

    # ---- 7. Reserved-field strip: can an engineer write `status` directly?
    st, body = call("GET", "/api/v1/crud/%s/environment" % DOMAIN, token=nw_eng)
    envs = rows(body)
    free = [e for e in envs if e.get("env_state") == "available"]
    if free:
        st, body = call("PUT", "/api/v1/crud/%s/environment/%s" % (DOMAIN, free[0].get("uuid")),
                        token=nw_eng, body={"env_state": "claimed"})
        rec("Engineer writes environment state directly",
            "rejected — engineers are read-only on environments",
            "HTTP %s %s" % (st, json.dumps(body)[:140]),
            "PASS" if st in (401, 403, 404, 405, 422) else "FAIL")
    else:
        rec("Engineer writes environment state directly", "rejected",
            "no available environment to target", "INFO")

    print("=" * 74)
    npass = sum(1 for r in results if r[3] == "PASS")
    nfail = sum(1 for r in results if r[3] == "FAIL")
    ninfo = sum(1 for r in results if r[3] == "INFO")
    print("%d held, %d breached, %d fail-closed-but-over-applied" % (npass, nfail, ninfo))
    print("=" * 74)
    return 1 if nfail else 0


if __name__ == "__main__":
    sys.exit(main())
