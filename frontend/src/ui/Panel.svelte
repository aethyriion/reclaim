<script lang="ts">
  let { pad = 'p-[18px]', children }: { pad?: string; children?: import('svelte').Snippet } = $props();
</script>

<div class="mb-4 rounded-[10px] border border-rc-line bg-rc-panel {pad}">{@render children?.()}</div>
