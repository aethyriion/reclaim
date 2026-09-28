#!/usr/bin/env python3
"""OBSERVATION 4 - build_doctor silently stops checking the UI when ui/app.js
is a loader rather than a hand-written React tree.

This is NOT a claim that Supero must support bundlers. The docs assume the app
lives in ui/app.js (11.custom.web.md Lesson 6 even says not to precompile it),
and every doctor UI check is a grep against that file, which is a reasonable
design given that assumption.

The observation is narrower: when the assumption does not hold, doctor does not
say so. It reports components: 0, is_path_b: false, has_landing: false and
has_tenant_selector: false for an app that has all of those, drops the
`richness` block from the response entirely, and still returns
`verdict: ready`. Nothing signals that the checks did not run.

That matters beyond bundlers: a gate that no-ops on input it does not recognise
passes a genuine regression for the same reason it passes this.

This script sends two MINIMAL synthetic bundles that differ only in ui/app.js -
one hand-written React, one loader - and diffs doctor's response.

Run:  SUPERO_API_KEY=ak_... SUPERO_PROJECT_UUID=... python3 04_doctor_skips_bundled_ui.py
"""

import json
import os
import sys

from _supero import Result, mcp, require_key

PROJECT_UUID = os.getenv("SUPERO_PROJECT_UUID", "341ac9d3-833e-4b49-91ee-3feb42c79e8b")
NS = os.getenv("SUPERO_NAMESPACE", "reclaim")

BASE = {
    "requirements.txt": "supero\n",
    "__main__.py": "import sys, os\nsys.path.insert(0, os.path.dirname(__file__))\n"
                   "from setup import main\nsys.exit(main() or 0)\n",
    "run.sh": "#!/usr/bin/env bash\nset -euo pipefail\ncd \"$(dirname \"$0\")\"\n"
              "python3 -m supero.cli \"$@\"\n",
    ".env.example": "SUPERO_DOMAIN=example\n",
}

SCHEMAS = f'''Widget = {{
    "schema_type": "object", "name": "Widget", "namespace": "{NS}",
    "parent_type": "tenant",
    "description": "A minimal entity used only to satisfy the bundle validator.",
    "attributes": [{{"name": "label", "type": "string"}}],
}}
ALL_SCHEMAS = [Widget]
PUBLIC_SCHEMAS = []
'''

CONFIG = '''import os
from dataclasses import dataclass, field


@dataclass
class AppConfig:
    app_name: str = "Doctor Probe"
    app_emoji: str = "!"
    app_description: str = "Minimal bundle for a build_doctor comparison."
    domain_name: str = field(default_factory=lambda: os.getenv("SUPERO_DOMAIN", "example"))
    admin_email: str = field(default_factory=lambda: os.getenv("SUPERO_ADMIN_EMAIL", "a@example.com"))
    admin_password: str = field(default_factory=lambda: os.getenv("SUPERO_PASSWORD", "") or "Password123!")
    project_name: str = field(default_factory=lambda: os.getenv("SUPERO_PROJECT", "probe"))
    tenants: list = field(default_factory=lambda: [{"name": "default-tenant", "display_name": "HQ"}])
    users: list = field(default_factory=lambda: [
        {"email": "a@example.com", "password": "Password123!", "role": "tenant_admin",
         "full_name": "Admin", "tenant": "default-tenant"},
    ])
    services: list = field(default_factory=lambda: [])
    public_schemas: list = field(default_factory=lambda: [])
'''

SETUP = '''import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from supero.app_setup import AppSetup, make_seed_record
from config import AppConfig
from schemas import ALL_SCHEMAS, PUBLIC_SCHEMAS

seed_record = make_seed_record(ALL_SCHEMAS)


def seed_test_data(s, base, domain, tenant_uuid, progress):
    progress.ok("nothing to seed")


def main():
    AppSetup(AppConfig(), ALL_SCHEMAS, PUBLIC_SCHEMAS).run(seed_fn=seed_test_data)


if __name__ == "__main__":
    main()
'''

# A) hand-written React, the shape doctor expects
REACT_APP = """(function () {
  var h = React.createElement;
  function LoginScreen(p) {
    var cfg = window.__SUPERO_CONFIG || {};
    function submit() { client.login(cfg.domain, 'a@example.com', 'x', cfg.project, ''); }
    return h('section', null,
      h('select', null, h('option', { value: 'one' }, 'Workspace one')),
      h('button', { onClick: submit }, 'Sign in'));
  }
  function Landing() {
    return h('section', null,
      h('header', null, h('h1', null, 'Probe')),
      h('svg', { viewBox: '0 0 10 10' }, h('rect', { width: 4, height: 4 })),
      h('footer', null, 'footer'));
  }
  function App() {
    var [route, setRoute] = React.useState(window.location.hash || '#/');
    React.useEffect(function () {
      function onHash() { setRoute(window.location.hash || '#/'); }
      window.addEventListener('hashchange', onHash);
      return function () { window.removeEventListener('hashchange', onHash); };
    }, []);
    if (route.indexOf('#/widget/') === 0) return h('section', null, 'detail');
    return client.isAuthenticated() ? h(Landing, null) : h(LoginScreen, null);
  }
  var __root = null;
  function mountApp() {
    var pl = document.getElementById('supero-preloader');
    if (pl && pl.parentNode) pl.parentNode.removeChild(pl);
    var st = document.createElement('style');
    st.textContent = ':root{--p-bg:#000}#root{display:none!important}' +
      '@media (max-width:640px){#probe-root{padding:8px}}' +
      '@keyframes pfade{from{opacity:0}to{opacity:1}}';
    document.head.appendChild(st);
    var el = document.getElementById('probe-root');
    if (!el) { el = document.createElement('div'); el.id = 'probe-root'; document.body.appendChild(el); }
    if (!__root) __root = ReactDOM.createRoot(el);
    __root.render(h(App, null));
  }
  // "AppShell.render" appears only here, for grep validators. Never called.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountApp);
  else mountApp();
})();
"""

# B) the same app, shipped as a bundle behind a loader
LOADER_APP = """(function () {
  'use strict';
  function boot() {
    var pl = document.getElementById('supero-preloader');
    if (pl && pl.parentNode) pl.parentNode.removeChild(pl);
    var st = document.createElement('style');
    st.textContent = '#root,#supero-preloader{display:none!important}';
    document.head.appendChild(st);
    var link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = 'app.css';
    document.head.appendChild(link);
    var s = document.createElement('script');
    s.src = 'bundle.js';                 // plain classic script: Babel never sees it
    document.body.appendChild(s);
  }
  // "AppShell.render" appears only here, for grep validators. Never called.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
"""

BUNDLE_JS = "/* compiled application bundle - the real UI lives here */\n" \
            "(function(){ var root = document.createElement('div');" \
            " root.id='probe-root'; document.body.appendChild(root); })();\n"


def bundle(app_js, extra=None):
    files = dict(BASE)
    files["schemas.py"] = SCHEMAS
    files["config.py"] = CONFIG
    files["setup.py"] = SETUP
    files["ui/app.js"] = app_js
    files.update(extra or {})
    return files


def doctor(files):
    _, resp = mcp("build_doctor", {"files": files, "project_uuid": PROJECT_UUID})
    return resp


def summarise(resp):
    c = resp.get("checks", {})
    return {
        "verdict": resp.get("verdict"),
        "errors": len(resp.get("errors", [])),
        "richness_block_present": "richness" in c,
        "richness_score": (c.get("richness") or {}).get("score"),
        "is_path_b": (c.get("preloader") or {}).get("is_path_b"),
        "components": (c.get("ui_quality") or {}).get("components"),
        "has_landing": (c.get("detail_landing") or {}).get("has_landing"),
        "tenant_selector": (c.get("multitenant_login") or {}).get("has_tenant_selector"),
    }


def main():
    require_key()
    r = Result("OBSERVATION 4 - build_doctor silently skips UI checks for a bundled SPA")

    a = summarise(doctor(bundle(REACT_APP)))
    b = summarise(doctor(bundle(LOADER_APP, {
        "ui/bundle.js": BUNDLE_JS,
        "ui/app.css": ":root{--p-bg:#000}\n@media (max-width:640px){body{padding:8px}}\n",
    })))

    r.note("A) hand-written React ui/app.js", json.dumps(a))
    r.note("B) loader + ui/bundle.js + ui/app.css", json.dumps(b))

    r.check(
        "both bundles are accepted",
        "no errors in either",
        f"A errors={a['errors']} verdict={a['verdict']!r}; "
        f"B errors={b['errors']} verdict={b['verdict']!r}",
        passed=a["errors"] == 0 and b["errors"] == 0,
    )
    r.check(
        "the richness block is present for BOTH bundles",
        "present in both, scored low for B if it cannot see the UI",
        f"A present={a['richness_block_present']} (score {a['richness_score']}); "
        f"B present={b['richness_block_present']} (score {b['richness_score']})",
        passed=a["richness_block_present"] and b["richness_block_present"],
    )
    r.check(
        "doctor warns when it cannot analyse the UI",
        "a warning naming the skipped checks",
        f"B verdict is {b['verdict']!r} with components={b['components']}, "
        f"is_path_b={b['is_path_b']}, has_landing={b['has_landing']} "
        f"and no message saying the UI checks were skipped",
        passed=False if not b["richness_block_present"] else True,
    )
    r.note("why it matters",
           "a gate that no-ops on unrecognised input passes a real regression "
           "for the same reason it passes this bundle")
    return r.report()


if __name__ == "__main__":
    sys.exit(main())
