<script lang="ts">
  let { title, sub = '' }: { title: string; sub?: string } = $props();
</script>

<div class="mb-3">
  <div class="text-[15px] font-bold text-rc-text">{title}</div>
  {#if sub}<div class="mt-[3px] text-[12.5px] text-rc-muted">{sub}</div>{/if}
</div>
