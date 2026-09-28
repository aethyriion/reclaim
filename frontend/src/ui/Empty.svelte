<script lang="ts">
  let { children }: { children?: import('svelte').Snippet } = $props();
</script>

<div class="px-[18px] py-9 text-center text-[13.5px] text-rc-dim">{@render children?.()}</div>
