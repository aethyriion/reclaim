<script lang="ts">
  import { C } from '../lib/format';
  let { label, value, tone = C.text, sub = '' }:
    { label: string; value: string | number; tone?: string; sub?: string } = $props();
</script>

<div class="min-w-[140px] flex-[1_1_150px] rounded-[10px] border border-rc-line bg-rc-panel px-4 py-[14px]">
  <div class="text-[11px] font-semibold uppercase tracking-[0.07em] text-rc-muted">{label}</div>
  <div class="mt-1.5 text-[26px] font-bold" style="color:{tone};font-family:var(--font-rc-mono)">{value}</div>
  {#if sub}<div class="mt-1 text-[11.5px] text-rc-dim">{sub}</div>{/if}
</div>
