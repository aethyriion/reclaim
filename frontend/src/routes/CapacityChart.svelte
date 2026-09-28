<script lang="ts">
  import { C } from '../lib/format';
  export interface Row { label: string; used: number; cap: number; stale: boolean }
  let { rows }: { rows: Row[] } = $props();

  const W = 560, ROW_H = 26, PAD = 104;
  const barW = W - PAD - 56;
  const maxCap = $derived(Math.max(1, ...rows.map((r) => r.cap)));
  const height = $derived(rows.length * ROW_H + 14);

  /* Bars are tinted by observation freshness, so a cluster we cannot currently
   * see reads as a risk rather than as a number. */
  function tone(r: Row): string {
    if (r.stale) return C.bad;
    return r.used / Math.max(1, r.cap) > 0.85 ? C.warn : C.cyan;
  }
</script>

{#if rows.length}
  <svg viewBox="0 0 {W} {height}" width="100%" height={height} role="img"
       aria-label="Allocated environments against capacity, by cluster"
       style="max-width:{W}px;display:block">
    {#each rows as r, i (r.label)}
      {@const y = i * ROW_H + 8}
      {@const w = Math.max(2, Math.round((r.used / maxCap) * barW))}
      <text x="0" y={y + 12} fill={C.mut} font-size="11.5" font-family="var(--font-rc-mono)">{r.label}</text>
      <rect x={PAD} y={y + 2} width={barW} height="13" rx="3" fill={C.panel2} stroke={C.line} />
      <rect x={PAD} y={y + 2} width={w} height="13" rx="3" fill={tone(r)} opacity="0.85" />
      <text x={PAD + barW + 8} y={y + 12} fill={C.mut} font-size="11.5" font-family="var(--font-rc-mono)">
        {r.used}/{r.cap}
      </text>
    {/each}
  </svg>
{/if}
