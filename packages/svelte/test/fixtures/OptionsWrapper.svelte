<script lang="ts">
  import { setOpenFeatureScope, type OpenFeatureScopeOptions, type SvelteFlagEvaluationOptions } from '../../src';
  import FlagValue from './FlagValue.svelte';

  let {
    scope,
    flagKey,
    defaultValue,
    options,
  }: {
    scope: OpenFeatureScopeOptions;
    flagKey: string;
    defaultValue: boolean | string | number;
    options?: SvelteFlagEvaluationOptions;
  } = $props();

  // svelte-ignore state_referenced_locally
  setOpenFeatureScope(scope);
</script>

<FlagValue {flagKey} {defaultValue} {options} />
