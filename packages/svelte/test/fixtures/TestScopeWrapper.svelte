<script lang="ts">
  import { setOpenFeatureTestScope, type OpenFeatureTestScopeOptions } from '../../src';
  import FlagValue from './FlagValue.svelte';

  let {
    testScope,
    flagKey,
    defaultValue,
  }: { testScope?: OpenFeatureTestScopeOptions; flagKey: string; defaultValue: boolean | string | number } = $props();

  // svelte-ignore state_referenced_locally
  setOpenFeatureTestScope(testScope);
</script>

<FlagValue {flagKey} {defaultValue} />
