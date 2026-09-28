<script lang="ts">
  import { C } from '../lib/format';
  let { title, tone = C.warn, children }:
    { title: string; tone?: string; children?: import('svelte').Snippet } = $props();
</script>

<div class="mb-3.5 rounded-[9px] px-3.5 py-3 text-[13px] leading-relaxed"
     style="border:1px solid {tone}55;background:{tone}12">
  <div class="mb-1 text-[12.5px] font-bold uppercase tracking-[0.06em]" style="color:{tone}">{title}</div>
  <div class="text-rc-muted">{@render children?.()}</div>
</div>
