<script lang="ts">
  import type { Fleet, ResolutionOption } from '../lib/domain';
  import { RESOLUTIONS } from '../lib/domain';
  import { byUuid, envCluster, update } from '../lib/api';
  import { staleness, relative } from '../lib/staleness';
  import { act } from '../lib/act';
  import { me, toast } from '../lib/rbac';
  import { C } from '../lib/format';
  import Panel from '../ui/Panel.svelte';
  import Metric from '../ui/Metric.svelte';
  import Banner from '../ui/Banner.svelte';
  import Empty from '../ui/Empty.svelte';
  import Btn from '../ui/Btn.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  let { fleet, uuid, reload }: { fleet: Fleet; uuid: string; reload: () => void } = $props();

  let note = $state('');
  let busy = $state(false);

  const f = $derived(byUuid(fleet.findings, uuid));
  const env = $derived(f ? byUuid(fleet.environments, f.environment_uuid ?? '') : null);
  const cluster = $derived(envCluster(env, fleet.clusters));
  const stale = $derived(staleness(cluster, fleet.policy));
  const dual = $derived(Boolean(fleet.policy?.require_dual_approval));
  const awaiting = $derived(f?.finding_state === 'awaiting_second_approval');
  const closed = $derived(f?.finding_state === 'resolved' || f?.finding_state === 'rejected');
  const isRequester = $derived(Boolean(awaiting && f?.requested_by === me()));

  interface OptionState { blocked: boolean; label: string; reason: string; request?: boolean }

  /* Which of the three bad options is available, and why one is not.
   * A destructive act needs a FRESH observation. The other two are human
   * assertions about ownership, so staleness does not bar them. */
  function optionState(o: ResolutionOption): OptionState {
    if (closed) return { blocked: true, label: 'Closed', reason: '' };

    if (o.destructive && stale.stale) {
      return {
        blocked: true,
        label: 'Unavailable',
        reason: `Withheld: ${stale.why} Reclaim cannot tell whether this workload is still running or the `
              + 'cluster is simply unreachable, and will not destroy it on a guess. Restore observation of '
              + 'this cluster, or escalate.',
      };
    }
    if (awaiting && o.id !== f?.resolution) {
      return {
        blocked: true,
        label: 'Unavailable',
        reason: `A different resolution (${f?.resolution}) is already pending a second approval. Reject that first.`,
      };
    }
    if (awaiting && isRequester) {
      return {
        blocked: true,
        label: 'Awaiting a second approver',
        reason: 'You requested this resolution. This organisation requires a second person to approve it.',
      };
    }
    if (awaiting) return { blocked: false, label: 'Approve and execute', reason: '' };
    if (dual && o.destructive) return { blocked: false, label: 'Request approval', reason: '', request: true };
    return { blocked: false, label: 'Apply', reason: '' };
  }

  async function requestApproval(o: ResolutionOption) {
    if (!f) return;
    busy = true;
    try {
      await update('drift_finding', f.uuid, {
        finding_state: 'awaiting_second_approval',
        resolution: o.id,
        requested_by: me(),
        requested_at: new Date().toISOString(),
        resolution_note: note.trim(),
      }, f);
      toast('Requested. A second approver must confirm.', 'success');
      reload();
    } catch (e) {
      toast('Could not record the request: ' + (e instanceof Error ? e.message : ''), 'error');
    } finally {
      busy = false;
    }
  }

  async function applyNow(o: ResolutionOption) {
    if (!f) return;
    busy = true;
    try {
      if (note.trim()) await update('drift_finding', f.uuid, { resolution_note: note.trim() }, f);
      await act('apply_drift_resolution', {
        finding_uuid: f.uuid,
        environment_uuid: f.environment_uuid,
        resolution: o.id,
        approver: me(),
      }, async () => {
        const envPatch = o.id === 'force_reclaim'
          ? { env_state: 'available', observed_allocation: 'free', current_holder: '', current_team: '' }
          : { env_state: 'quarantined' };
        if (f.environment_uuid) await update('environment', f.environment_uuid, envPatch, env ?? undefined);
        await update('drift_finding', f.uuid, {
          finding_state: 'resolved',
          resolution: o.id,
          approved_by: me(),
          approved_at: new Date().toISOString(),
        }, f);
      });
      toast(o.label + ' applied.', 'success');
      reload();
    } catch (e) {
      toast('Could not apply: ' + (e instanceof Error ? e.message : 'unknown'), 'error');
    } finally {
      busy = false;
    }
  }
</script>

{#if !f}
  <Empty>That finding is not in this organisation.</Empty>
{:else}
  <a href="#/drift" class="mb-3 inline-block text-[12.5px] text-rc-dim">&larr; Drift queue</a>
  <SectionTitle title={f.display_name ?? ''} sub={env?.namespace_path ?? 'environment not visible'} />

  <div class="mb-4 flex flex-wrap gap-3.5">
    <Metric label="Record says" value={f.claimed_allocation ?? '—'} />
    <Metric label="Cluster said" value={f.observed_allocation ?? '—'}
            tone={f.observed_allocation === 'unknown' ? C.bad : C.cyan} />
    <Metric label="Observation age" value={cluster ? relative(cluster.last_observed_at) : 'n/a'}
            tone={stale.stale ? C.bad : C.ok} sub="window is {stale.limit}m" />
    <Metric label="Severity" value={f.severity ?? '—'} tone={f.severity === 'high' ? C.bad : C.warn} />
  </div>

  {#if stale.stale && !closed}
    <Banner tone={C.bad} title="Destructive actions withheld">
      {stale.why} A force reclaim here would be a guess, and the guess that loses is the one where the
      cluster was reachable all along and the workload was live.
    </Banner>
  {/if}

  {#if awaiting}
    <Banner tone={C.warn} title="Awaiting a second approval">
      {f.resolution} was requested by <strong class="text-rc-text">{f.requested_by || 'an admin'}</strong>
      {relative(f.requested_at)}.
      {isRequester ? 'You cannot approve your own request.' : 'You may approve it.'}
    </Banner>
  {/if}

  {#if closed}
    <Banner tone={C.ok} title="Resolved">
      {f.resolution} by {f.approved_by || 'an admin'} {relative(f.approved_at)}.
    </Banner>
  {/if}

  {#if f.resolution_note}
    <Panel>
      <div class="mb-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted">Note on record</div>
      <div class="text-[13px] leading-relaxed text-rc-text">{f.resolution_note}</div>
    </Panel>
  {/if}

  {#if !closed}
    <Panel>
      <SectionTitle title="Resolve"
                    sub="Three options, none of them clean. Pick the one you can defend, and say why." />
      <textarea bind:value={note} rows="2"
                placeholder="Why this decision? Recorded against the finding."
                class="mb-3.5 w-full resize-y rounded-[7px] border border-rc-line bg-rc-panel2 px-[11px] py-2.5 text-[13px] text-rc-text outline-none"
      ></textarea>

      {#each RESOLUTIONS as o (o.id)}
        {@const st = optionState(o)}
        <div class="mb-2.5 rounded-[9px] border border-rc-line p-3.5"
             style="background:{st.blocked ? C.panel2 : C.panel};opacity:{st.blocked ? 0.75 : 1}">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex-[1_1_240px]">
              <div class="text-[13.5px] font-bold" style="color:{o.destructive ? C.bad : C.text}">{o.label}</div>
              <div class="mt-1 text-[12.5px] leading-relaxed text-rc-muted">{o.blurb}</div>
            </div>
            <Btn small disabled={st.blocked || busy} tone={o.destructive ? C.bad : C.cyan} ghost={!o.destructive}
                 onclick={() => (st.request ? requestApproval(o) : applyNow(o))}>{st.label}</Btn>
          </div>
          {#if st.blocked && st.reason}
            <div class="mt-2.5 border-t border-rc-line pt-2.5 text-xs leading-relaxed" style="color:{C.warn}">
              {st.reason}
            </div>
          {/if}
        </div>
      {/each}
    </Panel>
  {/if}
{/if}
