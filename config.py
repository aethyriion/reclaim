"""Reclaim — app identity, tenants and seeded accounts.

Two named tenants exist so the model is exercised against a second organisation
from the first run, not retrofitted later. `default-tenant` holds only the
super-admin; all fleet data lives in the named tenants.
"""

import os
from dataclasses import dataclass, field


@dataclass
class AppConfig:
    app_name: str = "Reclaim"
    app_emoji: str = "♻"
    app_description: str = "Environment lease tracking and drift reconciliation for shared Kubernetes fleets."

    domain_name: str = field(default_factory=lambda: os.getenv("SUPERO_DOMAIN", "stephen-rhodes"))
    admin_email: str = field(default_factory=lambda: os.getenv("SUPERO_ADMIN_EMAIL", "admin@reclaim.dev"))
    admin_password: str = field(default_factory=lambda: os.getenv("SUPERO_PASSWORD", "") or "Password123!")
    project_name: str = field(default_factory=lambda: os.getenv("SUPERO_PROJECT", "reclaim"))

    tenants: list = field(default_factory=lambda: [
        {"name": "default-tenant", "display_name": "Reclaim HQ"},
        {"name": "northwind", "display_name": "Northwind Systems"},
        {"name": "contoso", "display_name": "Contoso Cloud"},
    ])

    users: list = field(default_factory=lambda: [
        # Super-admin: lives in default-tenant, can switch tenant scope in-app.
        {"email": "admin@reclaim.dev", "password": "Password123!", "role": "tenant_admin",
         "full_name": "Reclaim Operator", "tenant": "default-tenant"},
        # Platform tester account — kept in every Supero app.
        {"email": "testapp@test.com", "password": "Password123!", "role": "developer",
         "full_name": "App Tester", "tenant": "default-tenant"},

        # Northwind Systems — dual approval OFF.
        {"email": "nw-admin@northwind.example", "password": "Password123!", "role": "tenant_admin",
         "full_name": "Priya Raghavan", "tenant": "northwind"},
        {"email": "nw-eng@northwind.example", "password": "Password123!", "role": "tenant_user",
         "full_name": "Dan Okafor", "tenant": "northwind"},

        # Contoso Cloud — dual approval ON.
        {"email": "ct-admin@contoso.example", "password": "Password123!", "role": "tenant_admin",
         "full_name": "Mika Lindqvist", "tenant": "contoso"},
        {"email": "ct-eng@contoso.example", "password": "Password123!", "role": "tenant_user",
         "full_name": "Sam Whitfield", "tenant": "contoso"},
    ])

    # No integrations: every workflow step here is CRUD, so nothing depends on a
    # secret that would have to be configured outside the bundle.
    services: list = field(default_factory=lambda: ["workflows"])

    public_schemas: list = field(default_factory=lambda: [])
