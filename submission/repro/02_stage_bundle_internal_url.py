#!/usr/bin/env python3
"""BUG 2 - build_stage_bundle returns an in-cluster address to external clients.

build_stage_bundle exists so an MCP client can upload a large app bundle
out-of-band instead of inlining it in a tool call. Its whole audience is
therefore external. The upload_url it returns is a Kubernetes in-cluster
service DNS name over plain HTTP:

    http://platform-core-service:8083/api/v1/files/<domain>/upload

That host resolves inside the platform's own namespace and nowhere else, so the
documented flow cannot be completed as instructed from any MCP client.

The same path on the public API host works on the first attempt and returns a
usable file_id, which is what this script demonstrates.

Impact: the large-bundle path is unusable as documented. An agent that follows
the instruction verbatim fails, and the failure looks like a network problem on
the client side rather than a wrong value in the response. Nothing in the
documentation set mentions the upload host.

Run:  SUPERO_API_KEY=ak_... python3 02_stage_bundle_internal_url.py
"""

import gzip
import io
import json
import sys
import urllib.parse
import urllib.request

from _supero import API, KEY, UA, Result, mcp, require_key, resolves


def upload(url, blob):
    """Multipart upload, hand-rolled so the script has no dependencies."""
    boundary = "----reclaimrepro"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="probe.gz"\r\n'
        f"Content-Type: application/gzip\r\n\r\n"
    ).encode() + blob + f"\r\n--{boundary}--\r\n".encode()
    req = urllib.request.Request(url, data=body, method="POST")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    req.add_header("X-API-Key", KEY)
    req.add_header("User-Agent", UA)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except Exception as e:  # noqa: BLE001
        return 0, {"error": type(e).__name__ + ": " + str(e)[:120]}


def main():
    require_key()
    r = Result("BUG 2 - build_stage_bundle returns an unreachable in-cluster upload URL")

    st, resp = mcp("build_stage_bundle")
    url = resp.get("upload_url", "")
    r.note("build_stage_bundle upload_url", url or json.dumps(resp)[:200])
    if not url:
        print("no upload_url returned; cannot continue")
        return 2

    parsed = urllib.parse.urlparse(url)
    host = parsed.hostname or ""

    r.check(
        "upload_url host is publicly resolvable",
        "a DNS name an MCP client can reach",
        f"{host!r} resolves: {resolves(host)}",
        passed=resolves(host),
    )
    r.check(
        "upload_url uses TLS",
        "https",
        f"scheme is {parsed.scheme!r}",
        passed=parsed.scheme == "https",
    )

    blob = gzip.compress(json.dumps({"probe.txt": "reproduction probe"}).encode())

    st_internal, body_internal = upload(url, blob)
    r.check(
        "uploading to the documented upload_url succeeds",
        "HTTP 200/201 with a file_id",
        f"HTTP {st_internal} {json.dumps(body_internal)[:110]}",
        passed=st_internal in (200, 201) and "file_id" in body_internal,
    )

    # The same path on the public host.
    public = API + parsed.path
    st_public, body_public = upload(public, blob)
    r.note("same path on the public host",
           f"{public} -> HTTP {st_public} "
           f"file_id={body_public.get('file_id', json.dumps(body_public)[:80])}")
    r.note("conclusion",
           "the endpoint is correct; only the HOST in the response is wrong "
           "(internal service DNS instead of the public API host)")

    return r.report()


if __name__ == "__main__":
    sys.exit(main())
