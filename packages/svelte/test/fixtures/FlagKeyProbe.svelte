<script lang="ts">
  import { useFlag } from '../../src';

  let { flagKey }: { flagKey: string } = $props();

  const flag = $derived(useFlag(flagKey, false));
</script>

<span data-testid="value">{String(flag.value)}</span>
