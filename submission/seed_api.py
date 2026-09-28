#!/usr/bin/env python3
"""Seed Reclaim's demo fleet over the CRUD API, into the correct named tenants.

Why this exists as a separate script: the in-bundle `setup.py` seed is the normal
path and works under a privileged local run, but on a Supero *cloud* deploy the
seed principal is refused create access to app schemas and 16 of 27 records are
silently lost (the run still exits 0). This script performs the same seed from an
operator's own API key.

The important detail it encodes: **a record is routed to a tenant by
`parent_uuid`, not by the `X-Tenant` header.** X-Tenant is accepted and ignored on
create, so every write lands in default-tenant unless parent_uuid names the
target tenant explicitly.

Usage:  SUPERO_API_KEY=ak_... python3 seed_api.py [--wipe]
"""

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

API = os.getenv("SUPERO_URL", "https://api.supero.dev").rstrip("/")
DOMAIN = os.getenv("SUPERO_DOMAIN", "stephen-rhodes")
KEY = os.getenv("SUPERO_API_KEY")
WIPE = "--wipe" in sys.argv

if not KEY:
    print("Set SUPERO_API_KEY."); sys.exit(2)

NOW = datetime.now(timezone.utc).replace(microsecond=0)
iso = lambda d: d.isoformat().replace("+00:00", "Z")
ago = lambda **k: iso(NOW - timedelta(**k))
ahead = lambda **k: iso(NOW + timedelta(**k))


def call(method, path, body=None):
    req = urllib.request.Request(API + path,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 method=method)
    req.add_header("Content-Type", "application/json")
    # The public API sits behind a WAF that rejects Python's default
    # `Python-urllib/3.x` User-Agent with Cloudflare error 1010 (403). curl is
    # allowed through, so this is UA fingerprinting, not auth. Send a browser UA.
    req.add_header("User-Agent",
                   "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")
    req.add_header("X-API-Key", KEY)
    req.add_header("X-Domain", DOMAIN)
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except Exception:
            return e.code, {"raw": raw[:200]}
    except Exception as e:
        return 0, {"error": str(e)}


def listing(schema):
    st, b = call("GET", "/api/v1/crud/%s/%s" % (DOMAIN, schema))
    if isinstance(b, list):
        return b
    for k in ("results", "objects", "data", "records"):
        if isinstance(b.get(k), list):
            return b[k]
    return []


def create(schema, tenant_uuid, rec):
    payload = dict(rec)
    payload["parent_type"] = "tenant"
    payload["parent_uuid"] = tenant_uuid          # <-- the tenant routing mechanism
    st, b = call("POST", "/api/v1/crud/%s/%s" % (DOMAIN, schema), payload)
    if st in (200, 201):
        uuid = b.get("uuid") or (b.get("data", {}).get(schema, {}) or {}).get("uuid")
        return uuid
    print("   ! %-14s %-30s HTTP %s %s" % (schema, rec.get("name"), st, json.dumps(b)[:110]))
    return None


def link(src_schema, src_uuid, ref_name, tgt_uuid):
    for path, body in (
        ("/api/v1/crud/%s/%s/%s/refs" % (DOMAIN, src_schema, src_uuid),
         {"ref_name": ref_name, "ref_uuid": tgt_uuid, "operation": "ADD"}),
        ("/api/v1/refs/%s/%s/%s" % (DOMAIN, src_schema, src_uuid),
         {"ref_name": ref_name, "ref_uuid": tgt_uuid, "operation": "ADD"}),
    ):
        st, _ = call("POST", path, body)
        if st in (200, 201):
            return True
    return False


def main():
    tenants = {t.get("name"): t.get("uuid") for t in listing("tenant")}
    for want in ("northwind", "contoso"):
        if want not in tenants:
            print("Tenant %r missing — deploy the app once first." % want)
            return 1
    print("tenants: " + ", ".join("%s=%s" % (k, v[:8]) for k, v in tenants.items()) + "\n")

    if WIPE:
        for schema in ("drift_finding", "lease", "environment", "cluster", "fleet_policy"):
            rows = listing(schema)
            for r in rows:
                call("DELETE", "/api/v1/crud/%s/%s/%s" % (DOMAIN, schema, r["uuid"]))
            print("wiped %-14s %d" % (schema, len(rows)))
        print()

    from seed_data import FLEETS, ENVIRONMENTS   # shared with setup.py

    made = 0
    for tname, fleet in FLEETS.items():
        tu = tenants[tname]
        print("== %s" % tname)
        if create("fleet_policy", tu, fleet["policy"]):
            made += 1

        clusters = {}
        for rec in fleet["clusters"]:
            u = create("cluster", tu, rec)
            if u:
                clusters[rec["name"]] = u
                made += 1

        for row in ENVIRONMENTS[tname]:
            env_uuid = create("environment", tu, row["env"])
            if not env_uuid:
                continue
            made += 1
            if row["cluster"] in clusters:
                link("environment", env_uuid, "Cluster", clusters[row["cluster"]])

            lease_uuid = None
            if row["lease"]:
                lease_uuid = create("lease", tu, dict(row["lease"], environment_uuid=env_uuid))
                if lease_uuid:
                    made += 1
                    link("lease", lease_uuid, "Environment", env_uuid)

            if row["finding"]:
                f = create("drift_finding", tu, dict(row["finding"],
                                                     environment_uuid=env_uuid,
                                                     lease_uuid=lease_uuid or ""))
                if f:
                    made += 1
                    link("drift_finding", f, "Environment", env_uuid)
                    if lease_uuid:
                        link("drift_finding", f, "Lease", lease_uuid)
        print()

    print("created %d records" % made)
    for s in ("cluster", "environment", "lease", "drift_finding", "fleet_policy"):
        rows = listing(s)
        by = {}
        for r in rows:
            fq = r.get("fq_name") or []
            t = fq[2] if len(fq) > 2 else "?"
            by[t] = by.get(t, 0) + 1
        print("  %-14s %2d  %s" % (s, len(rows), by))
    return 0


if __name__ == "__main__":
    sys.exit(main())
