<script lang="ts">
  import { EMPTY_FLEET, type Fleet } from './lib/domain';
  import { loadFleet, scopeToTenant } from './lib/api';
  import { current, navigate, onChange, type Route } from './lib/router';
  import { isStaff } from './lib/rbac';
  import { C } from './lib/format';
  import Landing from './routes/Landing.svelte';
  import Login from './routes/Login.svelte';
  import Shell from './routes/Shell.svelte';
  import FleetView from './routes/Fleet.svelte';
  import Environments from './routes/Environments.svelte';
  import EnvDetail from './routes/EnvDetail.svelte';
  import Leases from './routes/Leases.svelte';
  import DriftQueue from './routes/DriftQueue.svelte';
  import DriftDetail from './routes/DriftDetail.svelte';
  import Policy from './routes/Policy.svelte';
  import Banner from './ui/Banner.svelte';
  import Empty from './ui/Empty.svelte';

  let route = $state<Route>(current());
  let authed = $state(client.isAuthenticated());
  let showLogin = $state(false);
  let tenant = $state('');
  let loaded = $state<Fleet>(EMPTY_FLEET);
  /* A tenant-scoped user already receives only their organisation's rows, so this
   * is a no-op for them. It only narrows the super-admin's cross-organisation
   * view. See scopeToTenant() for why this is client-side. */
  const fleet = $derived(scopeToTenant(loaded, tenant));
  let loading = $state(true);
  let loadError = $state('');

  $effect(() => onChange((r) => { route = r; }));

  /* The runtime rehydrates its session from localStorage ASYNCHRONOUSLY, so on a
   * fresh load with a valid session isAuthenticated() is often false at mount. A
   * one-shot read here strands a logged-in user on the landing page. */
  $effect(() => {
    if (client.isAuthenticated()) { authed = true; return; }
    let n = 0;
    const t = setInterval(() => {
      if (client.isAuthenticated()) { authed = true; clearInterval(t); }
      else if (++n > 25) clearInterval(t);
    }, 150);
    return () => clearInterval(t);
  });

  async function reload() {
    loading = true; loadError = '';
    try {
      loaded = await loadFleet();
    } catch (e) {
      loadError = e instanceof Error ? e.message : 'Could not load the fleet.';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (authed) { void tenant; void reload(); }
  });

  /* View filter only. client.setTenantOverride() is documented as scoping reads
   * via an X-Tenant header, but the API ignores that header, so calling it would
   * change nothing and imply a boundary that is not being enforced here. The real
   * boundary is server-side and applies to tenant-scoped users. */
  function onTenant(name: string) {
    tenant = name;
  }

  function logout() {
    client.logout();
    authed = false; showLogin = false;
    navigate('#/');
  }
</script>

{#if !authed}
  {#if showLogin}
    <Login onDone={() => { authed = true; navigate('#/'); }} onBack={() => (showLogin = false)} />
  {:else}
    <Landing onSignIn={() => (showLogin = true)} />
  {/if}
{:else}
  <Shell route={route.hash} {tenant} {onTenant} onLogout={logout}>
    {#if loading}
      <Empty>Loading the fleet&hellip;</Empty>
    {:else if loadError}
      <Banner tone={C.bad} title="Could not load">{loadError}</Banner>
    {:else if route.head === 'environments'}
      <Environments {fleet} />
    {:else if route.head === 'env'}
      <EnvDetail {fleet} uuid={route.arg} />
    {:else if route.head === 'leases'}
      <Leases {fleet} {reload} />
    {:else if route.head === 'drift'}
      {#if !isStaff()}
        <Empty>Resolving drift is limited to platform admins.</Empty>
      {:else if route.arg}
        <DriftDetail {fleet} uuid={route.arg} {reload} />
      {:else}
        <DriftQueue {fleet} />
      {/if}
    {:else if route.head === 'policy'}
      {#if isStaff()}<Policy {fleet} {reload} />{:else}<Empty>Fleet policy is limited to platform admins.</Empty>{/if}
    {:else}
      <FleetView {fleet} />
    {/if}
  </Shell>
{/if}
