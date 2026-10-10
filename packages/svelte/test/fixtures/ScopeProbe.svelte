<script lang="ts">
  import { useOpenFeatureClient, useOpenFeatureProvider } from '../../src';

  // svelte-ignore state_referenced_locally
  const client = useOpenFeatureClient();
  const provider = useOpenFeatureProvider();
</script>

<span data-testid="domain">{client.metadata.domain ?? 'default'}</span>
<span data-testid="framework">{client.metadata.framework ?? 'none'}</span>
<span data-testid="provider">{provider.metadata.name}</span>
