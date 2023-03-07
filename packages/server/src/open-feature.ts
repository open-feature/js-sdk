import { NOOP_PROVIDER } from './no-op-provider';
import { Logger, OpenFeatureCommonAPI, SafeLogger } from '@openfeature/shared';
import { EvaluationContext, FlagValue, ProviderMetadata } from '@openfeature/shared';
import { OpenFeatureClient } from './client';
import { Client, Hook, Provider } from './types';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI {
  protected _hooks: Hook[] = [];
  protected _provider: Provider = NOOP_PROVIDER;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {
    super();
  }

  setLogger(logger: Logger): this {
    this._logger = new SafeLogger(logger);
    return this;
  }

  /**
   * Gets a singleton instance of the OpenFeature API.
   *
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

  /**
   * Get metadata about registered provider.
   *
   * @returns {ProviderMetadata} Provider Metadata
   */
  get providerMetadata(): ProviderMetadata {
    return this._provider.metadata;
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

  setContext(context: EvaluationContext): this {
    this._context = context;
    return this;
  }

  setProvider(provider: Provider): this {
    // ignore no-ops
    if (this._provider !== provider) {
      this._provider = provider;
    }
    return this;
  }

  getClient(name?: string, version?: string, context?: EvaluationContext): Client {
    return new OpenFeatureClient(
      () => this._provider,
      () => this._logger,
      { name, version },
      context
    );
  }
}

/**
 * A singleton instance of the OpenFeature API.
 *
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
