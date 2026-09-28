"""Shared helper for the Reclaim reproduction scripts.

Every script here is standalone and re-runnable against a fresh Supero project.
Set SUPERO_API_KEY (a project or domain key) and optionally SUPERO_DOMAIN /
SUPERO_PROJECT, then run any repro directly.
"""

import json
import os
import socket
import sys
import urllib.error
import urllib.request

API = os.getenv("SUPERO_URL", "https://api.supero.dev").rstrip("/")
MCP = os.getenv("SUPERO_MCP", "https://app.supero.dev/mcp/v1/messages")
DOMAIN = os.getenv("SUPERO_DOMAIN", "stephen-rhodes")
PROJECT = os.getenv("SUPERO_PROJECT", "reclaim")
KEY = os.getenv("SUPERO_API_KEY", "")
PASSWORD = os.getenv("SUPERO_DEMO_PASSWORD", "Password123!")

# The public API sits behind a WAF that rejects Python's default
# `Python-urllib/3.x` User-Agent with Cloudflare error 1010 (HTTP 403). curl is
# allowed through, so this is UA fingerprinting rather than auth. Any plain
# Python client needs a browser UA.
UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")


class Result:
    def __init__(self, name):
        self.name = name
        self.rows = []
        self.ok = True

    def check(self, label, expected, observed, passed):
        self.rows.append((label, expected, observed, passed))
        if not passed:
            self.ok = False

    def note(self, label, observed):
        self.rows.append((label, "", observed, None))

    def report(self):
        print("=" * 78)
        print(self.name)
        print("=" * 78)
        for label, expected, observed, passed in self.rows:
            mark = "    " if passed is None else ("PASS" if passed else "FAIL")
            print(f"[{mark}] {label}")
            if expected:
                print(f"       expected: {expected}")
            print(f"       observed: {observed}")
        print("-" * 78)
        print("RESULT:", "behaves as documented" if self.ok else "DOES NOT behave as documented")
        print("=" * 78)
        return 0 if self.ok else 1


def _req(url, method="GET", body=None, headers=None, timeout=40):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("User-Agent", UA)
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            raw = r.read().decode()
            try:
                return r.status, json.loads(raw or "{}")
            except json.JSONDecodeError:
                return r.status, {"raw": raw[:400]}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except json.JSONDecodeError:
            return e.code, {"raw": raw[:400]}
    except Exception as e:  # noqa: BLE001
        return 0, {"error": str(e)}


def api(path, method="GET", body=None, token=None, key=None, tenant=None):
    headers = {"X-Domain": DOMAIN}
    if token:
        headers["Authorization"] = "Bearer " + token
    else:
        headers["X-API-Key"] = key or KEY
    if tenant:
        headers["X-Tenant"] = tenant
    return _req(API + path, method, body, headers)


def mcp(tool, args=None):
    """Call an MCP build_* tool over HTTP, the same way an MCP client would."""
    st, body = _req(
        MCP, "POST",
        {"jsonrpc": "2.0", "id": 1, "method": "tools/call",
         "params": {"name": tool, "arguments": args or {}}},
        {"X-API-Key": KEY, "Accept": "application/json, text/event-stream"},
    )
    try:
        text = body["result"]["content"][0]["text"]
    except (KeyError, IndexError, TypeError):
        return st, body
    try:
        return st, json.loads(text)
    except json.JSONDecodeError:
        return st, {"text": text}


def login(email, password=PASSWORD):
    """Tenant is '' so the SERVER resolves the user's own tenant by email."""
    st, body = api("/api/v1/auth/login", "POST", {
        "domain": DOMAIN, "email": email, "password": password,
        "project": PROJECT, "tenant": "",
    }, token="")
    for holder in (body.get("auth") or {}, body, body.get("data") or {}):
        tok = holder.get("access_token") or holder.get("token")
        if tok:
            return tok
    print(f"could not sign in as {email}: HTTP {st} {json.dumps(body)[:200]}")
    sys.exit(2)


def rows(payload):
    if isinstance(payload, list):
        return payload
    for k in ("results", "objects", "data", "records"):
        v = payload.get(k)
        if isinstance(v, list):
            return v
    return []


def listing(schema, token=None, key=None, tenant=None):
    _, body = api(f"/api/v1/crud/{DOMAIN}/{schema}", token=token, key=key, tenant=tenant)
    return rows(body)


def in_tenant(records, tenant):
    out = []
    for r in records:
        fq = r.get("fq_name") or []
        if len(fq) > 2 and fq[2] == tenant:
            out.append(r)
    return out


def resolves(host):
    try:
        socket.getaddrinfo(host, None)
        return True
    except OSError:
        return False


def require_key():
    if not KEY:
        print("Set SUPERO_API_KEY first.")
        sys.exit(2)
