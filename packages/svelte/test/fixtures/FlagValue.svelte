<script lang="ts">
  import { useFlag, type SvelteFlagEvaluationOptions } from '../../src';

  let {
    flagKey,
    defaultValue,
    options,
  }: { flagKey: string; defaultValue: boolean | string | number; options?: SvelteFlagEvaluationOptions } = $props();

  // svelte-ignore state_referenced_locally
  const flag = useFlag(flagKey, defaultValue, options);
</script>

<span data-testid="value">{String(flag.value)}</span>
<span data-testid="variant">{flag.variant ?? 'none'}</span>
<span data-testid="reason">{flag.reason ?? 'none'}</span>
<span data-testid="type">{flag.type}</span>
