import { EvaluationContext, FlagValue, Logger, OpenFeatureCommonAPI, SafeLogger } from '@openfeature/shared';
import { OpenFeatureClient } from './client';
import { NOOP_PROVIDER } from './no-op-provider';
import { Client, Hook, Provider } from './types';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI<Provider> {
  protected _hooks: Hook[] = [];
  protected _defaultProvider: Provider = NOOP_PROVIDER;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
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

  setLogger(logger: Logger): this {
    this._logger = new SafeLogger(logger);
    return this;
  }

  addHooks(...hooks: Hook<FlagValue>[]): this {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  getHooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  clearHooks(): this {
    this._hooks = [];
    return this;
  }

  async setContext(context: EvaluationContext): Promise<void> {
    const oldContext = this._context;
    this._context = context;
    await this._defaultProvider?.onContextChange?.(oldContext, context);
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
      () => this.getEventEmitterForClient(name),
      () => this._logger,
      { name, version }
    );
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
