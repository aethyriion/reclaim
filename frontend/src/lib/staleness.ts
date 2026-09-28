/* THE GUARD.
 *
 * A force reclaim destroys a running workload on the strength of one reading of
 * the cluster. If that reading is older than the organisation's staleness
 * window, we cannot distinguish "the workload is still there" from "we simply
 * have not been able to look" — so the destructive option is withdrawn and the
 * UI states why, rather than silently disabling a button.
 *
 * Pure on purpose: it takes `now` as an argument so it is testable without
 * faking the clock, and so a rendered verdict can never drift from the one an
 * action is checked against.
 */
import type { Cluster, FleetPolicy } from './domain';

export const DEFAULT_STALE_MINUTES = 30;

export interface Staleness {
  stale: boolean;
  /** Age of the last successful observation, in minutes. null = never observed. */
  age: number | null;
  /** The organisation's window, in minutes. */
  limit: number;
  /** Empty when fresh. Shown verbatim to the operator when stale. */
  why: string;
}

export function minutesSince(iso: string | undefined | null, now: number = Date.now()): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.round((now - t) / 60_000));
}

export function relative(iso: string | undefined | null, now: number = Date.now()): string {
  const m = minutesSince(iso, now);
  if (m === null) return 'never';
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const hours = Math.floor(m / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function staleness(
  cluster: Cluster | null | undefined,
  policy: FleetPolicy | null | undefined,
  now: number = Date.now(),
): Staleness {
  const limit = Number(policy?.stale_observation_minutes) || DEFAULT_STALE_MINUTES;
  const age = cluster ? minutesSince(cluster.last_observed_at, now) : null;

  if (age === null) {
    return {
      stale: true,
      age: null,
      limit,
      why: 'This cluster has never been successfully observed.',
    };
  }
  if (age > limit) {
    const label = cluster?.display_name || cluster?.name || 'this cluster';
    return {
      stale: true,
      age,
      limit,
      why: `The last successful observation of ${label} was ${relative(cluster?.last_observed_at, now)}, `
         + `beyond this organisation’s ${limit}-minute window.`,
    };
  }
  return { stale: false, age, limit, why: '' };
}
