/* Capability gates. Advisory only — the server enforces RBAC on every call.
 * These decide which controls render, never what is permitted. */

function cfg() {
  return window.__SUPERO_CONFIG;
}

/** Namespace-tolerant: policy keys are namespaced, so try the bare name then
 * `<namespace>:<name>`. Harmless everywhere, and required when two apps in one
 * project share a bare entity name. */
export function canWrite(schema: string): boolean {
  try {
    if (client.canWrite(schema)) return true;
    const ns = cfg()?.appNamespace;
    return ns ? Boolean(client.canWrite(`${ns}:${schema}`)) : false;
  } catch {
    return false;
  }
}

/* Probe an ADMIN-ONLY capability.
 *
 * NOT drift_finding: engineers hold can_create on it so they may REPORT drift,
 * and canWrite() is create||update — gating on it promotes every engineer into
 * the admin console. fleet_policy is read-only for engineers and writable for
 * admins, so it is the honest probe. This exact bug shipped once already. */
export function isStaff(): boolean {
  try {
    if (client.isAdmin()) return true;
    if (canWrite('fleet_policy')) return true;
    const role = client.userInfo?.role ?? '';
    return ['tenant_admin', 'domain_admin', 'platform_admin', 'developer'].includes(role);
  } catch {
    return false;
  }
}

export function me(): string {
  const u = client.userInfo ?? {};
  return u.email ?? u.fullName ?? '';
}

export function canSwitchTenant(): boolean {
  try {
    return Boolean(cfg()?.isMultiTenant && client.canSwitchTenant());
  } catch {
    return false;
  }
}

export function toast(msg: string, kind: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
  try {
    window.showToast?.(msg, kind);
  } catch {
    /* the runtime helper is optional; never let a toast break a flow */
  }
}
