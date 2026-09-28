<script lang="ts">
  import { login } from '../lib/api';
  let { onDone, onBack }: { onDone: () => void; onBack: () => void } = $props();

  let email = $state('');
  let password = $state('');
  let busy = $state(false);
  let error = $state('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    if (!email || !password) { error = 'Enter an email and password.'; return; }
    busy = true; error = '';
    try {
      await login(email, password);
      onDone();
    } catch (ex) {
      error = ex instanceof Error ? ex.message : 'Sign-in failed.';
    } finally {
      busy = false;
    }
  }

  const field = 'mt-1.5 w-full rounded-[7px] border border-rc-line bg-rc-panel2 px-3 py-2.5 text-sm text-rc-text outline-none';
</script>

<div class="flex min-h-screen items-center justify-center bg-rc-bg p-5 text-rc-text">
  <div class="w-full max-w-[400px]">
    <div class="mb-[22px] flex items-center gap-2.5">
      <div class="flex h-[30px] w-[30px] items-center justify-center rounded-lg text-[15px] font-extrabold"
           style="border:1px solid #38BDF877;background:#38BDF81a;color:#38BDF8">&#9851;</div>
      <div>
        <div class="text-lg font-extrabold">Reclaim</div>
        <div class="text-xs text-rc-muted">Sign in to your fleet</div>
      </div>
    </div>

    <form onsubmit={submit}>
      <div class="mb-4 rounded-[10px] border border-rc-line bg-rc-panel p-5">
        {#if error}
          <div class="mb-3.5 rounded-[7px] px-[11px] py-2.5 text-[12.5px]"
               style="color:#F43F5E;background:#F43F5E12;border:1px solid #F43F5E44">{error}</div>
        {/if}

        <label class="text-xs font-semibold text-rc-muted" for="rc-email">Email</label>
        <input id="rc-email" type="email" class={field} bind:value={email} autocomplete="username" />

        <div class="h-3.5"></div>
        <label class="text-xs font-semibold text-rc-muted" for="rc-pw">Password</label>
        <input id="rc-pw" type="password" class={field} bind:value={password} autocomplete="current-password" />

        <button type="submit" disabled={busy}
                class="mt-[18px] w-full rounded-[7px] px-3.5 py-2.5 text-sm font-bold"
                style="border:1px solid #38BDF8;background:#38BDF824;color:#38BDF8">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </form>

    <div class="text-center">
      <button class="text-[12.5px] text-rc-dim" onclick={onBack}>&larr; Back</button>
    </div>
  </div>
</div>
