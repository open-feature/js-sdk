import React from 'react';
import { Context } from '../internal';
import { type Client } from '@openfeature/web-sdk';
import { MissingContextError } from '../internal/errors';

/**
 * Get the {@link Client} instance for this OpenFeatureProvider context.
 * Note that the provider to which this is bound is determined by the OpenFeatureProvider's domain.
 * @returns {Client} client for this scope
 */
export function useOpenFeatureClient(): Client {
  const { client } = React.useContext(Context) || {};

  if (!client) {
    throw new MissingContextError('No OpenFeature client available');
  }

  return client;
}
