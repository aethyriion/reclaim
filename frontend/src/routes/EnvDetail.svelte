<script lang="ts">
  import type { Fleet } from '../lib/domain';
  import { byUuid, envCluster } from '../lib/api';
  import { staleness, relative } from '../lib/staleness';
  import { envTone, allocTone, leaseTone, findingTone, until, C } from '../lib/format';
  import { isStaff } from '../lib/rbac';
  import Pill from '../ui/Pill.svelte';
  import Panel from '../ui/Panel.svelte';
  import Banner from '../ui/Banner.svelte';
  import Empty from '../ui/Empty.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  let { fleet, uuid }: { fleet: Fleet; uuid: string } = $props();

  const env = $derived(byUuid(fleet.environments, uuid));
  const cluster = $derived(envCluster(env, fleet.clusters));
  const stale = $derived(staleness(cluster, fleet.policy));
  const leases = $derived(fleet.leases.filter((l) => l.environment_uuid === uuid));
  const findings = $derived(fleet.findings.filter((f) => f.environment_uuid === uuid));

  /* "Agree" is deliberately narrow: disputed and unknown never agree. */
  const agree = $derived(
    !!env && env.observed_allocation !== 'unknown' && (
      (env.env_state === 'available' && env.observed_allocation === 'free') ||
      (env.env_state !== 'available' && env.env_state !== 'disputed' && env.observed_allocation === 'allocated')));

  const TH = 'px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line';
  const TD = 'px-3 py-2.5 text-[13px] align-middle border-b border-rc-line';
</script>

{#if !env}
  <Empty>That environment is not in this organisation.</Empty>
{:else}
  <a href="#/environments" class="mb-3 inline-block text-[12.5px] text-rc-dim">&larr; Environments</a>
  <SectionTitle title={env.display_name || env.name || ''} sub={env.namespace_path ?? ''} />

  <div class="mb-4 flex flex-wrap gap-3.5">
    <div class="flex-[1_1_220px] rounded-[10px] border border-rc-line bg-rc-panel p-4">
      <div class="mb-2 text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted">Reclaim believes</div>
      <Pill tone={envTone(env.env_state)}>{env.env_state}</Pill>
    </div>
    <div class="flex-[1_1_220px] rounded-[10px] border border-rc-line bg-rc-panel p-4">
      <div class="mb-2 text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted">Cluster last reported</div>
      <Pill tone={allocTone(env.observed_allocation)}>{env.observed_allocation}</Pill>
      <div class="mt-2 text-[11.5px]" style="color:{stale.stale ? C.bad : C.dim}">
        {cluster ? relative(cluster.last_observed_at) : 'no cluster linked'}
      </div>
    </div>
  </div>

  {#if !agree}
    <Banner tone={C.bad} title="These do not agree">
      Reclaim believes this environment is {env.env_state}, while its cluster last reported it
      {env.observed_allocation}. Until that is resolved the slot is neither safely reusable nor
      safely destroyable.
    </Banner>
  {/if}

  <Panel>
    <SectionTitle title="Lease history" />
    {#if leases.length}
      <table class="w-full border-collapse">
        <thead><tr>
          <th class={TH}>Holder</th><th class={TH}>Team</th><th class={TH}>Expires</th><th class={TH}>State</th>
        </tr></thead>
        <tbody>
          {#each leases as l (l.uuid)}
            <tr>
              <td class="{TD} text-[12.5px]">{l.requested_by}</td>
              <td class="{TD} text-[12.5px] text-rc-muted">{l.team}</td>
              <td class="{TD} text-[12.5px] text-rc-muted">{until(l.expires_at)}</td>
              <td class={TD}><Pill tone={leaseTone(l.lease_state)}>{l.lease_state}</Pill></td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <Empty>Never leased.</Empty>
    {/if}

    {#each leases.filter((l) => l.last_release_error) as l (l.uuid)}
      <div class="mt-3 whitespace-pre-wrap break-words rounded-[7px] border border-rc-line bg-rc-panel2 px-3 py-2.5 text-[11.5px]"
           style="font-family:var(--font-rc-mono);color:{C.bad}">{l.last_release_error}</div>
    {/each}
  </Panel>

  {#if findings.length}
    <Panel>
      <SectionTitle title="Findings" />
      {#each findings as f (f.uuid)}
        <div class="flex items-center justify-between gap-2.5 border-b border-rc-line py-2.5">
          <div>
            <div class="text-[13px]">{f.display_name}</div>
            <div class="mt-0.5 text-[11.5px] text-rc-dim">detected {relative(f.detected_at)}</div>
          </div>
          <div class="flex items-center gap-2">
            <Pill tone={findingTone(f.finding_state)}>{f.finding_state}</Pill>
            {#if isStaff()}<a href="#/drift/{f.uuid}" class="text-[12.5px] text-rc-accent">Review &rarr;</a>{/if}
          </div>
        </div>
      {/each}
    </Panel>
  {/if}
{/if}
