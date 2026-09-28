<script lang="ts">
  let { tone, children }: { tone: string; children?: import('svelte').Snippet } = $props();
</script>

<span
  class="inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide whitespace-nowrap"
  style="color:{tone};border:1px solid {tone}55;background:{tone}14;font-family:var(--font-rc-mono)"
>{@render children?.()}</span>
