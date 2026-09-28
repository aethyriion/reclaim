/* Reclaim's entity types.
 *
 * These mirror schemas.py exactly. The enum unions are the `values` arrays from
 * the schema dicts — the server rejects anything outside them on write, so a
 * mismatch here is a runtime 422 rather than a type error, and keeping them in
 * sync is the point of writing them out.
 */
import type { SuperoRecord } from '../supero.d';

export type Provider = 'gcp' | 'aws';
export type ClusterState = 'healthy' | 'degraded' | 'unreachable';
export type EnvKind = 'preview' | 'persistent';
export type EnvState = 'available' | 'claimed' | 'expiring' | 'releasing' | 'disputed' | 'quarantined';
export type Allocation = 'free' | 'allocated' | 'unknown';
export type LeaseState = 'active' | 'expiring' | 'released' | 'release_failed' | 'force_reclaimed';
export type Severity = 'low' | 'medium' | 'high';
export type FindingState = 'open' | 'awaiting_second_approval' | 'resolved' | 'rejected';
export type Resolution = 'unresolved' | 'force_reclaim' | 'mark_external' | 'escalate';

export const ENV_STATES: EnvState[] = [
  'available', 'claimed', 'expiring', 'releasing', 'disputed', 'quarantined',
];

export interface Cluster extends SuperoRecord {
  provider?: Provider;
  region?: string;
  capacity?: number;
  cluster_state?: ClusterState;
  /** When we last successfully observed this cluster. The whole app hinges on it. */
  last_observed_at?: string;
  observation_note?: string;
}

export interface Environment extends SuperoRecord {
  env_kind?: EnvKind;
  /** What Reclaim believes. */
  env_state?: EnvState;
  /** What the cluster last reported. Deliberately separate from env_state. */
  observed_allocation?: Allocation;
  namespace_path?: string;
  current_holder?: string;
  current_team?: string;
  monthly_cost_usd?: number;
  Cluster_refs?: Array<{ uuid?: string; to_uuid?: string }>;
}

export interface Lease extends SuperoRecord {
  environment_uuid?: string;
  team?: string;
  requested_by?: string;
  owner_username?: string;
  purpose?: string;
  claimed_at?: string;
  expires_at?: string;
  lease_state?: LeaseState;
  release_attempts?: number;
  last_release_error?: string;
}

export interface DriftFinding extends SuperoRecord {
  environment_uuid?: string;
  lease_uuid?: string;
  claimed_allocation?: Allocation;
  observed_allocation?: Allocation;
  detected_at?: string;
  observation_age_minutes?: number;
  severity?: Severity;
  finding_state?: FindingState;
  resolution?: Resolution;
  requested_by?: string;
  requested_at?: string;
  approved_by?: string;
  approved_at?: string;
  resolution_note?: string;
  /** Admin-only: stripped for engineers by a server-side hidden_fields rule. */
  wasted_cost_usd?: number;
}

export interface FleetPolicy extends SuperoRecord {
  require_dual_approval?: boolean;
  stale_observation_minutes?: number;
  auto_release_grace_minutes?: number;
  escalation_channel?: string;
}

export interface Fleet {
  clusters: Cluster[];
  environments: Environment[];
  leases: Lease[];
  findings: DriftFinding[];
  policy: FleetPolicy | null;
}

export const EMPTY_FLEET: Fleet = {
  clusters: [], environments: [], leases: [], findings: [], policy: null,
};

export interface ResolutionOption {
  id: Exclude<Resolution, 'unresolved'>;
  label: string;
  blurb: string;
  destructive: boolean;
}

export const RESOLUTIONS: ResolutionOption[] = [
  {
    id: 'force_reclaim',
    label: 'Force reclaim',
    blurb: 'Destroy whatever is running and return the slot to the pool.',
    destructive: true,
  },
  {
    id: 'mark_external',
    label: 'Mark external',
    blurb: 'This workload is legitimately managed elsewhere. Stop alerting; record who vouched for it.',
    destructive: false,
  },
  {
    id: 'escalate',
    label: 'Escalate',
    blurb: 'Ownership is unclear. Page the owning team and leave the finding open.',
    destructive: false,
  },
];
