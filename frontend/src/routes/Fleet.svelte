<script lang="ts">
  import type { Fleet } from '../lib/domain';
  import { envCluster } from '../lib/api';
  import { staleness, relative } from '../lib/staleness';
  import { C, clusterTone, num } from '../lib/format';
  import { isStaff } from '../lib/rbac';
  import Pill from '../ui/Pill.svelte';
  import Panel from '../ui/Panel.svelte';
  import Metric from '../ui/Metric.svelte';
  import Banner from '../ui/Banner.svelte';
  import Empty from '../ui/Empty.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';
  import CapacityChart from './CapacityChart.svelte';

  let { fleet }: { fleet: Fleet } = $props();

  const open = $derived(fleet.findings.filter(
    (f) => f.finding_state === 'open' || f.finding_state === 'awaiting_second_approval'));
  const disputed = $derived(fleet.environments.filter((e) => e.env_state === 'disputed'));
  const idleCost = $derived(disputed.reduce((a, e) => a + num(e.monthly_cost_usd), 0));

  const usedOn = (c: typeof fleet.clusters[number]) =>
    fleet.environments.filter((e) => envCluster(e, fleet.clusters) === c && e.observed_allocation === 'allocated').length;

  const chartRows = $derived(fleet.clusters.map((c) => ({
    label: c.display_name || c.name || '?',
    used: usedOn(c),
    cap: num(c.capacity),
    stale: staleness(c, fleet.policy).stale,
  })));
</script>

<SectionTitle title="Fleet" sub="Capacity, observation freshness and anything currently in dispute." />

<div class="mb-[18px] flex flex-wrap gap-3.5">
  <Metric label="Environments" value={fleet.environments.length}
          sub="{fleet.environments.filter((e) => e.env_state === 'available').length} available" />
  <Metric label="In dispute" value={disputed.length} tone={disputed.length ? C.bad : C.ok}
          sub="record and cluster disagree" />
  <Metric label="Open findings" value={open.length} tone={open.length ? C.warn : C.ok}
          sub="awaiting a decision" />
  <Metric label="Disputed spend" value={'$' + Math.round(idleCost)} tone={idleCost ? C.warn : C.ok}
          sub="per month, unverified" />
</div>

{#if open.length}
  <Banner tone={C.bad} title="{open.length} finding{open.length > 1 ? 's' : ''} need a decision">
    An environment is in dispute when what Reclaim believes and what its cluster reports no longer agree.
    {#if isStaff()}<a href="#/drift" class="text-rc-accent">Open the drift queue &rarr;</a>
    {:else}A platform admin resolves these.{/if}
  </Banner>
{/if}

{#if fleet.clusters.length}
  <Panel>
    <SectionTitle title="Allocation against capacity"
                  sub="Bars turn red where the observation behind them is too old to trust." />
    <CapacityChart rows={chartRows} />
  </Panel>
{/if}

<div class="flex flex-wrap gap-3.5">
  {#each fleet.clusters as c (c.uuid)}
    {@const s = staleness(c, fleet.policy)}
    {@const cap = num(c.capacity)}
    {@const used = usedOn(c)}
    {@const pct = cap ? Math.min(100, Math.round((used / cap) * 100)) : 0}
    <div class="min-w-[280px] flex-[1_1_300px] rounded-[10px] bg-rc-panel p-4"
         style="border:1px solid {s.stale ? C.bad + '55' : C.line}">
      <div class="mb-2.5 flex items-start justify-between gap-2.5">
        <div>
          <div class="text-[14.5px] font-bold" style="font-family:var(--font-rc-mono)">
            {c.display_name || c.name}
          </div>
          <div class="mt-0.5 text-xs text-rc-muted">
            {(c.provider ?? '').toUpperCase()} &middot; {c.region ?? ''}
          </div>
        </div>
        <Pill tone={clusterTone(c.cluster_state)}>{c.cluster_state}</Pill>
      </div>

      <div class="mt-3">
        <div class="mb-1.5 flex justify-between text-[11.5px] text-rc-muted">
          <span>Allocated</span>
          <span style="font-family:var(--font-rc-mono)">{used} / {cap}</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded border border-rc-line bg-rc-panel2">
          <div class="h-full" style="width:{pct}%;background:{pct > 85 ? C.warn : C.cyan}"></div>
        </div>
      </div>

      <div class="mt-3 border-t border-rc-line pt-2.5 text-xs">
        <span class="text-rc-muted">Last observed </span>
        <span class="font-semibold" style="color:{s.stale ? C.bad : C.ok}">{relative(c.last_observed_at)}</span>
        {#if s.stale}
          <div class="mt-1.5 text-[11.5px] leading-relaxed" style="color:{C.bad}">
            Beyond the {s.limit}-minute window &mdash; destructive actions are withheld on this cluster.
          </div>
        {/if}
      </div>
    </div>
  {:else}
    <Empty>No clusters in this organisation.</Empty>
  {/each}
</div>
