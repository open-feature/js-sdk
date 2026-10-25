<script lang="ts">
  import { setOpenFeatureScope, useTrack, type OpenFeatureScopeOptions, type Track } from '../../src';

  let { scope, onReady }: { scope?: OpenFeatureScopeOptions; onReady: (track: Track) => void } = $props();

  // svelte-ignore state_referenced_locally
  if (scope) {
    setOpenFeatureScope(scope);
  }
  // svelte-ignore state_referenced_locally
  onReady(useTrack());
</script>
