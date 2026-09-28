<script lang="ts">
  import Btn from '../ui/Btn.svelte';
  let { onSignIn }: { onSignIn: () => void } = $props();

  /* Reclaim is an internal tool, so PUBLIC_SCHEMAS is empty and this page shows
   * no fleet data at all. It is a value-prop sign-in, which is the correct
   * logged-out surface for an internal/regulated app — not a fallback. */
  const points = [
    {
      title: 'Two truths, kept apart',
      body: 'What the record believes and what the cluster reports are stored separately, with the age of the last observation alongside. A disagreement is data, not an error to swallow.',
    },
    {
      title: 'No silent reclaims',
      body: 'Destroying a workload on a stale reading is how a partitioned cluster becomes an outage. If the observation is too old to trust, Reclaim withdraws the option and tells you why.',
    },
    {
      title: 'Your rules, per organisation',
      body: 'Staleness windows and whether a force reclaim needs a second approver are set per organisation, so a stricter fleet is a setting rather than a rebuild.',
    },
  ];
</script>

<div class="min-h-screen bg-rc-bg text-rc-text">
  <header class="flex flex-wrap items-center justify-between gap-3 border-b border-rc-line px-6 py-[18px]">
    <div class="flex items-center gap-2.5">
      <div class="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] text-sm font-extrabold"
           style="border:1px solid #38BDF877;background:#38BDF81a;color:#38BDF8">&#9851;</div>
      <span class="text-[17px] font-extrabold tracking-tight">Reclaim</span>
    </div>
    <Btn onclick={onSignIn}>Sign in</Btn>
  </header>

  <section class="mx-auto max-w-[980px] px-6 pb-5 pt-16">
    <div class="mb-4 text-[11.5px] font-bold uppercase tracking-[0.14em] text-rc-accent">Platform operations</div>
    <h1 class="m-0 mb-5 text-[clamp(30px,5.2vw,50px)] font-extrabold leading-[1.08] tracking-[-0.025em]">
      Every idle environment is a bill <span class="text-rc-accent">nobody agreed to pay</span>.
    </h1>
    <p class="m-0 mb-[30px] max-w-[680px] text-[17px] leading-[1.62] text-rc-muted">
      Reclaim tracks time-boxed leases on shared Kubernetes environments and reconciles the moment your
      records and your clusters stop agreeing &mdash; so a release that quietly failed becomes a decision
      someone makes, not a cost you discover next quarter.
    </p>
    <Btn onclick={onSignIn}>Sign in to your fleet</Btn>
  </section>

  <section class="mx-auto max-w-[980px] px-6 pb-[70px] pt-[30px]">
    <div class="flex flex-wrap gap-[18px]">
      {#each points as p (p.title)}
        <div class="flex-[1_1_260px] rounded-[10px] border border-rc-line bg-rc-panel p-5">
          <div class="mb-2 text-[14.5px] font-bold">{p.title}</div>
          <div class="text-[13.4px] leading-[1.6] text-rc-muted">{p.body}</div>
        </div>
      {/each}
    </div>
  </section>

  <footer class="flex flex-wrap justify-between gap-2.5 border-t border-rc-line px-6 py-5 text-[12.5px] text-rc-dim">
    <span>Reclaim &mdash; environment lease reconciliation</span>
    <span>Demonstration fleet. All data is invented.</span>
  </footer>
</div>
