#!/usr/bin/env python3
"""CONTRIBUTION 5 - a root cause for a failure mode Supero already knows about.

Supero documents stale rolls and ships the check that catches them:

    build_smoke_test(..., expected_app_js_sha1=<first 12 hex of sha1sum ui/app.js>)
      "pass expected_app_js_sha1 to confirm the roll landed"   (SKILLS.md)

So this is NOT a discovery. During this build a deploy reported
`status: "running"` with the new version's generation_uuid while the container
served the previous version's bundle, and that check caught it exactly as
designed. Credit where it is due.

What may be worth having is the likely cause, which is visible in the deploy
status response itself: the image is deployed under a MUTABLE per-service tag.

    image_uri: ".../superoapps/preview-<domain>-<project>:latest"

A Cloud Run revision pinned to a floating tag carries nothing identifying which
build it received, so nothing downstream can detect that it got the wrong one -
and `build_teardown` fixes it precisely because deleting the service forces a
fresh pull.

Two changes would close it:
  1. Deploy by immutable digest, or tag per version. build_publish already
     computes and returns a bundle `checksum` that would serve.
  2. Return the running revision's artifact hash from build_deploy_status, so
     `running` means running THIS. build_smoke_test already derives that value
     after the fact by fetching app.js over HTTP and hashing it.

This script reports the current deployment's image_uri and whether it is
mutable. It asserts nothing about a live stale roll, because that is a race and
a reproduction script should not pretend to trigger one reliably.

Run:  SUPERO_API_KEY=ak_... SUPERO_PROJECT_UUID=... python3 05_deploy_status_artifact.py
"""

import os
import sys

from _supero import Result, mcp, require_key

PROJECT_UUID = os.getenv("SUPERO_PROJECT_UUID", "341ac9d3-833e-4b49-91ee-3feb42c79e8b")
POLL = f"/api/v1/preview/project/{os.getenv('SUPERO_DOMAIN', 'stephen-rhodes')}/" \
       f"{os.getenv('SUPERO_PROJECT', 'reclaim')}?project_uuid={PROJECT_UUID}"


def main():
    require_key()
    r = Result("CONTRIBUTION 5 - deploys use a mutable :latest image tag")

    _, resp = mcp("build_deploy_status", {"poll_url": POLL})
    raw = resp.get("raw", {})
    image = raw.get("image_uri", "")
    r.note("status", f"{resp.get('status')!r} generation_uuid={raw.get('generation_uuid')}")
    r.note("image_uri", image or "(nothing deployed right now)")

    if not image:
        r.note("skipped", "no deployment live; redeploy and re-run to capture the image_uri")
        return r.report()

    tag = image.rsplit(":", 1)[-1] if ":" in image.rsplit("/", 1)[-1] else "(none)"
    r.check(
        "the deployed image is identified immutably",
        "a digest (@sha256:...) or a per-version tag",
        f"tag is {tag!r} - mutable, reused by every deploy of this service",
        passed=tag.startswith("sha256") or ("@" in image) or tag not in ("latest", "(none)"),
    )
    r.check(
        "build_deploy_status reports what is actually running",
        "an artifact hash or digest for the live revision",
        "response carries the REQUESTED generation_uuid and a floating image "
        "tag; no field identifies the artifact actually serving",
        passed=any(k in raw for k in ("app_js_sha1", "artifact_sha1", "image_digest", "revision")),
    )
    r.note("already mitigated by",
           "build_smoke_test(expected_app_js_sha1=...), which caught a real "
           "stale roll during this build")
    return r.report()


if __name__ == "__main__":
    sys.exit(main())
