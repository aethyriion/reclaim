#!/usr/bin/env python3
"""OBSERVATION 3 - build_plan's vertical detector misclassifies, and the error
cascades into five downstream recommendations with no confidence signal.

build_plan is documented as deterministic and disclaims its output
("Deterministic guidance derived from your description - adapt to your exact
requirements"), so this is a quality problem rather than a contract violation.
It is included because the failure is silent and the cascade is large.

A description naming Kubernetes, clusters, environments, platform engineering
and drift reconciliation is classified as "real estate / property" - apparently
on the word "lease". The plan then recommends Photo Gallery, Floor Plan,
Location & Neighborhood and Agent Contact sections with a hero image for a
Kubernetes cluster, a photographic/lifestyle/serif theme for an internal ops
tool, and commerce-marketplace as the reference app to mirror.

The response prints a confidence signal for the hero archetype
("confidence: signal") but none for the vertical, so a caller has nothing to
gate on. Surfacing the same confidence for the vertical, and saying "unsure"
below a threshold, would cost little.

Run:  SUPERO_API_KEY=ak_... python3 03_vertical_misclassification.py
"""

import re
import sys

from _supero import Result, mcp, require_key

DESCRIPTION = (
    "Reclaim - an internal platform-engineering tool for tracking time-boxed "
    "reservations of shared Kubernetes cluster environments. Engineering teams "
    "claim an environment on a cluster for a fixed window; when the window "
    "expires the environment should be released back to the pool. The tool "
    "reconciles disagreements between what the system believes is released and "
    "what the cluster still reports as allocated. Internal, login-only, used by "
    "platform engineers and platform admins at each customer organisation."
)
ENTITIES = ["cluster", "environment", "lease", "drift_finding"]

REAL_ESTATE_ARTIFACTS = [
    "Photo Gallery", "Floor Plan", "Location & Neighborhood",
    "Agent Contact", "Features & Amenities", "square feet",
]


def vertical(text):
    m = re.search(r"Detected vertical: \*\*(.+?)\*\*", text)
    return m.group(1) if m else "?"


def main():
    require_key()
    r = Result("OBSERVATION 3 - build_plan vertical misclassification cascades silently")

    _, inferred = mcp("build_plan", {"description": DESCRIPTION, "entities": ENTITIES})
    _, explicit = mcp("build_plan", {
        "description": DESCRIPTION, "entities": ENTITIES,
        "is_multi_tenant": True, "public_facing": False,
    })
    t_inf = inferred.get("text", "")
    t_exp = explicit.get("text", "")

    r.check(
        "vertical detected for an explicitly Kubernetes description",
        "an infrastructure / internal-tools vertical",
        f"{vertical(t_inf)!r}",
        passed="real estate" not in vertical(t_inf).lower(),
    )

    leaked = [a for a in REAL_ESTATE_ARTIFACTS if a.lower() in t_inf.lower()]
    r.check(
        "recommended page sections suit the domain",
        "no real-estate sections for a cluster",
        f"recommends: {', '.join(leaked) if leaked else 'none'}",
        passed=not leaked,
    )

    m = re.search(r"build_get_examples\(archetype='([a-z-]+)'\)", t_inf)
    archetype = m.group(1) if m else "?"
    r.check(
        "recommended reference app suits the domain",
        "ops-dashboard (an internal operations tool)",
        f"recommends {archetype!r}",
        passed=archetype == "ops-dashboard",
    )

    r.check(
        "passing is_multi_tenant/public_facing corrects the vertical",
        "explicit flags fix the classification",
        f"explicit run still detects {vertical(t_exp)!r}",
        passed="real estate" not in vertical(t_exp).lower(),
    )

    has_hero_conf = "confidence:" in t_inf
    has_vert_conf = bool(re.search(r"Detected vertical:.*confidence", t_inf))
    r.note(
        "confidence signalling",
        f"hero archetype prints a confidence: {has_hero_conf}; "
        f"vertical prints one: {has_vert_conf} "
        f"-> a caller cannot gate on the vertical being uncertain",
    )
    return r.report()


if __name__ == "__main__":
    sys.exit(main())
