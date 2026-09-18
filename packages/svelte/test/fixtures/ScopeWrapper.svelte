<script lang="ts">
  import { setOpenFeatureScope, type OpenFeatureScopeOptions } from '../../src';
  import ScopeProbe from './ScopeProbe.svelte';

  let { scope }: { scope?: OpenFeatureScopeOptions } = $props();

  // svelte-ignore state_referenced_locally
  setOpenFeatureScope(scope);
</script>

<ScopeProbe />
