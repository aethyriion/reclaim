<script lang="ts">
  import type { Fleet } from '../lib/domain';
  import { byUuid, envCluster } from '../lib/api';
  import { staleness, relative } from '../lib/staleness';
  import { navigate } from '../lib/router';
  import { findingTone, num, C } from '../lib/format';
  import Pill from '../ui/Pill.svelte';
  import Panel from '../ui/Panel.svelte';
  import Empty from '../ui/Empty.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  let { fleet }: { fleet: Fleet } = $props();

  const closed = $derived(fleet.findings.filter((f) => f.finding_state === 'resolved' || f.finding_state === 'rejected'));
  const open = $derived(fleet.findings.filter((f) => !closed.includes(f)));

  const TH = 'px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line';
  const TD = 'px-3 py-2.5 text-[13px] align-middle border-b border-rc-line';
</script>

<SectionTitle title="Drift queue"
              sub="Each of these is a disagreement with no clean answer. Someone has to choose." />

<Panel pad="p-0">
  {#if open.length}
    <table class="w-full border-collapse">
      <thead><tr>
        <th class={TH}>Finding</th><th class={TH}>State</th>
        <th class={TH}>Evidence</th><th class={TH}>Wasted</th>
      </tr></thead>
      <tbody>
        {#each open as f (f.uuid)}
          {@const s = staleness(envCluster(byUuid(fleet.environments, f.environment_uuid ?? ''), fleet.clusters), fleet.policy)}
          <tr class="cursor-pointer" onclick={() => navigate('#/drift/' + f.uuid)}>
            <td class={TD}>
              <div class="text-[13px] font-semibold">{f.display_name}</div>
              <div class="mt-0.5 text-[11.5px] text-rc-dim">detected {relative(f.detected_at)}</div>
            </td>
            <td class={TD}><Pill tone={findingTone(f.finding_state)}>{f.finding_state}</Pill></td>
            <td class={TD}>
              {#if s.stale}<Pill tone={C.bad}>observation stale</Pill>
              {:else}<Pill tone={C.ok}>observation fresh</Pill>{/if}
            </td>
            <td class="{TD} text-[12.5px] text-rc-muted">
              {#if f.wasted_cost_usd === undefined}
                <span class="italic text-rc-dim">hidden</span>
              {:else}${Math.round(num(f.wasted_cost_usd))}{/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <Empty>Nothing in dispute. Record and cluster agree everywhere.</Empty>
  {/if}
</Panel>

{#if closed.length}
  <Panel pad="p-0">
    <div class="border-b border-rc-line px-3.5 py-3 text-xs text-rc-muted">Resolved</div>
    <table class="w-full border-collapse"><tbody>
      {#each closed as f (f.uuid)}
        <tr class="cursor-pointer" onclick={() => navigate('#/drift/' + f.uuid)}>
          <td class={TD}>
            <div class="text-[13px]">{f.display_name}</div>
            <div class="mt-0.5 text-[11.5px] text-rc-dim">{f.resolution} &middot; {relative(f.approved_at)}</div>
          </td>
          <td class={TD}><Pill tone={findingTone(f.finding_state)}>{f.finding_state}</Pill></td>
        </tr>
      {/each}
    </tbody></table>
  </Panel>
{/if}
