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
  return { clusters, environments, leases, findings, policy: policies[0] ?? null };
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
