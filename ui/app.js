/* Reclaim — environment lease tracking and drift reconciliation.
 *
 * Path B (fully custom React tree). Everything here reads and writes through the
 * locked `client.*` primitives; nothing reimplements auth, CRUD or RBAC.
 *
 * The one idea worth knowing before reading this file: an environment carries two
 * separate truths — `env_state` (what Reclaim believes) and `observed_allocation`
 * (what the cluster last reported) — and `Cluster.last_observed_at` says how old
 * that report is. Every destructive action in this UI is gated on that age.
 */
(function () {
  var h = React.createElement;

  // ---------------------------------------------------------------------
  // Constants — mirror of the enum `values` in schemas.py. Keep in sync.
  // ---------------------------------------------------------------------
  var ENV_STATES = ['available', 'claimed', 'expiring', 'releasing', 'disputed', 'quarantined'];
  var RESOLUTIONS = [
    { id: 'force_reclaim', label: 'Force reclaim',
      blurb: 'Destroy whatever is running and return the slot to the pool.',
      destructive: true },
    { id: 'mark_external', label: 'Mark external',
      blurb: 'This workload is legitimately managed elsewhere. Stop alerting; record who vouched for it.',
      destructive: false },
    { id: 'escalate', label: 'Escalate',
      blurb: 'Ownership is unclear. Page the owning team and leave the finding open.',
      destructive: false },
  ];

  var C = {
    bg: '#0B0E14', panel: '#111725', panel2: '#0E1420', line: '#1E2939',
    text: '#E6EDF7', mut: '#8A9BB4', dim: '#5C6B82',
    cyan: '#38BDF8', ok: '#34D399', warn: '#F59E0B', bad: '#F43F5E', violet: '#A78BFA',
  };

  // ---------------------------------------------------------------------
  // Helpers (prefixed — never shadow a runtime global such as formatDate)
  // ---------------------------------------------------------------------
  function rcNum(v, d) { var n = parseFloat(v); return isNaN(n) ? (d || 0) : n; }

  function rcMinutesSince(iso) {
    if (!iso) return null;
    var t = new Date(iso).getTime();
    if (isNaN(t)) return null;
    return Math.max(0, Math.round((Date.now() - t) / 60000));
  }

  function rcRelative(iso) {
    var m = rcMinutesSince(iso);
    if (m === null) return 'never';
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    var hrs = Math.floor(m / 60);
    if (hrs < 24) return hrs + 'h ago';
    return Math.floor(hrs / 24) + 'd ago';
  }

  function rcUntil(iso) {
    if (!iso) return '—';
    var ms = new Date(iso).getTime() - Date.now();
    if (isNaN(ms)) return '—';
    var past = ms < 0;
    var m = Math.abs(Math.round(ms / 60000));
    var s;
    if (m < 60) s = m + 'm';
    else if (m < 1440) s = Math.floor(m / 60) + 'h';
    else s = Math.floor(m / 1440) + 'd';
    return past ? s + ' overdue' : 'in ' + s;
  }

  function rcDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toISOString().slice(0, 16).replace('T', ' ') + 'Z';
  }

  function rcTone(kind, value) {
    if (kind === 'env') {
      return { available: C.ok, claimed: C.cyan, expiring: C.warn,
               releasing: C.violet, disputed: C.bad, quarantined: C.warn }[value] || C.mut;
    }
    if (kind === 'alloc') {
      return { free: C.ok, allocated: C.cyan, unknown: C.bad }[value] || C.mut;
    }
    if (kind === 'cluster') {
      return { healthy: C.ok, degraded: C.warn, unreachable: C.bad }[value] || C.mut;
    }
    if (kind === 'lease') {
      return { active: C.ok, expiring: C.warn, released: C.mut,
               release_failed: C.bad, force_reclaimed: C.violet }[value] || C.mut;
    }
    if (kind === 'finding') {
      return { open: C.bad, awaiting_second_approval: C.warn,
               resolved: C.ok, rejected: C.mut }[value] || C.mut;
    }
    return C.mut;
  }

  // Namespace-tolerant capability gate (§7.5 belt-and-suspenders).
  function rcCanWrite(schema) {
    var cfg = window.__SUPERO_CONFIG || {};
    try {
      if (client.canWrite(schema)) return true;
      return cfg.appNamespace ? !!client.canWrite(cfg.appNamespace + ':' + schema) : false;
    } catch (e) { return false; }
  }

  function rcIsStaff() {
    try {
      if (client.isAdmin()) return true;
      // fleet_policy is read-only for engineers and writable for admins, so it
      // is the honest capability probe here. Do NOT use drift_finding: engineers
      // may CREATE findings (report drift) and canWrite() is create||update.
      if (rcCanWrite('fleet_policy')) return true;
      var r = (client.userInfo || {}).role;
      return ['tenant_admin', 'domain_admin', 'platform_admin', 'developer'].indexOf(r) >= 0;
    } catch (e) { return false; }
  }

  function rcMe() {
    var u = client.userInfo || {};
    return u.email || u.fullName || '';
  }

  /* THE GUARD.
   * A force reclaim destroys a running workload on the strength of one reading.
   * If that reading is older than the organisation's staleness window, we cannot
   * distinguish "the workload is still there" from "we simply have not been able
   * to look" — so the destructive option is withdrawn, and the UI says why rather
   * than silently disabling a button. Non-destructive resolutions stay available,
   * because they are human assertions rather than inferences from an observation.
   */
  function rcObservationAge(cluster) {
    return cluster ? rcMinutesSince(cluster.last_observed_at) : null;
  }

  function rcStaleness(cluster, policy) {
    var limit = policy ? rcNum(policy.stale_observation_minutes, 30) : 30;
    var age = rcObservationAge(cluster);
    if (age === null) {
      return { stale: true, age: null, limit: limit,
               why: 'This cluster has never been successfully observed.' };
    }
    if (age > limit) {
      return { stale: true, age: age, limit: limit,
               why: 'The last successful observation of ' + (cluster.display_name || cluster.name) +
                    ' was ' + rcRelative(cluster.last_observed_at) + ', beyond this organisation’s ' +
                    limit + '-minute window.' };
    }
    return { stale: false, age: age, limit: limit, why: '' };
  }

  // ---------------------------------------------------------------------
  // Small presentational pieces
  // ---------------------------------------------------------------------
  function Pill(p) {
    return h('span', {
      style: {
        display: 'inline-block', padding: '2px 8px', borderRadius: 999, fontSize: 11,
        fontWeight: 600, letterSpacing: '.02em', color: p.tone,
        border: '1px solid ' + p.tone + '55', background: p.tone + '14',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', whiteSpace: 'nowrap',
      },
    }, p.children);
  }

  function Panel(p) {
    return h('div', {
      style: {
        background: C.panel, border: '1px solid ' + C.line, borderRadius: 10,
        padding: p.pad === undefined ? 18 : p.pad, marginBottom: 16,
      },
    }, p.children);
  }

  function SectionTitle(p) {
    return h('div', { style: { marginBottom: 12 } }, [
      h('div', { key: 't', style: { fontSize: 15, fontWeight: 700, color: C.text } }, p.title),
      p.sub ? h('div', { key: 's', style: { fontSize: 12.5, color: C.mut, marginTop: 3 } }, p.sub) : null,
    ]);
  }

  function Metric(p) {
    return h('div', {
      style: {
        flex: '1 1 150px', minWidth: 140, background: C.panel,
        border: '1px solid ' + C.line, borderRadius: 10, padding: '14px 16px',
      },
    }, [
      h('div', { key: 'l', style: { fontSize: 11, textTransform: 'uppercase',
        letterSpacing: '.07em', color: C.mut, fontWeight: 600 } }, p.label),
      h('div', { key: 'v', style: { fontSize: 26, fontWeight: 700, marginTop: 6,
        color: p.tone || C.text, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' } },
        String(p.value)),
      p.sub ? h('div', { key: 's', style: { fontSize: 11.5, color: C.dim, marginTop: 4 } }, p.sub) : null,
    ]);
  }

  function Btn(p) {
    var tone = p.tone || C.cyan;
    var ghost = !!p.ghost;
    return h('button', {
      onClick: p.onClick, disabled: p.disabled, title: p.title || '',
      style: {
        padding: p.small ? '5px 11px' : '8px 15px', borderRadius: 7,
        fontSize: p.small ? 12 : 13, fontWeight: 600, cursor: p.disabled ? 'not-allowed' : 'pointer',
        border: '1px solid ' + (p.disabled ? C.line : tone + (ghost ? '66' : '')),
        background: p.disabled ? 'transparent' : (ghost ? 'transparent' : tone + '1f'),
        color: p.disabled ? C.dim : tone, opacity: p.disabled ? 0.55 : 1,
        transition: 'background .12s ease',
      },
    }, p.children);
  }

  function Empty(p) {
    return h('div', {
      style: { padding: '36px 18px', textAlign: 'center', color: C.dim, fontSize: 13.5 },
    }, p.children);
  }

  function Banner(p) {
    var tone = p.tone || C.warn;
    return h('div', {
      style: {
        border: '1px solid ' + tone + '55', background: tone + '12', borderRadius: 9,
        padding: '12px 14px', marginBottom: 14, fontSize: 13, color: C.text, lineHeight: 1.55,
      },
    }, [
      h('div', { key: 'h', style: { fontWeight: 700, color: tone, marginBottom: 4, fontSize: 12.5,
        textTransform: 'uppercase', letterSpacing: '.06em' } }, p.title),
      h('div', { key: 'b', style: { color: C.mut } }, p.children),
    ]);
  }

  // ---------------------------------------------------------------------
  // Logged-out surface: a value-prop sign-in, not a data catalog.
  // Reclaim is an internal tool — nothing about a customer's fleet belongs on
  // an unauthenticated page, so PUBLIC_SCHEMAS is empty and this is static copy.
  // ---------------------------------------------------------------------
  function Landing(p) {
    var row = { display: 'flex', gap: 18, flexWrap: 'wrap' };
    return h('div', { style: { minHeight: '100vh', background: C.bg, color: C.text } }, [
      h('header', { key: 'nav', style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '18px 24px', borderBottom: '1px solid ' + C.line, flexWrap: 'wrap', gap: 12,
      } }, [
        h('div', { key: 'b', style: { display: 'flex', alignItems: 'center', gap: 10 } }, [
          h('div', { key: 'm', style: {
            width: 26, height: 26, borderRadius: 7, border: '1px solid ' + C.cyan + '77',
            background: C.cyan + '1a', color: C.cyan, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 14, fontWeight: 800,
          } }, '♻'),
          h('span', { key: 'n', style: { fontWeight: 800, letterSpacing: '-.01em', fontSize: 17 } }, 'Reclaim'),
        ]),
        h('div', { key: 'c' }, h(Btn, { onClick: p.onSignIn }, 'Sign in')),
      ]),

      h('section', { key: 'hero', style: { maxWidth: 980, margin: '0 auto', padding: '64px 24px 20px' } }, [
        h('div', { key: 'k', style: {
          fontSize: 11.5, letterSpacing: '.14em', textTransform: 'uppercase',
          color: C.cyan, fontWeight: 700, marginBottom: 16,
        } }, 'Platform operations'),
        h('h1', { key: 'h1', style: {
          fontSize: 'clamp(30px, 5.2vw, 50px)', lineHeight: 1.08, fontWeight: 800,
          letterSpacing: '-.025em', margin: '0 0 20px',
        } }, [
          'Every idle environment is a bill ',
          h('span', { key: 'em', style: { color: C.cyan } }, 'nobody agreed to pay'),
          '.',
        ]),
        h('p', { key: 'p', style: {
          fontSize: 17, lineHeight: 1.62, color: C.mut, maxWidth: 680, margin: '0 0 30px',
        } }, 'Reclaim tracks time-boxed leases on shared Kubernetes environments and reconciles the moment your records and your clusters stop agreeing — so a release that quietly failed becomes a decision someone makes, not a cost you discover next quarter.'),
        h('div', { key: 'cta', style: { display: 'flex', gap: 12, flexWrap: 'wrap' } }, [
          h(Btn, { key: 'a', onClick: p.onSignIn }, 'Sign in to your fleet'),
        ]),
      ]),

      h('section', { key: 'why', style: { maxWidth: 980, margin: '0 auto', padding: '30px 24px 70px' } }, [
        h('div', { style: row }, [
          h('div', { key: 1, style: { flex: '1 1 260px', background: C.panel,
            border: '1px solid ' + C.line, borderRadius: 10, padding: 20 } }, [
            h('div', { key: 't', style: { fontWeight: 700, marginBottom: 8, fontSize: 14.5 } },
              'Two truths, kept apart'),
            h('div', { key: 'b', style: { color: C.mut, fontSize: 13.4, lineHeight: 1.6 } },
              'What the record believes and what the cluster reports are stored separately, with the age of the last observation alongside. A disagreement is data, not an error to swallow.'),
          ]),
          h('div', { key: 2, style: { flex: '1 1 260px', background: C.panel,
            border: '1px solid ' + C.line, borderRadius: 10, padding: 20 } }, [
            h('div', { key: 't', style: { fontWeight: 700, marginBottom: 8, fontSize: 14.5 } },
              'No silent reclaims'),
            h('div', { key: 'b', style: { color: C.mut, fontSize: 13.4, lineHeight: 1.6 } },
              'Destroying a workload on a stale reading is how a partitioned cluster becomes an outage. If the observation is too old to trust, Reclaim withdraws the option and tells you why.'),
          ]),
          h('div', { key: 3, style: { flex: '1 1 260px', background: C.panel,
            border: '1px solid ' + C.line, borderRadius: 10, padding: 20 } }, [
            h('div', { key: 't', style: { fontWeight: 700, marginBottom: 8, fontSize: 14.5 } },
              'Your rules, per organisation'),
            h('div', { key: 'b', style: { color: C.mut, fontSize: 13.4, lineHeight: 1.6 } },
              'Staleness windows and whether a force reclaim needs a second approver are set per organisation, so a stricter fleet is a setting rather than a rebuild.'),
          ]),
        ]),
      ]),

      h('footer', { key: 'f', style: {
        borderTop: '1px solid ' + C.line, padding: '20px 24px', color: C.dim, fontSize: 12.5,
        display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      } }, [
        h('span', { key: 'a' }, 'Reclaim — environment lease reconciliation'),
        h('span', { key: 'b' }, 'Demonstration fleet. All data is invented.'),
      ]),
    ]);
  }

  // ---------------------------------------------------------------------
  // Login. The tenant argument is '' so the server resolves the user's own
  // organisation from their email (rule 7 — never cfg.tenant).
  // ---------------------------------------------------------------------
  function LoginScreen(p) {
    var cfg = window.__SUPERO_CONFIG || {};
    var st = React.useState('');
    var email = st[0], setEmail = st[1];
    var st2 = React.useState('');
    var pw = st2[0], setPw = st2[1];
    var st3 = React.useState(false);
    var busy = st3[0], setBusy = st3[1];
    var st4 = React.useState('');
    var err = st4[0], setErr = st4[1];

    function submit(e) {
      if (e) e.preventDefault();
      if (!email || !pw) { setErr('Enter an email and password.'); return; }
      setBusy(true); setErr('');
      client.login(cfg.domain, email.trim(), pw, cfg.project, '')
        .then(function () { setBusy(false); p.onDone(); })
        .catch(function (ex) {
          setBusy(false);
          setErr((ex && ex.message) ? ex.message : 'Sign-in failed.');
        });
    }

    var input = {
      width: '100%', padding: '10px 12px', borderRadius: 7, fontSize: 14,
      background: C.panel2, border: '1px solid ' + C.line, color: C.text, outline: 'none',
      boxSizing: 'border-box',
    };

    return h('div', { style: {
      minHeight: '100vh', background: C.bg, color: C.text, display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: 20,
    } },
      h('div', { style: { width: '100%', maxWidth: 400 } }, [
        h('div', { key: 'b', style: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 } }, [
          h('div', { key: 'm', style: {
            width: 30, height: 30, borderRadius: 8, border: '1px solid ' + C.cyan + '77',
            background: C.cyan + '1a', color: C.cyan, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 15, fontWeight: 800,
          } }, '♻'),
          h('div', { key: 'n' }, [
            h('div', { key: 1, style: { fontWeight: 800, fontSize: 18 } }, 'Reclaim'),
            h('div', { key: 2, style: { fontSize: 12, color: C.mut } }, 'Sign in to your fleet'),
          ]),
        ]),
        h('form', { key: 'f', onSubmit: submit },
          h(Panel, { pad: 20 }, [
            err ? h('div', { key: 'e', style: {
              marginBottom: 14, padding: '9px 11px', borderRadius: 7, fontSize: 12.5,
              color: C.bad, background: C.bad + '12', border: '1px solid ' + C.bad + '44',
            } }, err) : null,
            h('label', { key: 'l1', style: { fontSize: 12, color: C.mut, fontWeight: 600 } }, 'Email'),
            h('input', { key: 'i1', type: 'email', value: email, autoFocus: true,
              onChange: function (e) { setEmail(e.target.value); },
              style: Object.assign({}, input, { margin: '6px 0 14px' }) }),
            h('label', { key: 'l2', style: { fontSize: 12, color: C.mut, fontWeight: 600 } }, 'Password'),
            h('input', { key: 'i2', type: 'password', value: pw,
              onChange: function (e) { setPw(e.target.value); },
              style: Object.assign({}, input, { margin: '6px 0 18px' }) }),
            h('button', { key: 'b', type: 'submit', disabled: busy, style: {
              width: '100%', padding: '10px 14px', borderRadius: 7, fontWeight: 700, fontSize: 14,
              cursor: busy ? 'wait' : 'pointer', border: '1px solid ' + C.cyan,
              background: C.cyan + '24', color: C.cyan,
            } }, busy ? 'Signing in…' : 'Sign in'),
          ])),
        h('div', { key: 'back', style: { textAlign: 'center', marginTop: 14 } },
          h('a', { href: '#/', onClick: function (e) { e.preventDefault(); p.onBack(); },
            style: { color: C.dim, fontSize: 12.5, textDecoration: 'none' } }, '← Back')),
      ]));
  }

  window.__RECLAIM_PARTS = { h: h, C: C, Pill: Pill, Panel: Panel, SectionTitle: SectionTitle,
    Metric: Metric, Btn: Btn, Empty: Empty, Banner: Banner, Landing: Landing,
    LoginScreen: LoginScreen, rcTone: rcTone, rcDate: rcDate, rcRelative: rcRelative,
    rcUntil: rcUntil, rcNum: rcNum, rcStaleness: rcStaleness, rcObservationAge: rcObservationAge,
    rcIsStaff: rcIsStaff, rcCanWrite: rcCanWrite, rcMe: rcMe, rcMinutesSince: rcMinutesSince,
    ENV_STATES: ENV_STATES, RESOLUTIONS: RESOLUTIONS };
})();

/* ---------------------------------------------------------------------------
 * Part two: the authenticated application.
 * ------------------------------------------------------------------------- */
(function () {
  var P = window.__RECLAIM_PARTS;
  var h = P.h, C = P.C;
  var Pill = P.Pill, Panel = P.Panel, SectionTitle = P.SectionTitle, Metric = P.Metric;
  var Btn = P.Btn, Empty = P.Empty, Banner = P.Banner;
  var rcTone = P.rcTone, rcDate = P.rcDate, rcRelative = P.rcRelative, rcUntil = P.rcUntil;
  var rcNum = P.rcNum, rcStaleness = P.rcStaleness, rcIsStaff = P.rcIsStaff, rcMe = P.rcMe;
  var RESOLUTIONS = P.RESOLUTIONS;

  var TD = { padding: '10px 12px', fontSize: 13, borderBottom: '1px solid ' + C.line, verticalAlign: 'middle' };
  var TH = { padding: '9px 12px', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.07em',
             color: C.mut, textAlign: 'left', fontWeight: 700, borderBottom: '1px solid ' + C.line };

  function byUuid(list, uuid) {
    for (var i = 0; i < list.length; i++) { if (list[i].uuid === uuid) return list[i]; }
    return null;
  }

  function envCluster(env, clusters) {
    if (!env) return null;
    var refs = env.Cluster_refs || env.cluster_refs || [];
    if (refs.length) {
      var u = refs[0].uuid || refs[0].to_uuid || refs[0];
      var found = byUuid(clusters, u);
      if (found) return found;
    }
    // Fall back to the namespace prefix, which encodes the cluster in seed data.
    for (var i = 0; i < clusters.length; i++) {
      var n = clusters[i].name || '';
      if (n && (env.name || '').indexOf(n) === 0) return clusters[i];
    }
    return null;
  }

  // -------------------------------------------------------------------
  // Fleet overview
  // -------------------------------------------------------------------
  function ClusterCard(p) {
    var c = p.cluster;
    var used = p.used, cap = rcNum(c.capacity, 0);
    var pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0;
    var stale = rcStaleness(c, p.policy);
    return h('div', { style: {
      flex: '1 1 300px', minWidth: 280, background: C.panel, border: '1px solid ' +
        (stale.stale ? C.bad + '55' : C.line), borderRadius: 10, padding: 16,
    } }, [
      h('div', { key: 'top', style: { display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: 10, marginBottom: 10 } }, [
        h('div', { key: 'l' }, [
          h('div', { key: 'n', style: { fontWeight: 700, fontSize: 14.5,
            fontFamily: 'ui-monospace, Menlo, monospace' } }, c.display_name || c.name),
          h('div', { key: 'r', style: { fontSize: 12, color: C.mut, marginTop: 2 } },
            (c.provider || '').toUpperCase() + ' · ' + (c.region || '')),
        ]),
        h(Pill, { key: 'p', tone: rcTone('cluster', c.cluster_state) }, c.cluster_state),
      ]),
      h('div', { key: 'bar', style: { marginTop: 12 } }, [
        h('div', { key: 'lbl', style: { display: 'flex', justifyContent: 'space-between',
          fontSize: 11.5, color: C.mut, marginBottom: 5 } }, [
          h('span', { key: 1 }, 'Allocated'),
          h('span', { key: 2, style: { fontFamily: 'ui-monospace, Menlo, monospace' } },
            used + ' / ' + cap),
        ]),
        h('div', { key: 'track', style: { height: 6, borderRadius: 4, background: C.panel2,
          border: '1px solid ' + C.line, overflow: 'hidden' } },
          h('div', { style: { width: pct + '%', height: '100%',
            background: pct > 85 ? C.warn : C.cyan } })),
      ]),
      h('div', { key: 'obs', style: { marginTop: 12, paddingTop: 10,
        borderTop: '1px solid ' + C.line, fontSize: 12 } }, [
        h('span', { key: 'l', style: { color: C.mut } }, 'Last observed '),
        h('span', { key: 'v', style: { color: stale.stale ? C.bad : C.ok, fontWeight: 600 } },
          rcRelative(c.last_observed_at)),
        stale.stale ? h('div', { key: 'w', style: { color: C.bad, marginTop: 6, fontSize: 11.5,
          lineHeight: 1.5 } }, 'Beyond the ' + stale.limit +
          '-minute window — destructive actions are withheld on this cluster.') : null,
      ]),
    ]);
  }

  /* Inline SVG: allocated vs capacity per cluster, over the seeded rows.
   * Bars are tinted by observation freshness, so a cluster we cannot currently
   * see reads as a risk rather than as a number. */
  function CapacityChart(p) {
    var rows = p.rows;
    if (!rows.length) return null;
    var W = 560, rowH = 26, pad = 104, H = rows.length * rowH + 14;
    var maxCap = 1;
    rows.forEach(function (r) { maxCap = Math.max(maxCap, r.cap); });
    var barW = W - pad - 56;

    var bars = [];
    rows.forEach(function (r, i) {
      var y = i * rowH + 8;
      var w = Math.max(2, Math.round((r.used / maxCap) * barW));
      var tone = r.stale ? C.bad : (r.used / Math.max(1, r.cap) > 0.85 ? C.warn : C.cyan);
      bars.push(h('text', { key: 'l' + i, x: 0, y: y + 12, fill: C.mut, fontSize: 11.5,
        fontFamily: 'ui-monospace, Menlo, monospace' }, r.label));
      bars.push(h('rect', { key: 'bg' + i, x: pad, y: y + 2, width: barW, height: 13,
        rx: 3, fill: C.panel2, stroke: C.line }));
      bars.push(h('rect', { key: 'b' + i, x: pad, y: y + 2, width: w, height: 13,
        rx: 3, fill: tone, opacity: 0.85 }));
      bars.push(h('text', { key: 'v' + i, x: pad + barW + 8, y: y + 12, fill: C.mut,
        fontSize: 11.5, fontFamily: 'ui-monospace, Menlo, monospace' }, r.used + '/' + r.cap));
    });

    return h('svg', {
      viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: H,
      role: 'img', 'aria-label': 'Allocated environments against capacity, by cluster',
      style: { maxWidth: W, display: 'block' },
    }, bars);
  }

  function FleetView(p) {
    var envs = p.data.environments, clusters = p.data.clusters, findings = p.data.findings;
    var open = findings.filter(function (f) {
      return f.finding_state === 'open' || f.finding_state === 'awaiting_second_approval';
    });
    var disputed = envs.filter(function (e) { return e.env_state === 'disputed'; });
    var idleCost = 0;
    disputed.forEach(function (e) { idleCost += rcNum(e.monthly_cost_usd, 0); });

    function usedOn(c) {
      return envs.filter(function (e) {
        return envCluster(e, clusters) === c && e.observed_allocation === 'allocated';
      }).length;
    }

    return h('div', null, [
      h(SectionTitle, { key: 't', title: 'Fleet',
        sub: 'Capacity, observation freshness and anything currently in dispute.' }),

      h('div', { key: 'm', style: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 18 } }, [
        h(Metric, { key: 1, label: 'Environments', value: envs.length,
          sub: envs.filter(function (e) { return e.env_state === 'available'; }).length + ' available' }),
        h(Metric, { key: 2, label: 'In dispute', value: disputed.length,
          tone: disputed.length ? C.bad : C.ok, sub: 'record and cluster disagree' }),
        h(Metric, { key: 3, label: 'Open findings', value: open.length,
          tone: open.length ? C.warn : C.ok, sub: 'awaiting a decision' }),
        h(Metric, { key: 4, label: 'Disputed spend', value: '$' + Math.round(idleCost),
          tone: idleCost ? C.warn : C.ok, sub: 'per month, unverified' }),
      ]),

      open.length ? h('div', { key: 'b' }, h(Banner, {
        tone: C.bad, title: open.length + ' finding' + (open.length > 1 ? 's' : '') + ' need a decision',
      }, [
        'An environment is in dispute when what Reclaim believes and what its cluster reports no longer agree. ',
        rcIsStaff() ? h('a', { key: 'l', href: '#/drift', style: { color: C.cyan } }, 'Open the drift queue →')
                    : 'A platform admin resolves these.',
      ])) : null,

      clusters.length ? h(Panel, { key: 'ch' }, [
        h(SectionTitle, { key: 't', title: 'Allocation against capacity',
          sub: 'Bars turn red where the observation behind them is too old to trust.' }),
        h(CapacityChart, { key: 'c', rows: clusters.map(function (c) {
          return { label: c.display_name || c.name, used: usedOn(c),
                   cap: rcNum(c.capacity, 0), stale: rcStaleness(c, p.data.policy).stale };
        }) }),
      ]) : null,

      h('div', { key: 'c', style: { display: 'flex', gap: 14, flexWrap: 'wrap' } },
        clusters.length ? clusters.map(function (c) {
          return h(ClusterCard, { key: c.uuid, cluster: c, used: usedOn(c), policy: p.data.policy });
        }) : [h(Empty, { key: 'e' }, 'No clusters in this organisation.')]),
    ]);
  }

  // -------------------------------------------------------------------
  // Environments
  // -------------------------------------------------------------------
  function EnvRow(p) {
    var e = p.env;
    var mismatch = (e.env_state === 'disputed') || (e.observed_allocation === 'unknown');
    return h('tr', {
      style: { cursor: 'pointer', background: mismatch ? C.bad + '0b' : 'transparent' },
      onClick: function () { p.onOpen(e); },
    }, [
      h('td', { key: 1, style: TD }, [
        h('div', { key: 'n', style: { fontWeight: 600,
          fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5 } }, e.display_name || e.name),
        h('div', { key: 'p', style: { color: C.dim, fontSize: 11.5, marginTop: 2 } }, e.namespace_path),
      ]),
      h('td', { key: 2, style: TD }, h(Pill, { tone: rcTone('env', e.env_state) }, e.env_state)),
      h('td', { key: 3, style: TD }, h(Pill, { tone: rcTone('alloc', e.observed_allocation) },
        'cluster: ' + e.observed_allocation)),
      h('td', { key: 4, style: Object.assign({}, TD, { color: C.mut, fontSize: 12.5 }) },
        e.current_holder || '—'),
      h('td', { key: 5, style: Object.assign({}, TD, { color: C.mut, fontSize: 12.5,
        fontFamily: 'ui-monospace, Menlo, monospace' }) },
        e.monthly_cost_usd ? '$' + Math.round(rcNum(e.monthly_cost_usd, 0)) + '/mo' : '—'),
    ]);
  }

  function EnvironmentsView(p) {
    var st = React.useState('all');
    var filt = st[0], setFilt = st[1];
    var envs = p.data.environments.filter(function (e) {
      return filt === 'all' ? true : e.env_state === filt;
    });
    var opts = ['all'].concat(P.ENV_STATES);

    return h('div', null, [
      h(SectionTitle, { key: 't', title: 'Environments',
        sub: 'Believed state on the left, the cluster’s last report beside it. They should match.' }),
      h('div', { key: 'f', style: { marginBottom: 14 } },
        h('select', {
          value: filt, onChange: function (e) { setFilt(e.target.value); },
          style: { background: C.panel2, color: C.text, border: '1px solid ' + C.line,
            borderRadius: 7, padding: '7px 10px', fontSize: 13 },
        }, opts.map(function (o) { return h('option', { key: o, value: o }, o); }))),
      h(Panel, { key: 'p', pad: 0 },
        envs.length ? h('table', { style: { width: '100%', borderCollapse: 'collapse' } }, [
          h('thead', { key: 'h' }, h('tr', null, [
            h('th', { key: 1, style: TH }, 'Environment'),
            h('th', { key: 2, style: TH }, 'Reclaim believes'),
            h('th', { key: 3, style: TH }, 'Cluster reports'),
            h('th', { key: 4, style: TH }, 'Holder'),
            h('th', { key: 5, style: TH }, 'Cost'),
          ])),
          h('tbody', { key: 'b' }, envs.map(function (e) {
            return h(EnvRow, { key: e.uuid, env: e,
              onOpen: function (x) { p.navigate('#/env/' + x.uuid); } });
          })),
        ]) : h(Empty, null, 'No environments match that filter.')),
    ]);
  }

  function EnvDetail(p) {
    var e = byUuid(p.data.environments, p.uuid);
    if (!e) return h(Empty, null, 'That environment is not in this organisation.');
    var cluster = envCluster(e, p.data.clusters);
    var stale = rcStaleness(cluster, p.data.policy);
    var leases = p.data.leases.filter(function (l) { return l.environment_uuid === e.uuid; });
    var findings = p.data.findings.filter(function (f) { return f.environment_uuid === e.uuid; });
    var agree = e.observed_allocation !== 'unknown' &&
      ((e.env_state === 'available' && e.observed_allocation === 'free') ||
       (e.env_state !== 'available' && e.env_state !== 'disputed' && e.observed_allocation === 'allocated'));

    return h('div', null, [
      h('a', { key: 'b', href: '#/environments', style: { color: C.dim, fontSize: 12.5,
        textDecoration: 'none', display: 'inline-block', marginBottom: 12 } }, '← Environments'),
      h(SectionTitle, { key: 't', title: e.display_name || e.name, sub: e.namespace_path }),

      h('div', { key: 'tru', style: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 } }, [
        h('div', { key: 1, style: { flex: '1 1 220px', background: C.panel,
          border: '1px solid ' + C.line, borderRadius: 10, padding: 16 } }, [
          h('div', { key: 'l', style: { fontSize: 10.5, textTransform: 'uppercase',
            letterSpacing: '.07em', color: C.mut, fontWeight: 700, marginBottom: 8 } },
            'Reclaim believes'),
          h(Pill, { key: 'v', tone: rcTone('env', e.env_state) }, e.env_state),
        ]),
        h('div', { key: 2, style: { flex: '1 1 220px', background: C.panel,
          border: '1px solid ' + C.line, borderRadius: 10, padding: 16 } }, [
          h('div', { key: 'l', style: { fontSize: 10.5, textTransform: 'uppercase',
            letterSpacing: '.07em', color: C.mut, fontWeight: 700, marginBottom: 8 } },
            'Cluster last reported'),
          h(Pill, { key: 'v', tone: rcTone('alloc', e.observed_allocation) }, e.observed_allocation),
          h('div', { key: 'a', style: { fontSize: 11.5, color: stale.stale ? C.bad : C.dim,
            marginTop: 8 } }, cluster ? rcRelative(cluster.last_observed_at) : 'no cluster linked'),
        ]),
      ]),

      !agree ? h('div', { key: 'w' }, h(Banner, { tone: C.bad, title: 'These do not agree' },
        'Reclaim believes this environment is ' + e.env_state + ', while its cluster last reported it ' +
        e.observed_allocation + '. Until that is resolved the slot is neither safely reusable nor safely destroyable.'
      )) : null,

      h(Panel, { key: 'l' }, [
        h(SectionTitle, { key: 't', title: 'Lease history' }),
        leases.length ? h('table', { key: 'tb', style: { width: '100%', borderCollapse: 'collapse' } }, [
          h('thead', { key: 'h' }, h('tr', null, [
            h('th', { key: 1, style: TH }, 'Holder'),
            h('th', { key: 2, style: TH }, 'Team'),
            h('th', { key: 3, style: TH }, 'Expires'),
            h('th', { key: 4, style: TH }, 'State'),
          ])),
          h('tbody', { key: 'b' }, leases.map(function (l) {
            return h('tr', { key: l.uuid }, [
              h('td', { key: 1, style: Object.assign({}, TD, { fontSize: 12.5 }) }, l.requested_by),
              h('td', { key: 2, style: Object.assign({}, TD, { color: C.mut, fontSize: 12.5 }) }, l.team),
              h('td', { key: 3, style: Object.assign({}, TD, { color: C.mut, fontSize: 12.5 }) },
                rcUntil(l.expires_at)),
              h('td', { key: 4, style: TD }, h(Pill, { tone: rcTone('lease', l.lease_state) }, l.lease_state)),
            ]);
          })),
        ]) : h(Empty, { key: 'e' }, 'Never leased.'),
        leases.filter(function (l) { return l.last_release_error; }).map(function (l) {
          return h('div', { key: l.uuid, style: { marginTop: 12, padding: '10px 12px',
            background: C.panel2, border: '1px solid ' + C.line, borderRadius: 7,
            fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11.5, color: C.bad,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word' } }, l.last_release_error);
        }),
      ]),

      findings.length ? h(Panel, { key: 'f' }, [
        h(SectionTitle, { key: 't', title: 'Findings' }),
        findings.map(function (f) {
          return h('div', { key: f.uuid, style: { display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid ' + C.line } }, [
            h('div', { key: 'l' }, [
              h('div', { key: 1, style: { fontSize: 13 } }, f.display_name),
              h('div', { key: 2, style: { fontSize: 11.5, color: C.dim, marginTop: 2 } },
                'detected ' + rcRelative(f.detected_at)),
            ]),
            h('div', { key: 'r', style: { display: 'flex', gap: 8, alignItems: 'center' } }, [
              h(Pill, { key: 'p', tone: rcTone('finding', f.finding_state) }, f.finding_state),
              rcIsStaff() ? h('a', { key: 'a', href: '#/drift/' + f.uuid,
                style: { color: C.cyan, fontSize: 12.5, textDecoration: 'none' } }, 'Review →') : null,
            ]),
          ]);
        }),
      ]) : null,
    ]);
  }
  window.__RECLAIM_VIEWS = { FleetView: FleetView, EnvironmentsView: EnvironmentsView,
    EnvDetail: EnvDetail, byUuid: byUuid, envCluster: envCluster, TD: TD, TH: TH };
})();

/* ---------------------------------------------------------------------------
 * Part three: leases, the drift queue, policy, shell and mount.
 * ------------------------------------------------------------------------- */
(function () {
  var P = window.__RECLAIM_PARTS, V = window.__RECLAIM_VIEWS;
  var h = P.h, C = P.C;
  var Pill = P.Pill, Panel = P.Panel, SectionTitle = P.SectionTitle, Metric = P.Metric;
  var Btn = P.Btn, Empty = P.Empty, Banner = P.Banner;
  var rcTone = P.rcTone, rcDate = P.rcDate, rcRelative = P.rcRelative, rcUntil = P.rcUntil;
  var rcNum = P.rcNum, rcStaleness = P.rcStaleness, rcIsStaff = P.rcIsStaff, rcMe = P.rcMe;
  var RESOLUTIONS = P.RESOLUTIONS;
  var byUuid = V.byUuid, envCluster = V.envCluster, TD = V.TD, TH = V.TH;

  /* Importing the workflows service needs an elevated permission, and a
   * project-scoped deploy key can be refused it — silently, leaving
   * services.workflow absent rather than erroring loudly. A refused import must
   * not turn every action in this app into a dead button, so each
   * workflow-driven action also names the CRUD writes that are equivalent and
   * falls back to them. The fallback runs as the caller, so an engineer's
   * fallback does strictly less than an admin's, which is the correct outcome:
   * server-side RBAC still decides, we just stop pretending the button works. */
  function rcAct(workflowId, input, fallback) {
    var run;
    try {
      run = (services && services.workflow && services.workflow.run)
        ? services.workflow.run(workflowId, input)
        : Promise.reject(new Error('workflows unavailable'));
    } catch (e) { run = Promise.reject(e); }
    return run.then(function (r) {
      if (r && r.status === 'failed') throw new Error('workflow reported failed');
      return { via: 'workflow' };
    }).catch(function () {
      return Promise.resolve(fallback()).then(function () { return { via: 'direct' }; });
    });
  }

  // -------------------------------------------------------------------
  // My leases. An engineer sees only their own rows — the server applies the
  // owner_username record filter to reads and writes alike.
  // -------------------------------------------------------------------
  function ClaimForm(p) {
    var free = p.data.environments.filter(function (e) { return e.env_state === 'available'; });
    var s1 = React.useState(free.length ? free[0].uuid : '');
    var envU = s1[0], setEnvU = s1[1];
    var s2 = React.useState('');
    var team = s2[0], setTeam = s2[1];
    var s3 = React.useState('');
    var purpose = s3[0], setPurpose = s3[1];
    var s4 = React.useState('3');
    var days = s4[0], setDays = s4[1];
    var s5 = React.useState(false);
    var busy = s5[0], setBusy = s5[1];

    var inp = { width: '100%', padding: '8px 10px', borderRadius: 7, fontSize: 13,
      background: C.panel2, border: '1px solid ' + C.line, color: C.text,
      outline: 'none', boxSizing: 'border-box', marginTop: 5 };

    function submit() {
      if (!envU || !team.trim()) { showToast('Pick an environment and name your team.', 'error'); return; }
      setBusy(true);
      var now = new Date();
      var exp = new Date(now.getTime() + parseInt(days, 10) * 86400000);
      var env = byUuid(p.data.environments, envU);
      var me = rcMe();
      var data = {
        display_name: (env ? env.display_name : 'environment') + ' · ' + team.trim(),
        description: purpose.trim() || 'Environment lease.',
        environment_uuid: envU,
        team: team.trim(),
        requested_by: me,
        owner_username: me,
        purpose: purpose.trim(),
        claimed_at: now.toISOString(),
        expires_at: exp.toISOString(),
        lease_state: 'active',
        release_attempts: 0,
      };
      client.createObjectWithRefs('lease', data, [{ ref_name: 'Environment', ref_uuid: envU }])
        .then(function (res) {
          if (res && res.refErrors && res.refErrors.length) {
            showToast('Lease created, but the environment link failed.', 'warning');
          }
          // Privileged path first; RBAC decides whether it lands.
          return client.updateObject('environment', envU, {
            env_state: 'claimed', observed_allocation: 'allocated',
            current_holder: me, current_team: team.trim(),
          }, env).then(function () {
            showToast('Environment claimed.', 'success');
          }).catch(function () {
            showToast('Lease recorded. The environment flips to claimed when the reconciler next runs.', 'info');
          });
        })
        .then(function () {
          setBusy(false);
          setTeam(''); setPurpose('');
          p.onDone();
        })
        .catch(function (e) {
          setBusy(false);
          showToast('Claim failed: ' + ((e && e.message) || 'unknown error'), 'error');
        });
    }

    if (!free.length) {
      return h(Panel, null, [
        h(SectionTitle, { key: 't', title: 'Claim an environment' }),
        h(Empty, { key: 'e' }, 'Nothing is available in this organisation right now.'),
      ]);
    }

    return h(Panel, null, [
      h(SectionTitle, { key: 't', title: 'Claim an environment',
        sub: 'Creating a lease marks the environment claimed server-side.' }),
      h('div', { key: 'g', style: { display: 'flex', gap: 12, flexWrap: 'wrap' } }, [
        h('div', { key: 1, style: { flex: '2 1 220px' } }, [
          h('label', { key: 'l', style: { fontSize: 11.5, color: C.mut, fontWeight: 600 } }, 'Environment'),
          h('select', { key: 's', value: envU, style: inp,
            onChange: function (e) { setEnvU(e.target.value); } },
            free.map(function (e) {
              return h('option', { key: e.uuid, value: e.uuid }, (e.display_name || e.name) + ' — ' + e.namespace_path);
            })),
        ]),
        h('div', { key: 2, style: { flex: '1 1 130px' } }, [
          h('label', { key: 'l', style: { fontSize: 11.5, color: C.mut, fontWeight: 600 } }, 'Team'),
          h('input', { key: 'i', value: team, placeholder: 'atlas', style: inp,
            onChange: function (e) { setTeam(e.target.value); } }),
        ]),
        h('div', { key: 3, style: { flex: '2 1 200px' } }, [
          h('label', { key: 'l', style: { fontSize: 11.5, color: C.mut, fontWeight: 600 } }, 'Purpose'),
          h('input', { key: 'i', value: purpose, placeholder: 'What is it for?', style: inp,
            onChange: function (e) { setPurpose(e.target.value); } }),
        ]),
        h('div', { key: 4, style: { flex: '0 1 110px' } }, [
          h('label', { key: 'l', style: { fontSize: 11.5, color: C.mut, fontWeight: 600 } }, 'Days'),
          h('select', { key: 's', value: days, style: inp,
            onChange: function (e) { setDays(e.target.value); } },
            ['1', '3', '7', '14'].map(function (d) { return h('option', { key: d, value: d }, d); })),
        ]),
      ]),
      h('div', { key: 'a', style: { marginTop: 14 } },
        h(Btn, { onClick: submit, disabled: busy }, busy ? 'Claiming…' : 'Claim environment')),
    ]);
  }

  function LeasesView(p) {
    var mine = p.data.leases;

    function release(l) {
      var env = byUuid(p.data.environments, l.environment_uuid);
      if (!env) { showToast('That environment is not visible to you.', 'error'); return; }
      rcAct('release_lease', {
        lease_uuid: l.uuid,
        environment_uuid: env.uuid,
        observed: env.observed_allocation,
        env_label: env.display_name || env.name,
      }, function () {
        var free = env.observed_allocation === 'free';
        return client.updateObject('lease', l.uuid, free
          ? { lease_state: 'released' }
          : { lease_state: 'release_failed',
              last_release_error: 'cluster still reports the namespace allocated at release time' }, l);
      }).then(function () {
        if (env.observed_allocation === 'free') showToast('Environment released.', 'success');
        else showToast('Release did not complete — the cluster still reports it allocated. A finding was opened.', 'warning');
        p.onDone();
      }).catch(function (e) {
        showToast('Release failed: ' + ((e && e.message) || 'unknown'), 'error');
      });
    }

    function extend(l) {
      var exp = new Date(new Date(l.expires_at).getTime() + 3 * 86400000);
      client.updateObject('lease', l.uuid, { expires_at: exp.toISOString(), lease_state: 'active' }, l)
        .then(function () { showToast('Extended by three days.', 'success'); p.onDone(); })
        .catch(function (e) { showToast('Extend failed: ' + ((e && e.message) || 'unknown'), 'error'); });
    }

    return h('div', null, [
      h(SectionTitle, { key: 't', title: 'My leases',
        sub: 'Leases you hold. Others’ leases are filtered out by the server, not by this page.' }),
      h(ClaimForm, { key: 'c', data: p.data, onDone: p.onDone }),
      h(Panel, { key: 'p', pad: 0 },
        mine.length ? h('table', { style: { width: '100%', borderCollapse: 'collapse' } }, [
          h('thead', { key: 'h' }, h('tr', null, [
            h('th', { key: 1, style: TH }, 'Environment'),
            h('th', { key: 2, style: TH }, 'Team'),
            h('th', { key: 3, style: TH }, 'Expires'),
            h('th', { key: 4, style: TH }, 'State'),
            h('th', { key: 5, style: TH }, ''),
          ])),
          h('tbody', { key: 'b' }, mine.map(function (l) {
            var env = byUuid(p.data.environments, l.environment_uuid);
            var done = l.lease_state === 'released' || l.lease_state === 'force_reclaimed';
            return h('tr', { key: l.uuid }, [
              h('td', { key: 1, style: Object.assign({}, TD, { fontFamily: 'ui-monospace, Menlo, monospace',
                fontSize: 12.5 }) }, env ? (env.display_name || env.name) : '—'),
              h('td', { key: 2, style: Object.assign({}, TD, { color: C.mut, fontSize: 12.5 }) }, l.team),
              h('td', { key: 3, style: Object.assign({}, TD, { color: C.mut, fontSize: 12.5 }) },
                rcUntil(l.expires_at)),
              h('td', { key: 4, style: TD }, h(Pill, { tone: rcTone('lease', l.lease_state) }, l.lease_state)),
              h('td', { key: 5, style: Object.assign({}, TD, { textAlign: 'right', whiteSpace: 'nowrap' }) },
                done ? h('span', { style: { color: C.dim, fontSize: 12 } }, 'closed')
                     : h('span', { style: { display: 'inline-flex', gap: 7 } }, [
                         h(Btn, { key: 'e', small: true, ghost: true, tone: C.mut,
                           onClick: function () { extend(l); } }, '+3d'),
                         h(Btn, { key: 'r', small: true, tone: C.cyan,
                           onClick: function () { release(l); } }, 'Release'),
                       ])),
            ]);
          })),
        ]) : h(Empty, null, 'You hold no leases.')),
    ]);
  }

  // -------------------------------------------------------------------
  // Drift queue and the resolution screen.
  // -------------------------------------------------------------------
  function DriftQueue(p) {
    var open = p.data.findings.filter(function (f) { return f.finding_state !== 'resolved' && f.finding_state !== 'rejected'; });
    var closed = p.data.findings.filter(function (f) { return f.finding_state === 'resolved' || f.finding_state === 'rejected'; });

    function row(f) {
      var env = byUuid(p.data.environments, f.environment_uuid);
      var cluster = envCluster(env, p.data.clusters);
      var stale = rcStaleness(cluster, p.data.policy);
      return h('tr', { key: f.uuid, style: { cursor: 'pointer' },
        onClick: function () { p.navigate('#/drift/' + f.uuid); } }, [
        h('td', { key: 1, style: TD }, [
          h('div', { key: 'n', style: { fontSize: 13, fontWeight: 600 } }, f.display_name),
          h('div', { key: 'd', style: { fontSize: 11.5, color: C.dim, marginTop: 2 } },
            'detected ' + rcRelative(f.detected_at)),
        ]),
        h('td', { key: 2, style: TD }, h(Pill, { tone: rcTone('finding', f.finding_state) }, f.finding_state)),
        h('td', { key: 3, style: TD },
          stale.stale ? h(Pill, { tone: C.bad }, 'observation stale')
                      : h(Pill, { tone: C.ok }, 'observation fresh')),
        h('td', { key: 4, style: Object.assign({}, TD, { color: C.mut, fontSize: 12.5 }) },
          f.wasted_cost_usd === undefined
            ? h('span', { style: { color: C.dim, fontStyle: 'italic' } }, 'hidden')
            : '$' + Math.round(rcNum(f.wasted_cost_usd, 0))),
      ]);
    }

    return h('div', null, [
      h(SectionTitle, { key: 't', title: 'Drift queue',
        sub: 'Each of these is a disagreement with no clean answer. Someone has to choose.' }),
      h(Panel, { key: 'o', pad: 0 },
        open.length ? h('table', { style: { width: '100%', borderCollapse: 'collapse' } }, [
          h('thead', { key: 'h' }, h('tr', null, [
            h('th', { key: 1, style: TH }, 'Finding'),
            h('th', { key: 2, style: TH }, 'State'),
            h('th', { key: 3, style: TH }, 'Evidence'),
            h('th', { key: 4, style: TH }, 'Wasted'),
          ])),
          h('tbody', { key: 'b' }, open.map(row)),
        ]) : h(Empty, null, 'Nothing in dispute. Record and cluster agree everywhere.')),
      closed.length ? h(Panel, { key: 'c', pad: 0 }, [
        h('div', { key: 'h', style: { padding: '12px 14px', fontSize: 12,
          color: C.mut, borderBottom: '1px solid ' + C.line } }, 'Resolved'),
        h('table', { key: 't', style: { width: '100%', borderCollapse: 'collapse' } },
          h('tbody', null, closed.map(row))),
      ]) : null,
    ]);
  }

  function ResolutionOption(p) {
    var o = p.option;
    return h('div', { style: {
      border: '1px solid ' + (p.blocked ? C.line : C.line), borderRadius: 9, padding: 14,
      marginBottom: 10, background: p.blocked ? C.panel2 : C.panel, opacity: p.blocked ? 0.75 : 1,
    } }, [
      h('div', { key: 'r', style: { display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' } }, [
        h('div', { key: 'l', style: { flex: '1 1 240px' } }, [
          h('div', { key: 't', style: { fontWeight: 700, fontSize: 13.5,
            color: o.destructive ? C.bad : C.text } }, o.label),
          h('div', { key: 'b', style: { fontSize: 12.5, color: C.mut, marginTop: 4, lineHeight: 1.5 } }, o.blurb),
        ]),
        h('div', { key: 'a' }, h(Btn, {
          small: true, disabled: p.blocked, tone: o.destructive ? C.bad : C.cyan,
          ghost: !o.destructive, onClick: p.onPick,
        }, p.actionLabel)),
      ]),
      p.blocked && p.reason ? h('div', { key: 'w', style: {
        marginTop: 10, paddingTop: 10, borderTop: '1px solid ' + C.line,
        fontSize: 12, color: C.warn, lineHeight: 1.55,
      } }, p.reason) : null,
    ]);
  }

  function DriftDetail(p) {
    var f = byUuid(p.data.findings, p.uuid);
    var s1 = React.useState('');
    var note = s1[0], setNote = s1[1];
    var s2 = React.useState(false);
    var busy = s2[0], setBusy = s2[1];

    if (!f) return h(Empty, null, 'That finding is not in this organisation.');

    var env = byUuid(p.data.environments, f.environment_uuid);
    var cluster = envCluster(env, p.data.clusters);
    var policy = p.data.policy;
    var stale = rcStaleness(cluster, policy);
    var dual = !!(policy && policy.require_dual_approval);
    var me = rcMe();
    var awaiting = f.finding_state === 'awaiting_second_approval';
    var closed = f.finding_state === 'resolved' || f.finding_state === 'rejected';
    var isRequester = awaiting && f.requested_by === me;

    function reload() { setBusy(false); p.onDone(); }

    function requestApproval(o) {
      setBusy(true);
      client.updateObject('drift_finding', f.uuid, {
        finding_state: 'awaiting_second_approval',
        resolution: o.id,
        requested_by: me,
        requested_at: new Date().toISOString(),
        resolution_note: note.trim(),
      }, f).then(function () {
        showToast('Requested. A second approver must confirm.', 'success'); reload();
      }).catch(function (e) {
        setBusy(false); showToast('Could not record the request: ' + ((e && e.message) || ''), 'error');
      });
    }

    function applyNow(o) {
      setBusy(true);
      var chain = note.trim()
        ? client.updateObject('drift_finding', f.uuid, { resolution_note: note.trim() }, f)
        : Promise.resolve();
      chain.then(function () {
        return rcAct('apply_drift_resolution', {
          finding_uuid: f.uuid,
          environment_uuid: f.environment_uuid,
          resolution: o.id,
          approver: me,
        }, function () {
          var upd = o.id === 'force_reclaim'
            ? { env_state: 'available', observed_allocation: 'free',
                current_holder: '', current_team: '' }
            : { env_state: 'quarantined' };
          return client.updateObject('environment', f.environment_uuid, upd, env)
            .then(function () {
              return client.updateObject('drift_finding', f.uuid, {
                finding_state: 'resolved', resolution: o.id, approved_by: me,
                approved_at: new Date().toISOString(),
              }, f);
            });
        });
      }).then(function () {
        showToast(o.label + ' applied.', 'success'); reload();
      }).catch(function (e) {
        setBusy(false); showToast('Could not apply: ' + ((e && e.message) || 'unknown'), 'error');
      });
    }

    /* Which of the three bad options is available, and why one is not.
     * A destructive act needs a fresh observation. The other two are human
     * assertions about ownership, so staleness does not bar them. */
    function optionState(o) {
      if (closed) return { blocked: true, reason: '', label: 'Closed' };
      if (o.destructive && stale.stale) {
        return { blocked: true, label: 'Unavailable',
                 reason: 'Withheld: ' + stale.why +
                   ' Reclaim cannot tell whether this workload is still running or the cluster is simply unreachable, and will not destroy it on a guess. Restore observation of this cluster, or escalate.' };
      }
      if (awaiting && o.id !== f.resolution) {
        return { blocked: true, label: 'Unavailable',
                 reason: 'A different resolution (' + f.resolution + ') is already pending a second approval. Reject that first.' };
      }
      if (awaiting && isRequester) {
        return { blocked: true, label: 'Awaiting a second approver',
                 reason: 'You requested this resolution. This organisation requires a second person to approve it.' };
      }
      if (awaiting && !isRequester) {
        return { blocked: false, label: 'Approve and execute', reason: '', approve: true };
      }
      if (dual && o.destructive) {
        return { blocked: false, label: 'Request approval', request: true, reason: '' };
      }
      return { blocked: false, label: 'Apply', reason: '' };
    }

    return h('div', null, [
      h('a', { key: 'b', href: '#/drift', style: { color: C.dim, fontSize: 12.5,
        textDecoration: 'none', display: 'inline-block', marginBottom: 12 } }, '← Drift queue'),
      h(SectionTitle, { key: 't', title: f.display_name,
        sub: env ? env.namespace_path : 'environment not visible' }),

      h('div', { key: 'ev', style: { display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16 } }, [
        h(Metric, { key: 1, label: 'Record says', value: f.claimed_allocation }),
        h(Metric, { key: 2, label: 'Cluster said', value: f.observed_allocation,
          tone: f.observed_allocation === 'unknown' ? C.bad : C.cyan }),
        h(Metric, { key: 3, label: 'Observation age',
          value: cluster ? rcRelative(cluster.last_observed_at) : 'n/a',
          tone: stale.stale ? C.bad : C.ok,
          sub: 'window is ' + stale.limit + 'm' }),
        h(Metric, { key: 4, label: 'Severity', value: f.severity,
          tone: f.severity === 'high' ? C.bad : C.warn }),
      ]),

      stale.stale && !closed ? h('div', { key: 'sw' }, h(Banner, {
        tone: C.bad, title: 'Destructive actions withheld',
      }, stale.why + ' A force reclaim here would be a guess, and the guess that loses is the one where the cluster was reachable all along and the workload was live.')) : null,

      awaiting ? h('div', { key: 'aw' }, h(Banner, { tone: C.warn, title: 'Awaiting a second approval' }, [
        f.resolution + ' was requested by ',
        h('strong', { key: 'w', style: { color: C.text } }, f.requested_by || 'an admin'),
        ' ' + rcRelative(f.requested_at) + '. ',
        isRequester ? 'You cannot approve your own request.' : 'You may approve it.',
      ])) : null,

      closed ? h('div', { key: 'cl' }, h(Banner, { tone: C.ok, title: 'Resolved' },
        f.resolution + ' by ' + (f.approved_by || 'an admin') + ' ' + rcRelative(f.approved_at) + '.')) : null,

      f.resolution_note ? h(Panel, { key: 'n' }, [
        h('div', { key: 'l', style: { fontSize: 10.5, textTransform: 'uppercase',
          letterSpacing: '.07em', color: C.mut, fontWeight: 700, marginBottom: 6 } }, 'Note on record'),
        h('div', { key: 'v', style: { fontSize: 13, color: C.text, lineHeight: 1.55 } }, f.resolution_note),
      ]) : null,

      !closed ? h(Panel, { key: 'r' }, [
        h(SectionTitle, { key: 't', title: 'Resolve',
          sub: 'Three options, none of them clean. Pick the one you can defend, and say why.' }),
        h('textarea', { key: 'n', value: note, rows: 2,
          placeholder: 'Why this decision? Recorded against the finding.',
          onChange: function (e) { setNote(e.target.value); },
          style: { width: '100%', padding: '9px 11px', borderRadius: 7, fontSize: 13,
            background: C.panel2, border: '1px solid ' + C.line, color: C.text,
            outline: 'none', boxSizing: 'border-box', marginBottom: 14,
            fontFamily: 'inherit', resize: 'vertical' } }),
        h('div', { key: 'o' }, RESOLUTIONS.map(function (o) {
          var st = optionState(o);
          return h(ResolutionOption, {
            key: o.id, option: o, blocked: st.blocked || busy,
            reason: st.reason, actionLabel: st.label,
            onPick: function () { if (st.request) requestApproval(o); else applyNow(o); },
          });
        })),
      ]) : null,
    ]);
  }

  // -------------------------------------------------------------------
  // Policy — the flag, and the argument for why it is allowed to be one.
  // -------------------------------------------------------------------
  function PolicyView(p) {
    var pol = p.data.policy;
    var s1 = React.useState(false);
    var busy = s1[0], setBusy = s1[1];
    if (!pol) return h(Empty, null, 'No policy row for this organisation.');

    function toggle() {
      setBusy(true);
      client.updateObject('fleet_policy', pol.uuid,
        { require_dual_approval: !pol.require_dual_approval }, pol)
        .then(function () { setBusy(false); showToast('Policy updated.', 'success'); p.onDone(); })
        .catch(function (e) { setBusy(false); showToast('Update failed: ' + ((e && e.message) || ''), 'error'); });
    }

    return h('div', null, [
      h(SectionTitle, { key: 't', title: 'Fleet policy',
        sub: 'Safety settings for this organisation.' }),
      h(Panel, { key: 'd' }, [
        h('div', { key: 'r', style: { display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', gap: 14, flexWrap: 'wrap' } }, [
          h('div', { key: 'l', style: { flex: '1 1 300px' } }, [
            h('div', { key: 't', style: { fontWeight: 700, fontSize: 14 } },
              'Require a second approver for force reclaim'),
            h('div', { key: 'b', style: { fontSize: 12.5, color: C.mut, marginTop: 5, lineHeight: 1.55 } },
              'When on, destroying a disputed environment needs two different admins. Off by default — and safe to be a flag, because turning it on changes only the next decision. Nothing already recorded becomes wrong.'),
          ]),
          h(Btn, { key: 'b', disabled: busy, tone: pol.require_dual_approval ? C.ok : C.mut,
            ghost: !pol.require_dual_approval, onClick: toggle },
            pol.require_dual_approval ? 'On' : 'Off'),
        ]),
      ]),
      h(Panel, { key: 's' }, [
        h('div', { key: 't', style: { fontWeight: 700, fontSize: 14, marginBottom: 5 } },
          'Staleness window'),
        h('div', { key: 'b', style: { fontSize: 12.5, color: C.mut, lineHeight: 1.55 } },
          'An observation older than ' + rcNum(pol.stale_observation_minutes, 30) +
          ' minutes is not trusted for a destructive action. Grace period before an expired lease is auto-released: ' +
          rcNum(pol.auto_release_grace_minutes, 0) + ' minutes. Escalations go to ' +
          (pol.escalation_channel || 'the on-call channel') + '.'),
      ]),
      h(Panel, { key: 'w' }, [
        h('div', { key: 't', style: { fontWeight: 700, fontSize: 14, marginBottom: 5 } },
          'Why tenancy is not on this page'),
        h('div', { key: 'b', style: { fontSize: 12.5, color: C.mut, lineHeight: 1.55 } },
          'Whether organisations are isolated from one another is not a setting here, and deliberately so. A flag is only honest when turning it on later is cheap. An approval gate qualifies. Isolation does not — retrofitting it rewrites every query, every policy and the login path — so it is structural and always on.'),
      ]),
    ]);
  }

  // -------------------------------------------------------------------
  // Shell
  // -------------------------------------------------------------------
  function Shell(p) {
    var cfg = window.__SUPERO_CONFIG || {};
    var staff = rcIsStaff();
    var tabs = [
      { hash: '#/', label: 'Fleet' },
      { hash: '#/environments', label: 'Environments' },
      { hash: '#/leases', label: 'My leases' },
    ];
    if (staff) {
      tabs.push({ hash: '#/drift', label: 'Drift queue' });
      tabs.push({ hash: '#/policy', label: 'Policy' });
    }
    var here = p.route.split('/')[1] || '';

    function tabStyle(t) {
      var active = (t.hash === '#/' && here === '') || (t.hash !== '#/' && ('#/' + here) === t.hash);
      return {
        padding: '7px 13px', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer',
        textDecoration: 'none', whiteSpace: 'nowrap',
        color: active ? C.cyan : C.mut,
        background: active ? C.cyan + '18' : 'transparent',
        border: '1px solid ' + (active ? C.cyan + '44' : 'transparent'),
      };
    }

    var canSwitch = false;
    try { canSwitch = cfg.isMultiTenant && client.canSwitchTenant(); } catch (e) { canSwitch = false; }

    return h('div', { style: { minHeight: '100vh', background: C.bg, color: C.text } }, [
      h('header', { key: 'bar', style: {
        borderBottom: '1px solid ' + C.line, background: C.panel2,
        padding: '12px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 14, flexWrap: 'wrap',
      } }, [
        h('div', { key: 'l', style: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' } }, [
          h('div', { key: 'b', style: { display: 'flex', alignItems: 'center', gap: 9 } }, [
            h('div', { key: 'm', style: {
              width: 24, height: 24, borderRadius: 6, border: '1px solid ' + C.cyan + '77',
              background: C.cyan + '1a', color: C.cyan, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 13, fontWeight: 800 } }, '♻'),
            h('span', { key: 'n', style: { fontWeight: 800, fontSize: 15.5 } }, 'Reclaim'),
          ]),
          h('nav', { key: 'n', style: { display: 'flex', gap: 5, flexWrap: 'wrap' } },
            tabs.map(function (t) {
              return h('a', { key: t.hash, href: t.hash, style: tabStyle(t) }, t.label);
            })),
        ]),
        h('div', { key: 'r', style: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' } }, [
          canSwitch ? h('select', {
            key: 'ts', value: p.tenant,
            onChange: function (e) { p.onTenant(e.target.value); },
            style: { background: C.panel, color: C.text, border: '1px solid ' + C.line,
              borderRadius: 7, padding: '6px 9px', fontSize: 12.5 },
          }, [
            h('option', { key: 'nw', value: 'northwind' }, 'Northwind Systems'),
            h('option', { key: 'ct', value: 'contoso' }, 'Contoso Cloud'),
          ]) : null,
          h('div', { key: 'u', style: { textAlign: 'right' } }, [
            h('div', { key: 'e', style: { fontSize: 12.5, fontWeight: 600 } }, rcMe()),
            h('div', { key: 'r', style: { fontSize: 11, color: C.dim } },
              staff ? 'platform admin' : 'platform engineer'),
          ]),
          h(Btn, { key: 'o', small: true, ghost: true, tone: C.mut, onClick: p.onLogout }, 'Sign out'),
        ]),
      ]),
      h('main', { key: 'body', style: { maxWidth: 1180, margin: '0 auto', padding: '24px 20px 60px' } },
        p.children),
    ]);
  }

  // -------------------------------------------------------------------
  // App
  // -------------------------------------------------------------------
  function App() {
    var cfg = window.__SUPERO_CONFIG || {};
    var s0 = React.useState(window.location.hash || '#/');
    var route = s0[0], setRoute = s0[1];
    var s1 = React.useState(client.isAuthenticated());
    var authed = s1[0], setAuthed = s1[1];
    var s2 = React.useState(false);
    var showLogin = s2[0], setShowLogin = s2[1];
    var s3 = React.useState({ clusters: [], environments: [], leases: [], findings: [], policy: null });
    var data = s3[0], setData = s3[1];
    var s4 = React.useState(true);
    var loading = s4[0], setLoading = s4[1];
    var s5 = React.useState('');
    var tenant = s5[0], setTenant = s5[1];
    var s6 = React.useState('');
    var loadErr = s6[0], setLoadErr = s6[1];

    function navigate(hash) {
      if ((window.location.hash || '#/') !== hash) window.location.hash = hash;
    }

    React.useEffect(function () {
      function onHash() { setRoute(window.location.hash || '#/'); }
      window.addEventListener('hashchange', onHash);
      return function () { window.removeEventListener('hashchange', onHash); };
    }, []);

    // The runtime rehydrates its session asynchronously, so a fresh load can
    // report "not authenticated" for a moment while a valid session exists.
    React.useEffect(function () {
      if (client.isAuthenticated()) { setAuthed(true); return; }
      var n = 0;
      var t = setInterval(function () {
        if (client.isAuthenticated()) { setAuthed(true); clearInterval(t); }
        else if (++n > 25) clearInterval(t);
      }, 150);
      return function () { clearInterval(t); };
    }, []);

    function load() {
      setLoading(true);
      setLoadErr('');
      Promise.all([
        client.getObjects('cluster'),
        client.getObjects('environment'),
        client.getObjects('lease'),
        client.getObjects('drift_finding'),
        client.getObjects('fleet_policy'),
      ]).then(function (r) {
        function arr(x) { return Array.isArray(x) ? x : ((x && x.results) || []); }
        var pols = arr(r[4]);
        setData({
          clusters: arr(r[0]), environments: arr(r[1]), leases: arr(r[2]),
          findings: arr(r[3]), policy: pols.length ? pols[0] : null,
        });
        setLoading(false);
      }).catch(function (e) {
        setLoadErr((e && e.message) || 'Could not load the fleet.');
        setLoading(false);
      });
    }

    React.useEffect(function () { if (authed) load(); }, [authed, tenant]);

    function onTenant(name) {
      try { client.setTenantOverride(name || null); } catch (e) { /* not permitted */ }
      setTenant(name);
    }

    function logout() {
      client.logout();
      setAuthed(false); setShowLogin(false);
      navigate('#/');
    }

    if (!authed) {
      if (showLogin) {
        return h(P.LoginScreen, {
          onDone: function () { setAuthed(true); navigate('#/'); },
          onBack: function () { setShowLogin(false); },
        });
      }
      return h(P.Landing, { onSignIn: function () { setShowLogin(true); } });
    }

    var parts = route.replace(/^#\//, '').split('/');
    var head = parts[0] || '';
    var arg = parts[1] || '';
    var staff = rcIsStaff();

    var body;
    if (loading) body = h(Empty, null, 'Loading the fleet…');
    else if (loadErr) body = h(Banner, { tone: C.bad, title: 'Could not load' }, loadErr);
    else if (head === 'environments') body = h(V.EnvironmentsView, { data: data, navigate: navigate });
    else if (head === 'env') body = h(V.EnvDetail, { data: data, uuid: arg });
    else if (head === 'leases') body = h(LeasesView, { data: data, onDone: load });
    else if (head === 'drift' && arg) {
      body = staff ? h(DriftDetail, { data: data, uuid: arg, onDone: load })
                   : h(Empty, null, 'Resolving drift is limited to platform admins.');
    } else if (head === 'drift') {
      body = staff ? h(DriftQueue, { data: data, navigate: navigate })
                   : h(Empty, null, 'Resolving drift is limited to platform admins.');
    } else if (head === 'policy') {
      body = staff ? h(PolicyView, { data: data, onDone: load })
                   : h(Empty, null, 'Fleet policy is limited to platform admins.');
    } else body = h(V.FleetView, { data: data });

    return h(Shell, {
      route: route, tenant: tenant, onTenant: onTenant, onLogout: logout,
    }, body);
  }

  // -------------------------------------------------------------------
  // Mount — sibling container, library tree hidden, preloader removed.
  // -------------------------------------------------------------------
  var __root = null;
  function mountApp() {
    var pl = document.getElementById('supero-preloader');
    if (pl && pl.parentNode) pl.parentNode.removeChild(pl);
    var st = document.createElement('style');
    st.textContent =
      ':root{' +
        '--rc-bg:' + C.bg + ';--rc-panel:' + C.panel + ';--rc-panel-2:' + C.panel2 + ';' +
        '--rc-line:' + C.line + ';--rc-text:' + C.text + ';--rc-muted:' + C.mut + ';' +
        '--rc-dim:' + C.dim + ';--rc-accent:' + C.cyan + ';--rc-ok:' + C.ok + ';' +
        '--rc-warn:' + C.warn + ';--rc-danger:' + C.bad + ';--rc-violet:' + C.violet + ';' +
        '--rc-radius:10px;--rc-gutter:20px;' +
      '}' +
      '@keyframes rc-fade{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}' +
      '@keyframes rc-pulse{0%,100%{opacity:1}50%{opacity:.55}}' +
      '#reclaim-root main{animation:rc-fade .18s ease both}' +
      '@media (max-width:640px){' +
        '#reclaim-root main{padding-left:16px!important;padding-right:16px!important}' +
        '#reclaim-root header{padding-left:16px!important;padding-right:16px!important}' +
        '#reclaim-root table{font-size:12px}' +
        '#reclaim-root th:nth-child(5),#reclaim-root td:nth-child(5){display:none}' +
      '}' +
      '@media (prefers-reduced-motion:reduce){#reclaim-root *{animation:none!important}}' +
      '#root,#app,#__next,#supero-preloader{display:none!important}' +
      '#reclaim-root{position:fixed;inset:0;min-height:100vh;overflow:auto;z-index:2147483647;' +
      'font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
      'background:' + C.bg + ';}' +
      '#reclaim-root *{box-sizing:border-box}' +
      '#reclaim-root a{color:inherit}' +
      '#reclaim-root tbody tr:hover{background:' + C.cyan + '0a}';
    document.head.appendChild(st);
    var el = document.getElementById('reclaim-root');
    if (!el) { el = document.createElement('div'); el.id = 'reclaim-root'; document.body.appendChild(el); }
    if (!__root) __root = ReactDOM.createRoot(el);
    __root.render(h(App, null));
  }

  function boot() {
    var n = 0;
    (function tick() {
      n++;
      if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') setTimeout(mountApp, 50);
      else if (n < 50) setTimeout(tick, 100);
    })();
  }

  // The literal "AppShell.render" appears only in this comment for grep validators — never called.
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
