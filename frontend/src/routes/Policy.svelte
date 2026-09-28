<script lang="ts">
  import type { Fleet } from '../lib/domain';
  import { update } from '../lib/api';
  import { toast } from '../lib/rbac';
  import { num, C } from '../lib/format';
  import Panel from '../ui/Panel.svelte';
  import Empty from '../ui/Empty.svelte';
  import Btn from '../ui/Btn.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  let { fleet, reload }: { fleet: Fleet; reload: () => void } = $props();
  let busy = $state(false);

  async function toggle() {
    const p = fleet.policy;
    if (!p) return;
    busy = true;
    try {
      await update('fleet_policy', p.uuid, { require_dual_approval: !p.require_dual_approval }, p);
      toast('Policy updated.', 'success');
      reload();
    } catch (e) {
      toast('Update failed: ' + (e instanceof Error ? e.message : ''), 'error');
    } finally {
      busy = false;
    }
  }
</script>

{#if !fleet.policy}
  <Empty>No policy row for this organisation.</Empty>
{:else}
  {@const p = fleet.policy}
  <SectionTitle title="Fleet policy" sub="Safety settings for this organisation." />

  <Panel>
    <div class="flex flex-wrap items-center justify-between gap-3.5">
      <div class="flex-[1_1_300px]">
        <div class="text-sm font-bold">Require a second approver for force reclaim</div>
        <div class="mt-1.5 text-[12.5px] leading-relaxed text-rc-muted">
          When on, destroying a disputed environment needs two different admins. Off by default &mdash;
          and safe to be a flag, because turning it on changes only the next decision. Nothing already
          recorded becomes wrong.
        </div>
      </div>
      <Btn disabled={busy} tone={p.require_dual_approval ? C.ok : C.mut}
           ghost={!p.require_dual_approval} onclick={toggle}>
        {p.require_dual_approval ? 'On' : 'Off'}
      </Btn>
    </div>
  </Panel>

  <Panel>
    <div class="mb-1.5 text-sm font-bold">Staleness window</div>
    <div class="text-[12.5px] leading-relaxed text-rc-muted">
      An observation older than {num(p.stale_observation_minutes, 30)} minutes is not trusted for a
      destructive action. Grace period before an expired lease is auto-released:
      {num(p.auto_release_grace_minutes)} minutes. Escalations go to
      {p.escalation_channel || 'the on-call channel'}.
    </div>
  </Panel>

  <Panel>
    <div class="mb-1.5 text-sm font-bold">Why tenancy is not on this page</div>
    <div class="text-[12.5px] leading-relaxed text-rc-muted">
      Whether organisations are isolated from one another is not a setting here, and deliberately so.
      A flag is only honest when turning it on later is cheap. An approval gate qualifies. Isolation
      does not &mdash; retrofitting it rewrites every query, every policy and the login path &mdash;
      so it is structural and always on.
    </div>
  </Panel>
{/if}
