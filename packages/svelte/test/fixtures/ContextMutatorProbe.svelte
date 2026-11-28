<script lang="ts">
  import {
    setOpenFeatureScope,
    useContextMutator,
    type ContextMutation,
    type ContextMutationOptions,
    type OpenFeatureScopeOptions,
  } from '../../src';

  let {
    scope,
    options,
    onReady,
  }: {
    scope?: OpenFeatureScopeOptions;
    options?: ContextMutationOptions;
    onReady: (mutation: ContextMutation) => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  if (scope) {
    setOpenFeatureScope(scope);
  }
  // svelte-ignore state_referenced_locally
  onReady(useContextMutator(options));
</script>
