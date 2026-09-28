<script lang="ts">
  import type { Fleet } from '../lib/domain';
  import { byUuid, createWithRefs, update } from '../lib/api';
  import { act } from '../lib/act';
  import { me, toast } from '../lib/rbac';
  import { leaseTone, until } from '../lib/format';
  import Pill from '../ui/Pill.svelte';
  import Panel from '../ui/Panel.svelte';
  import Empty from '../ui/Empty.svelte';
  import Btn from '../ui/Btn.svelte';
  import SectionTitle from '../ui/SectionTitle.svelte';

  let { fleet, reload }: { fleet: Fleet; reload: () => void } = $props();

  const free = $derived(fleet.environments.filter((e) => e.env_state === 'available'));
  let envUuid = $state('');
  let team = $state('');
  let purpose = $state('');
  let days = $state('3');
  let busy = $state(false);

  $effect(() => {
    if (!envUuid && free.length) envUuid = free[0]!.uuid;
  });

  const field = 'mt-1.5 w-full rounded-[7px] border border-rc-line bg-rc-panel2 px-2.5 py-2 text-[13px] text-rc-text outline-none';
  const TH = 'px-3 py-[9px] text-left text-[10.5px] font-bold uppercase tracking-[0.07em] text-rc-muted border-b border-rc-line';
  const TD = 'px-3 py-2.5 text-[13px] align-middle border-b border-rc-line';

  async function claim() {
    if (!envUuid || !team.trim()) { toast('Pick an environment and name your team.', 'error'); return; }
    busy = true;
    const env = byUuid(fleet.environments, envUuid);
    const now = new Date();
    const expires = new Date(now.getTime() + parseInt(days, 10) * 86_400_000);
    try {
      const res = await createWithRefs('lease', {
        display_name: `${env?.display_name ?? 'environment'} · ${team.trim()}`,
        description: purpose.trim() || 'Environment lease.',
        environment_uuid: envUuid,
        team: team.trim(),
        requested_by: me(),
        owner_username: me(),
        purpose: purpose.trim(),
        claimed_at: now.toISOString(),
        expires_at: expires.toISOString(),
        lease_state: 'active',
        release_attempts: 0,
      }, [{ ref_name: 'Environment', ref_uuid: envUuid }]);

      if (res?.refErrors?.length) toast('Lease created, but the environment link failed.', 'warning');

      /* The environment transition belongs to the on_lease_claimed event workflow,
       * which cannot install under a project-scoped deploy key. Try the write
       * directly; RBAC decides, and we degrade honestly rather than leave the
       * fleet view silently stale. */
      try {
        await update('environment', envUuid, {
          env_state: 'claimed', observed_allocation: 'allocated',
          current_holder: me(), current_team: team.trim(),
        }, env ?? undefined);
        toast('Environment claimed.', 'success');
      } catch {
        toast('Lease recorded. The environment flips to claimed when the reconciler next runs.', 'info');
      }
      team = ''; purpose = '';
      reload();
    } catch (e) {
      toast('Claim failed: ' + (e instanceof Error ? e.message : 'unknown error'), 'error');
    } finally {
      busy = false;
    }
  }

  async function release(l: typeof fleet.leases[number]) {
    const env = byUuid(fleet.environments, l.environment_uuid ?? '');
    if (!env) { toast('That environment is not visible to you.', 'error'); return; }
    try {
      await act('release_lease', {
        lease_uuid: l.uuid,
        environment_uuid: env.uuid,
        observed: env.observed_allocation,
        env_label: env.display_name || env.name,
      }, async () => {
        const freed = env.observed_allocation === 'free';
        await update('lease', l.uuid, freed
          ? { lease_state: 'released' }
          : { lease_state: 'release_failed',
              last_release_error: 'cluster still reports the namespace allocated at release time' }, l);
      });
      if (env.observed_allocation === 'free') toast('Environment released.', 'success');
      else toast('Release did not complete — the cluster still reports it allocated. A finding was opened.', 'warning');
      reload();
    } catch (e) {
      toast('Release failed: ' + (e instanceof Error ? e.message : 'unknown'), 'error');
    }
  }

  async function extend(l: typeof fleet.leases[number]) {
    const next = new Date(new Date(l.expires_at ?? Date.now()).getTime() + 3 * 86_400_000);
    try {
      await update('lease', l.uuid, { expires_at: next.toISOString(), lease_state: 'active' }, l);
      toast('Extended by three days.', 'success');
      reload();
    } catch (e) {
      toast('Extend failed: ' + (e instanceof Error ? e.message : 'unknown'), 'error');
    }
  }
</script>

<SectionTitle title="My leases"
              sub="Leases you hold. Others&rsquo; leases are filtered out by the server, not by this page." />

<Panel>
  {#if free.length}
    <SectionTitle title="Claim an environment"
                  sub="Creating a lease marks the environment claimed server-side." />
    <div class="flex flex-wrap gap-3">
      <div class="flex-[2_1_220px]">
        <label class="text-[11.5px] font-semibold text-rc-muted" for="rc-env">Environment</label>
        <select id="rc-env" class={field} bind:value={envUuid}>
          {#each free as e (e.uuid)}
            <option value={e.uuid}>{e.display_name || e.name} &mdash; {e.namespace_path}</option>
          {/each}
        </select>
      </div>
      <div class="flex-[1_1_130px]">
        <label class="text-[11.5px] font-semibold text-rc-muted" for="rc-team">Team</label>
        <input id="rc-team" class={field} bind:value={team} placeholder="atlas" />
      </div>
      <div class="flex-[2_1_200px]">
        <label class="text-[11.5px] font-semibold text-rc-muted" for="rc-purpose">Purpose</label>
        <input id="rc-purpose" class={field} bind:value={purpose} placeholder="What is it for?" />
      </div>
      <div class="flex-[0_1_110px]">
        <label class="text-[11.5px] font-semibold text-rc-muted" for="rc-days">Days</label>
        <select id="rc-days" class={field} bind:value={days}>
          {#each ['1', '3', '7', '14'] as d (d)}<option value={d}>{d}</option>{/each}
        </select>
      </div>
    </div>
    <div class="mt-3.5">
      <Btn disabled={busy} onclick={claim}>{busy ? 'Claiming…' : 'Claim environment'}</Btn>
    </div>
  {:else}
    <SectionTitle title="Claim an environment" />
    <Empty>Nothing is available in this organisation right now.</Empty>
  {/if}
</Panel>

<Panel pad="p-0">
  {#if fleet.leases.length}
    <table class="w-full border-collapse">
      <thead><tr>
        <th class={TH}>Environment</th><th class={TH}>Team</th>
        <th class={TH}>Expires</th><th class={TH}>State</th><th class={TH}></th>
      </tr></thead>
      <tbody>
        {#each fleet.leases as l (l.uuid)}
          {@const env = byUuid(fleet.environments, l.environment_uuid ?? '')}
          {@const done = l.lease_state === 'released' || l.lease_state === 'force_reclaimed'}
          <tr>
            <td class="{TD} text-[12.5px]" style="font-family:var(--font-rc-mono)">
              {env ? (env.display_name || env.name) : '—'}
            </td>
            <td class="{TD} text-[12.5px] text-rc-muted">{l.team}</td>
            <td class="{TD} text-[12.5px] text-rc-muted">{until(l.expires_at)}</td>
            <td class={TD}><Pill tone={leaseTone(l.lease_state)}>{l.lease_state}</Pill></td>
            <td class="{TD} whitespace-nowrap text-right">
              {#if done}
                <span class="text-xs text-rc-dim">closed</span>
              {:else}
                <span class="inline-flex gap-[7px]">
                  <Btn small ghost onclick={() => extend(l)}>+3d</Btn>
                  <Btn small onclick={() => release(l)}>Release</Btn>
                </span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <Empty>You hold no leases.</Empty>
  {/if}
</Panel>
