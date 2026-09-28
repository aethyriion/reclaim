<script lang="ts">
  import { isStaff, me, canSwitchTenant } from '../lib/rbac';
  import { loadTenants } from '../lib/api';
  import { C } from '../lib/format';
  import Btn from '../ui/Btn.svelte';

  let { route, tenant, onTenant, onLogout, children }: {
    route: string; tenant: string;
    onTenant: (t: string) => void; onLogout: () => void;
    children?: import('svelte').Snippet;
  } = $props();

  const staff = $derived(isStaff());
  const tabs = $derived([
    { hash: '#/', label: 'Fleet' },
    { hash: '#/environments', label: 'Environments' },
    { hash: '#/leases', label: 'My leases' },
    ...(staff ? [{ hash: '#/drift', label: 'Drift queue' }, { hash: '#/policy', label: 'Policy' }] : []),
  ]);

  const here = $derived((route.split('/')[1] ?? ''));

  // Populated at runtime so a tenant added after this app shipped still appears.
  let tenants = $state<Array<{ name: string; label: string }>>([]);
  $effect(() => {
    if (!canSwitchTenant()) return;
    void loadTenants().then((t) => { tenants = t; });
  });
  const active = (hash: string) => (hash === '#/' && here === '') || (hash !== '#/' && `#/${here}` === hash);
</script>

<div class="min-h-screen bg-rc-bg text-rc-text">
  <header class="flex flex-wrap items-center justify-between gap-3.5 border-b border-rc-line bg-rc-panel2 px-5 py-3">
    <div class="flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2.5">
        <div class="flex h-6 w-6 items-center justify-center rounded-md text-[13px] font-extrabold"
             style="border:1px solid #38BDF877;background:#38BDF81a;color:#38BDF8">&#9851;</div>
        <span class="text-[15.5px] font-extrabold">Reclaim</span>
      </div>
      <nav class="flex flex-wrap gap-1.5">
        {#each tabs as t (t.hash)}
          <a href={t.hash}
             class="whitespace-nowrap rounded-[7px] px-3 py-[7px] text-[13px] font-semibold no-underline"
             style="color:{active(t.hash) ? C.cyan : C.mut};
                    background:{active(t.hash) ? C.cyan + '18' : 'transparent'};
                    border:1px solid {active(t.hash) ? C.cyan + '44' : 'transparent'}">{t.label}</a>
        {/each}
      </nav>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      {#if canSwitchTenant() && tenants.length}
        <select class="rounded-[7px] border border-rc-line bg-rc-panel px-2.5 py-1.5 text-[12.5px] text-rc-text"
                value={tenant} onchange={(e) => onTenant((e.currentTarget as HTMLSelectElement).value)}>
          <option value="">All organisations</option>
          {#each tenants as t (t.name)}
            <option value={t.name}>{t.label}</option>
          {/each}
        </select>
      {/if}
      <div class="text-right">
        <div class="text-[12.5px] font-semibold">{me()}</div>
        <div class="text-[11px] text-rc-dim">{staff ? 'platform admin' : 'platform engineer'}</div>
      </div>
      <Btn small ghost tone={C.mut} onclick={onLogout}>Sign out</Btn>
    </div>
  </header>

  <main class="mx-auto max-w-[1180px] px-5 pb-[60px] pt-6">{@render children?.()}</main>
</div>
