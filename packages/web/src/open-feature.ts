import { OpenFeatureAPIBase } from './open-feature-base';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/web-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};

const _globalThis = globalThis as OpenFeatureGlobal;

/**
 * The OpenFeatureAPI is the entry point for the OpenFeature SDK.
 * This is a singleton class that provides access to the global OpenFeature API instance.
 *
 * For isolated (non-singleton) instances, use the `createIsolatedOpenFeatureAPI` function
 * from `@openfeature/web-sdk/isolated`.
 */
export class OpenFeatureAPI extends OpenFeatureAPIBase {
  private constructor() {
    super();
  }

  /**
   * Gets a singleton instance of the OpenFeature API.
   * @ignore
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  static getInstance(): OpenFeatureAPI {
    const globalApi = _globalThis[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeatureAPI();
    _globalThis[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
