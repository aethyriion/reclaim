/* Typed wrappers over the locked `client` global.
 *
 * Nothing here reimplements auth, CRUD or tenant routing — it narrows the
 * untyped surface and normalises the two response shapes getObjects can return.
 */
import type { SuperoRecord } from '../supero.d';
import type { Cluster, DriftFinding, Environment, Fleet, FleetPolicy, Lease } from './domain';

function rows<T extends SuperoRecord>(r: T[] | { results: T[] } | null | undefined): T[] {
  if (Array.isArray(r)) return r;
  if (r && Array.isArray((r as { results?: T[] }).results)) return (r as { results: T[] }).results;
  return [];
}

async function list<T extends SuperoRecord>(schema: string): Promise<T[]> {
  return rows((await client.getObjects(schema)) as T[] | { results: T[] });
}

/** Login. The 5th argument is '' so the SERVER resolves the user's own tenant
 * from their email. Passing cfg.tenant sends the literal 'default-tenant' on a
 * cloud deploy and 401s every user who lives in a named tenant. */
export async function login(email: string, password: string): Promise<void> {
  const cfg = window.__SUPERO_CONFIG;
  if (!cfg) throw new Error('Supero config is not available.');
  await client.login(cfg.domain, email.trim(), password, cfg.project, '');
}

export async function loadFleet(): Promise<Fleet> {
  const [clusters, environments, leases, findings, policies] = await Promise.all([
    list<Cluster>('cluster'),
    list<Environment>('environment'),
    list<Lease>('lease'),
    list<DriftFinding>('drift_finding'),
    list<FleetPolicy>('fleet_policy'),
  ]);
  return {
    clusters, environments, leases, findings,
    policy: policies[0] ?? null,
    policies,
  };
}

/** The organisations a super-admin may switch between.
 *
 * Read at runtime, never hard-coded. An earlier version listed the two seeded
 * organisations as literal <option>s, which meant a third tenant existed on the
 * platform and in the data but was invisible in the UI - the exact failure a
 * second (or third) tenant is supposed to catch.
 *
 * `default-tenant` is excluded: it holds the super-admin and no fleet data. */
export async function loadTenants(): Promise<Array<{ name: string; label: string }>> {
  const declared = (window.__SUPERO_CONFIG as unknown as { tenants?: unknown })?.tenants;
  if (Array.isArray(declared) && declared.length) {
    return declared
      .map((t) => (typeof t === 'string'
        ? { name: t, label: t }
        : { name: String((t as { name?: string }).name ?? ''),
            label: String((t as { display_name?: string; name?: string }).display_name
                       ?? (t as { name?: string }).name ?? '') }))
      .filter((t) => t.name && t.name !== 'default-tenant');
  }
  try {
    const rows = await list<SuperoRecord>('tenant');
    return rows
      .map((t) => ({ name: String(t.name ?? ''), label: String(t.display_name ?? t.name ?? '') }))
      .filter((t) => t.name && t.name !== 'default-tenant');
  } catch {
    return [];
  }
}

/** The tenant a record belongs to, read from its fq_name:
 * [domain, project, tenant, name]. */
export function tenantOf(r: SuperoRecord): string {
  const fq = r.fq_name;
  return Array.isArray(fq) && fq.length > 2 ? String(fq[2]) : '';
}

/* Narrow a loaded fleet to one organisation, CLIENT-SIDE.
 *
 * This is a view filter, not a security boundary, and the distinction matters.
 * A tenant-scoped user (tenant_admin / tenant_user inside a named tenant) never
 * needs this: the server already returns only their organisation's rows, which
 * is what the boundary probe verifies. A super-admin in default-tenant is not
 * tenant-scoped and legitimately receives every organisation's rows.
 *
 * `client.setTenantOverride()` is documented as scoping those reads by setting an
 * X-Tenant header, but the API ignores that header on reads (and on creates), so
 * the override changes nothing. Rather than ship a control that looks like it
 * filters and does not, the super-admin's picker filters what was already
 * fetched, and is labelled as a view. */
export function scopeToTenant(fleet: Fleet, tenant: string): Fleet {
  if (!tenant) return fleet;
  const keep = <T extends SuperoRecord>(xs: T[]) => xs.filter((x) => tenantOf(x) === tenant);
  return {
    clusters: keep(fleet.clusters),
    environments: keep(fleet.environments),
    leases: keep(fleet.leases),
    findings: keep(fleet.findings),
    policy: fleet.policies.find((p) => tenantOf(p) === tenant) ?? null,
    policies: fleet.policies,
  };
}

export function byUuid<T extends SuperoRecord>(items: T[], uuid: string): T | null {
  return items.find((i) => i.uuid === uuid) ?? null;
}

/** Resolve an environment's cluster via its reference array.
 *
 * The platform returns the array as `cluster_refs` (lower snake_case of the
 * reference name), NOT `Cluster_refs` as the schema declares it. Check both:
 * relying on one casing silently falls through to the name-prefix fallback,
 * which only works while the seed happens to prefix environments with their
 * cluster name. */
export function envCluster(env: Environment | null, clusters: Cluster[]): Cluster | null {
  if (!env) return null;
  const refs = env.Cluster_refs ?? env.cluster_refs;
  const ref = refs?.[0];
  const refUuid = ref?.uuid ?? ref?.to_uuid;
  if (refUuid) {
    const hit = byUuid(clusters, refUuid);
    if (hit) return hit;
  }
  return clusters.find((c) => c.name && (env.name ?? '').startsWith(c.name)) ?? null;
}

export const update = (schema: string, uuid: string, data: Record<string, unknown>, item?: SuperoRecord) =>
  client.updateObject(schema, uuid, data, item);

export const createWithRefs = (
  schema: string,
  data: Record<string, unknown>,
  refs: Array<{ ref_name: string; ref_uuid: string }>,
) => client.createObjectWithRefs(schema, data, refs);
