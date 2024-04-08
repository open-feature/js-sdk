import React from 'react';
import { Context } from './context';
import { Client } from '@openfeature/web-sdk';

/**
 * Get the {@link Client} instance for this OpenFeatureProvider context.
 * Note that the provider to which this is bound is determined by the OpenFeatureProvider's domain.
 * @returns {Client} client for this scope
 */
export function useOpenFeatureClient(): Client {
  const { client } = React.useContext(Context) || {};

  if (!client) {
    throw new Error(
      'No OpenFeature client available - components using OpenFeature must be wrapped with an <OpenFeatureProvider>',
    );
  }

  return client;
}
