<script lang="ts">
  import type { Component } from 'svelte';
  import { setOpenFeatureScope, type OpenFeatureScopeOptions } from '../../src';
  import ScopeProbe from './ScopeProbe.svelte';

  let { scope, probe: Probe = ScopeProbe }: { scope?: OpenFeatureScopeOptions; probe?: Component } = $props();

  // svelte-ignore state_referenced_locally
  setOpenFeatureScope(scope);
</script>

<Probe />
