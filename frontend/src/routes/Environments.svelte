<script lang="ts">
  import type { Fleet } from '../lib/domain';
  import { ENV_STATES } from '../lib/domain';
  import { navigate } from '../lib/router';
  import { envTone, allocTone, num, C } from '../lib/format';
  import Pill from '../ui/Pill.svelte';
  import Panel from '../ui/Panel.svelte';
  import Empty from '../ui/Empty.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  let { fleet }: { fleet: Fleet } = $props();
  let filter = $state<string>('all');

  const shown = $derived(
    filter === 'all' ? fleet.environments : fleet.environments.filter((e) => e.env_state === filter));

  const TH = 'px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line';
  const TD = 'px-3 py-2.5 text-[13px] align-middle border-b border-rc-line';
</script>

<SectionTitle title="Environments"
              sub="Believed state on the left, the cluster&rsquo;s last report beside it. They should match." />

<div class="mb-3.5">
  <select bind:value={filter}
          class="rounded-[7px] border border-rc-line bg-rc-panel2 px-2.5 py-[7px] text-[13px] text-rc-text">
    <option value="all">all</option>
    {#each ENV_STATES as s (s)}<option value={s}>{s}</option>{/each}
  </select>
</div>

<Panel pad="p-0">
  {#if shown.length}
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th class={TH}>Environment</th>
          <th class={TH}>Reclaim believes</th>
          <th class={TH}>Cluster reports</th>
          <th class={TH}>Holder</th>
          <th class="{TH} rc-hide-sm">Cost</th>
        </tr>
      </thead>
      <tbody>
        {#each shown as e (e.uuid)}
          {@const mismatch = e.env_state === 'disputed' || e.observed_allocation === 'unknown'}
          <tr class="cursor-pointer" style={mismatch ? `background:${C.bad}0b` : ''}
              onclick={() => navigate('#/env/' + e.uuid)}>
            <td class={TD}>
              <div class="text-[12.5px] font-semibold" style="font-family:var(--font-rc-mono)">
                {e.display_name || e.name}
              </div>
              <div class="mt-0.5 text-[11.5px] text-rc-dim">{e.namespace_path}</div>
            </td>
            <td class={TD}><Pill tone={envTone(e.env_state)}>{e.env_state}</Pill></td>
            <td class={TD}><Pill tone={allocTone(e.observed_allocation)}>cluster: {e.observed_allocation}</Pill></td>
            <td class="{TD} text-[12.5px] text-rc-muted">{e.current_holder || '—'}</td>
            <td class="{TD} rc-hide-sm text-[12.5px] text-rc-muted" style="font-family:var(--font-rc-mono)">
              {e.monthly_cost_usd ? '$' + Math.round(num(e.monthly_cost_usd)) + '/mo' : '—'}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <Empty>No environments match that filter.</Empty>
  {/if}
</Panel>
