import React from 'react';
import { Context } from '../internal';
import { OpenFeature } from '@openfeature/web-sdk';
import type { Provider } from '@openfeature/web-sdk';
import { MissingContextError } from '../internal/errors';

/**
 * Get the {@link Provider} bound to the domain specified in the OpenFeatureProvider context.
 * Note that it isn't recommended to interact with the provider directly, but rather through
 * an OpenFeature client.
 * @returns {Provider} provider for this scope
 */
export function useOpenFeatureProvider(): Provider {
  const openFeatureContext = React.useContext(Context);

  if (!openFeatureContext) {
    throw new MissingContextError('No OpenFeature context available');
  }

  return OpenFeature.getProvider(openFeatureContext.domain);
}
