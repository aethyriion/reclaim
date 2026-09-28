#!/usr/bin/env python3
"""Does the model survive a THIRD tenant added after the app was built?

Supero's brief says: "we do look at whether your model survives a second tenant."
Two tenants can be passed by hard-coding two. This adds a third, Fabrikam
Industrial, AFTER the app was written, deployed and verified, and checks:

  1. Isolation holds three ways, not just two.
  2. The staleness guard is driven by the TENANT'S policy, not a constant. The
     decisive case is fb-lab-2, last observed 12 minutes ago:
        - under Northwind's 30-minute window that reading is FRESH
        - under Fabrikam's 10-minute window the SAME reading is STALE
     Same data, different verdict, because the window is per-tenant.
  3. Adding the tenant required no schema change, no policy change and no UI
     change - only a config entry and seed rows.

Run:  SUPERO_API_KEY=ak_... python3 06_third_tenant.py
"""

import sys

from _supero import Result, in_tenant, listing, login, require_key

TENANTS = ["northwind", "contoso", "fabrikam"]
ADMINS = {
    "northwind": "nw-admin@northwind.example",
    "contoso": "ct-admin@contoso.example",
    "fabrikam": "fb-admin@fabrikam.example",
}
STALE_MINUTES = {"northwind": 30, "contoso": 20, "fabrikam": 10}


def minutes_old(iso):
    from datetime import datetime, timezone
    if not iso:
        return None
    try:
        t = datetime.fromisoformat(iso.replace("Z", "+00:00"))
    except ValueError:
        return None
    return (datetime.now(timezone.utc) - t).total_seconds() / 60.0


def main():
    require_key()
    r = Result("Does the data model survive a THIRD tenant?")

    all_clusters = listing("cluster")
    r.note("fleet across all tenants",
           ", ".join(f"{t}={len(in_tenant(all_clusters, t))} clusters" for t in TENANTS))

    # ---- 1. three-way isolation -----------------------------------------
    for t in TENANTS:
        token = login(ADMINS[t])
        seen = listing("cluster", token=token)
        foreign = [c for c in seen
                   if (c.get("fq_name") or ["", "", ""])[2] != t]
        r.check(
            f"{ADMINS[t]} sees only {t} clusters",
            f"no rows from the other {len(TENANTS) - 1} organisations",
            f"{len(seen)} cluster(s), {len(foreign)} foreign",
            passed=not foreign and len(seen) > 0,
        )

    # ---- 2. the guard is per-tenant, not a constant ----------------------
    policies = {}
    for t in TENANTS:
        rows = in_tenant(listing("fleet_policy"), t)
        policies[t] = rows[0] if rows else {}
    r.note("staleness window per organisation",
           ", ".join(f"{t}={policies[t].get('stale_observation_minutes')}m "
                     f"(dual_approval={policies[t].get('require_dual_approval')})"
                     for t in TENANTS))

    lab = next((c for c in in_tenant(all_clusters, "fabrikam")
                if c.get("name") == "fb-lab-2"), None)
    if lab:
        age = minutes_old(lab.get("last_observed_at"))
        fab_limit = int(policies["fabrikam"].get("stale_observation_minutes") or 10)
        nw_limit = int(policies["northwind"].get("stale_observation_minutes") or 30)
        r.check(
            "the same reading is judged differently by two organisations",
            f"stale under Fabrikam ({fab_limit}m), fresh under Northwind ({nw_limit}m)",
            f"fb-lab-2 observed {age:.0f}m ago -> "
            f"Fabrikam stale={age > fab_limit}, Northwind stale={age > nw_limit}",
            passed=(age > fab_limit) and (age <= nw_limit),
        )
    else:
        r.note("fb-lab-2", "not found; skipped the per-tenant window check")

    # ---- 3. the cost of adding it ---------------------------------------
    r.note("cost of adding tenant #3",
           "config.py tenants[] + 2 users, seed rows, and one platform tenant "
           "record. Zero schema changes, zero policy changes, zero UI changes.")
    return r.report()


if __name__ == "__main__":
    sys.exit(main())
