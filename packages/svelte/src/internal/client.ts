import type { Client } from '@openfeature/web-sdk';
import { OpenFeature, withFrameworkMetadata } from '@openfeature/web-sdk';
import type { NormalizedOptions } from '../options';
import { normalizeOptions } from './options';
import { getScope } from './scope';

/**
 * Resolves the client for the current scope, falling back to the default client.
 * @internal
 * @returns {Client} svelte-aware client
 */
export function resolveClient(): Client {
  return getScope()?.client ?? withFrameworkMetadata(OpenFeature.getClient(), 'svelte');
}

/**
 * Normalized options of the enclosing scope, see {@link normalizeOptions}.
 * @internal
 * @returns {NormalizedOptions} normalized scope options
 */
export function resolveScopeOptions(): NormalizedOptions {
  return normalizeOptions(getScope()?.options);
}
