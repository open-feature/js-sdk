<script lang="ts">
  import { useOpenFeatureClient } from '../../src';

  const domainOf = () => useOpenFeatureClient().metadata.domain ?? 'default';

  const fromDerived = $derived(domainOf());
  let fromEffect = $state('');
  let fromHandler = $state('');
  $effect(() => {
    fromEffect = domainOf();
  });
</script>

<span data-testid="derived">{fromDerived}</span>
<span data-testid="effect">{fromEffect}</span>
<span data-testid="handler">{fromHandler}</span>
<button onclick={() => (fromHandler = domainOf())}>probe</button>
