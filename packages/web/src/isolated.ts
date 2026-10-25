/**
 * @module @openfeature/web-sdk/isolated
 * Provides non-singleton OpenFeature API instances for micro-frontend architectures.
 * WARNING: This module provides non-singleton instances that do NOT share state
 * with the global OpenFeature singleton. Only use this in micro-frontend
 * architectures where isolation is explicitly required.
 * @example
 * ```typescript
 * import { createIsolatedOpenFeatureAPI } from '@openfeature/web-sdk/isolated';
 *
 * const MyOpenFeature = createIsolatedOpenFeatureAPI();
 * MyOpenFeature.setProvider(myProvider);
 * const client = MyOpenFeature.getClient();
 * ```
 */

import { OpenFeatureAPIBase } from './open-feature-base';

/**
 * An isolated (non-singleton) OpenFeature API instance.
 * This class is NOT exported from the main entry point.
 * @internal
 */
class OpenFeatureIsolatedAPIImpl extends OpenFeatureAPIBase {
  constructor() {
    super();
  }
}

/**
 * Creates a new isolated OpenFeature API instance.
 * Each instance has its own providers, context, hooks, and event handlers.
 * State is NOT shared with the global singleton or other isolated instances.
 * @returns {OpenFeatureIsolatedAPI} A new isolated OpenFeature API instance
 * @example
 * ```typescript
 * import { createIsolatedOpenFeatureAPI } from '@openfeature/web-sdk/isolated';
 *
 * // Create an isolated instance for this micro-frontend
 * const MyOpenFeature = createIsolatedOpenFeatureAPI();
 *
 * // Configure it independently of the global singleton
 * MyOpenFeature.setProvider(myProvider);
 * await MyOpenFeature.setContext({ user: 'micro-frontend-user' });
 *
 * // Get a client from the isolated instance
 * const client = MyOpenFeature.getClient();
 * ```
 */
export function createIsolatedOpenFeatureAPI(): OpenFeatureIsolatedAPI {
  return new OpenFeatureIsolatedAPIImpl();
}

/**
 * Type alias for an isolated OpenFeature API instance.
 * This is the same interface as the base OpenFeature API.
 */
export type OpenFeatureIsolatedAPI = OpenFeatureAPIBase;
