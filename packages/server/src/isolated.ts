/**
 * @module @openfeature/server-sdk/isolated
 * Provides non-singleton OpenFeature API instances for testing and multi-tenant scenarios.
 * WARNING: This module provides non-singleton instances that do NOT share state
 * with the global OpenFeature singleton. Only use this when isolation is explicitly required.
 * @example
 * ```typescript
 * import { createIsolatedOpenFeatureAPI } from '@openfeature/server-sdk/isolated';
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
 * Each instance has its own providers, context, hooks, event handlers, and transaction context propagator.
 * State is NOT shared with the global singleton or other isolated instances.
 * @returns {OpenFeatureIsolatedAPI} A new isolated OpenFeature API instance
 * @example
 * ```typescript
 * import { createIsolatedOpenFeatureAPI } from '@openfeature/server-sdk/isolated';
 *
 * // Create an isolated instance for testing
 * const TestOpenFeature = createIsolatedOpenFeatureAPI();
 *
 * // Configure it independently of the global singleton
 * TestOpenFeature.setProvider(mockProvider);
 * TestOpenFeature.setContext({ environment: 'test' });
 *
 * // Get a client from the isolated instance
 * const client = TestOpenFeature.getClient();
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
