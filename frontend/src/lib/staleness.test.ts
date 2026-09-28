import { describe, expect, it } from 'vitest';
import { minutesSince, relative, staleness } from './staleness';
import type { Cluster, FleetPolicy } from './domain';

const NOW = Date.parse('2026-09-28T12:00:00Z');
const at = (iso: string): Cluster => ({ uuid: 'c', display_name: 'nw-edge-2', last_observed_at: iso });
const policy = (mins: number): FleetPolicy => ({ uuid: 'p', stale_observation_minutes: mins });

describe('minutesSince', () => {
  it('returns null for a missing or unparseable timestamp', () => {
    expect(minutesSince(undefined, NOW)).toBeNull();
    expect(minutesSince('not-a-date', NOW)).toBeNull();
  });
  it('never returns a negative age for a future timestamp', () => {
    expect(minutesSince('2026-09-28T13:00:00Z', NOW)).toBe(0);
  });
});

describe('relative', () => {
  it('describes minutes, hours and days', () => {
    expect(relative('2026-09-28T11:58:00Z', NOW)).toBe('2m ago');
    expect(relative('2026-09-28T06:00:00Z', NOW)).toBe('6h ago');
    expect(relative('2026-09-26T12:00:00Z', NOW)).toBe('2d ago');
    expect(relative(undefined, NOW)).toBe('never');
  });
});

describe('staleness', () => {
  it('is fresh inside the window', () => {
    const s = staleness(at('2026-09-28T11:58:00Z'), policy(30), NOW);
    expect(s.stale).toBe(false);
    expect(s.age).toBe(2);
    expect(s.why).toBe('');
  });

  it('is stale beyond the window, and says why', () => {
    const s = staleness(at('2026-09-28T06:00:00Z'), policy(30), NOW);
    expect(s.stale).toBe(true);
    expect(s.age).toBe(360);
    expect(s.why).toContain('nw-edge-2');
    expect(s.why).toContain('30-minute window');
  });

  it('treats a never-observed cluster as stale, not as fresh', () => {
    const s = staleness({ uuid: 'c' }, policy(30), NOW);
    expect(s.stale).toBe(true);
    expect(s.age).toBeNull();
    expect(s.why).toContain('never been successfully observed');
  });

  it('treats a missing cluster as stale', () => {
    expect(staleness(null, policy(30), NOW).stale).toBe(true);
  });

  it('respects a per-organisation window: the same reading differs by policy', () => {
    const reading = at('2026-09-28T11:35:00Z'); // 25 minutes old
    expect(staleness(reading, policy(30), NOW).stale).toBe(false);
    expect(staleness(reading, policy(20), NOW).stale).toBe(true);
  });

  it('falls back to a safe default when no policy row exists', () => {
    expect(staleness(at('2026-09-28T11:00:00Z'), null, NOW).stale).toBe(true);
    expect(staleness(at('2026-09-28T11:45:00Z'), null, NOW).stale).toBe(false);
  });
});
