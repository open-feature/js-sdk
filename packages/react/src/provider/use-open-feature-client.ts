import React from 'react';
import { Context } from './context';

/**
 * Get the {@link Client} instance for this OpenFeatureProvider context.
 * Note that the provider to which this is bound is determined by the OpenFeatureProvider's domain.
 * @returns Client
 */
export function useOpenFeatureClient() {
  const { client } = React.useContext(Context) || {};

  if (!client) {
    throw new Error(
      'No OpenFeature client available - components using OpenFeature must be wrapped with an <OpenFeatureProvider>',
    );
  }

  return client;
}
