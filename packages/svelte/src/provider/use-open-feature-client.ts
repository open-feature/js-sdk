import type { Client } from '@openfeature/web-sdk';
import { resolveClient } from '../internal/client';

/**
 * Get the {@link Client} instance for the enclosing scope (see `setOpenFeatureScope`).
 * Note that the provider to which this is bound is determined by the scope's domain.
 * Falls back to the default client when called without a scope, or outside a component.
 * @returns {Client} client for this scope
 */
export function useOpenFeatureClient(): Client {
  return resolveClient();
}
