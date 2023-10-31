import { EvaluationContext, ManageContext, OpenFeatureCommonAPI } from '@openfeature/core';
import { Client, OpenFeatureClient } from './client';
import { NOOP_PROVIDER, Provider } from './provider';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/web-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI<Provider> implements ManageContext<Promise<void>> {
  protected _defaultProvider: Provider = NOOP_PROVIDER;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
    super('client');
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

  async setContext(context: EvaluationContext): Promise<void> {
    const oldContext = this._context;
    this._context = context;

    const allProviders = [this._defaultProvider, ...this._clientProviders.values()];
    await Promise.all(
      allProviders.map(async (provider) => {
        try {
          return await provider.onContextChange?.(oldContext, context);
        } catch (err) {
          this._logger?.error(`Error running context change handler of provider ${provider.metadata.name}:`, err);
        }
      })
    );
  }

  getContext(): EvaluationContext {
    return this._context;
  }

  /**
   * A factory function for creating new named OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that name.
   * @param {string} name The name of the client
   * @param {string} version The version of the client (only used for metadata)
   * @returns {Client} OpenFeature Client
   */
  getClient(name?: string, version?: string): Client {
    return new OpenFeatureClient(
      // functions are passed here to make sure that these values are always up to date,
      // and so we don't have to make these public properties on the API class.
      () => this.getProviderForClient(name),
      () => this.buildAndCacheEventEmitterForClient(name),
      () => this._logger,
      { name, version }
    );
  }

  /**
   * Clears all registered providers and resets the default provider.
   * @returns {Promise<void>}
   */
  clearProviders(): Promise<void> {
    return super.clearProvidersAndSetDefault(NOOP_PROVIDER);
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
