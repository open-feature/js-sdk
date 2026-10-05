import type { Provider } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { useOpenFeatureClient } from './use-open-feature-client';

/**
 * Get the {@link Provider} bound to the domain of the enclosing scope (see `setOpenFeatureScope`).
 * Note that it isn't recommended to interact with the provider directly, but rather through
 * an OpenFeature client.
 * @returns {Provider} provider for this scope
 */
export function useOpenFeatureProvider(): Provider {
  return OpenFeature.getProvider(useOpenFeatureClient().metadata.domain);
}
