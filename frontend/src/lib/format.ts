/* Display helpers. Separate from staleness.ts because these are cosmetic and
 * that one is a safety control. */
import type { EnvState, Allocation, ClusterState, LeaseState, FindingState } from './domain';

export const C = {
  bg: '#0B0E14', panel: '#111725', panel2: '#0E1420', line: '#1E2939',
  text: '#E6EDF7', mut: '#8A9BB4', dim: '#5C6B82',
  cyan: '#38BDF8', ok: '#34D399', warn: '#F59E0B', bad: '#F43F5E', violet: '#A78BFA',
} as const;

export function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isNaN(n) ? fallback : n;
}

/** Time remaining, or how long something is overdue. */
export function until(iso: string | undefined | null, now: number = Date.now()): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - now;
  if (Number.isNaN(ms)) return '—';
  const mins = Math.abs(Math.round(ms / 60_000));
  const s = mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.floor(mins / 60)}h` : `${Math.floor(mins / 1440)}d`;
  return ms < 0 ? `${s} overdue` : `in ${s}`;
}

export function stamp(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : `${d.toISOString().slice(0, 16).replace('T', ' ')}Z`;
}

const ENV_TONE: Record<EnvState, string> = {
  available: C.ok, claimed: C.cyan, expiring: C.warn,
  releasing: C.violet, disputed: C.bad, quarantined: C.warn,
};
const ALLOC_TONE: Record<Allocation, string> = { free: C.ok, allocated: C.cyan, unknown: C.bad };
const CLUSTER_TONE: Record<ClusterState, string> = { healthy: C.ok, degraded: C.warn, unreachable: C.bad };
const LEASE_TONE: Record<LeaseState, string> = {
  active: C.ok, expiring: C.warn, released: C.mut, release_failed: C.bad, force_reclaimed: C.violet,
};
const FINDING_TONE: Record<FindingState, string> = {
  open: C.bad, awaiting_second_approval: C.warn, resolved: C.ok, rejected: C.mut,
};

export const envTone = (v?: string) => ENV_TONE[v as EnvState] ?? C.mut;
export const allocTone = (v?: string) => ALLOC_TONE[v as Allocation] ?? C.mut;
export const clusterTone = (v?: string) => CLUSTER_TONE[v as ClusterState] ?? C.mut;
export const leaseTone = (v?: string) => LEASE_TONE[v as LeaseState] ?? C.mut;
export const findingTone = (v?: string) => FINDING_TONE[v as FindingState] ?? C.mut;
