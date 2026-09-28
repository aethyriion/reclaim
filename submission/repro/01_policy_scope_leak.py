#!/usr/bin/env python3
"""BUG 1 — a record filter and hidden_fields declared on ONE role are applied to
EVERY role for that entity.

SKILLS.md states the contract (§6, "Owner-scoping filters reads AND writes"):

    The platform resolves one record filter per (role, entity) and applies it
    to every verb.

Per (role, entity). This project's setup.py declares:

    PolicyDef(role="tenant_admin", default_access="full", rules=[
        PolicyRule(entity="lease",         can_read=True, can_create=True,
                   can_update=True, can_delete=True),      # NO filter
        PolicyRule(entity="drift_finding", can_read=True, can_create=True,
                   can_update=True, can_delete=True),      # NO hidden_fields
        ...
    ])
    PolicyDef(role="tenant_user", default_access="none", rules=[
        PolicyRule(entity="lease", can_read=True, can_create=True, can_update=True,
                   filter_field="owner_username", filter_match="$user.name"),
        PolicyRule(entity="drift_finding", can_read=True, can_create=True,
                   hidden_fields=["wasted_cost_usd"]),
    ])

A tenant_admin therefore has an explicit, unfiltered rule on both entities and
should see every row in its own tenant, with every field.

It does not. The tenant_user filter and hidden_fields are applied to the admin
as well, so the scoping is per-ENTITY, not per-(role, entity).

Impact: an operator silently loses access to rows and fields they own, purely
because a *less* privileged role has a restriction on the same entity. It is
fail-closed, so it is not a data leak — but it is unfixable from the policy file,
because the admin already has the permissive rule and it is being ignored.

Run:  SUPERO_API_KEY=ak_... python3 01_policy_scope_leak.py
"""

import sys

from _supero import (Result, in_tenant, listing, login, require_key)

TENANT = "northwind"
ADMIN = "nw-admin@northwind.example"      # tenant_admin
ENGINEER = "nw-eng@northwind.example"     # tenant_user


def main():
    require_key()
    r = Result("BUG 1 - policy record filter and hidden_fields leak across roles")

    # Ground truth: the API-key principal is unfiltered.
    truth_leases = in_tenant(listing("lease"), TENANT)
    truth_findings = in_tenant(listing("drift_finding"), TENANT)
    owners = sorted({str(x.get("owner_username")) for x in truth_leases})
    r.note(f"ground truth ({TENANT}, API key)",
           f"{len(truth_leases)} leases across {len(owners)} owners; "
           f"{len(truth_findings)} drift findings")

    admin = login(ADMIN)
    engineer = login(ENGINEER)

    # ---- 1. Record filter -------------------------------------------------
    admin_leases = listing("lease", token=admin)
    admin_owned = [x for x in admin_leases if x.get("owner_username") == ADMIN]
    r.check(
        "tenant_admin lists leases (its rule has NO filter_field)",
        f"all {len(truth_leases)} leases in {TENANT}",
        f"{len(admin_leases)} lease(s); {len(admin_owned)} owned by the admin "
        f"-> the tenant_user owner filter was applied to tenant_admin",
        passed=len(admin_leases) == len(truth_leases),
    )

    eng_leases = listing("lease", token=engineer)
    eng_foreign = [x for x in eng_leases if x.get("owner_username") != ENGINEER]
    r.check(
        "tenant_user lists leases (its rule HAS filter_field) - control",
        "only rows owned by the engineer",
        f"{len(eng_leases)} row(s), {len(eng_foreign)} owned by someone else",
        passed=not eng_foreign,
    )

    # ---- 2. Field-level restriction ---------------------------------------
    admin_findings = listing("drift_finding", token=admin)
    eng_findings = listing("drift_finding", token=engineer)
    admin_sees = any("wasted_cost_usd" in x for x in admin_findings)
    eng_sees = any("wasted_cost_usd" in x for x in eng_findings)
    stored = any("wasted_cost_usd" in x for x in truth_findings)

    r.note("field is stored on the record at all",
           f"API-key principal sees wasted_cost_usd: {stored}")
    r.check(
        "tenant_admin reads wasted_cost_usd (its rule has NO hidden_fields)",
        "visible to the admin",
        f"visible: {admin_sees} -> the tenant_user hidden_fields was applied "
        f"to tenant_admin",
        passed=admin_sees,
    )
    r.check(
        "tenant_user reads wasted_cost_usd (its rule HIDES it) - control",
        "hidden from the engineer",
        f"visible: {eng_sees}",
        passed=not eng_sees,
    )

    # ---- 3. The restriction is genuinely fail-closed, not a leak ----------
    r.check(
        "no privilege escalation in the other direction",
        "the engineer never sees more than the admin",
        f"engineer leases={len(eng_leases)} admin leases={len(admin_leases)}; "
        f"engineer cost-field={eng_sees} admin cost-field={admin_sees}",
        passed=not (eng_sees and not admin_sees) and len(eng_leases) <= len(truth_leases),
    )

    return r.report()


if __name__ == "__main__":
    sys.exit(main())
