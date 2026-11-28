import type { Provider } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { useOpenFeatureClient } from './use-open-feature-client';

export function useOpenFeatureProvider(): Provider {
  const client = useOpenFeatureClient();
  return OpenFeature.getProvider(client.metadata.domain);
}
