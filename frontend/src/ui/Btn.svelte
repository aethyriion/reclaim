<script lang="ts">
  import { C } from '../lib/format';
  let {
    tone = C.cyan, ghost = false, small = false, disabled = false, title = '',
    onclick, children,
  }: {
    tone?: string; ghost?: boolean; small?: boolean; disabled?: boolean; title?: string;
    onclick?: () => void; children?: import('svelte').Snippet;
  } = $props();

  const style = $derived(
    disabled
      ? `border:1px solid ${C.line};background:transparent;color:${C.dim};opacity:.55`
      : `border:1px solid ${ghost ? tone + '66' : tone};background:${ghost ? 'transparent' : tone + '1f'};color:${tone}`,
  );
</script>

<button
  {title} {disabled} {onclick}
  class="rounded-[7px] font-semibold transition-colors {small ? 'px-[11px] py-[5px] text-xs' : 'px-[15px] py-2 text-[13px]'}"
  class:cursor-not-allowed={disabled}
  class:cursor-pointer={!disabled}
  style={style}
>{@render children?.()}</button>
