import { NOOP_PROVIDER } from './no-op-provider';
import { Logger, OpenFeatureCommonAPI, SafeLogger } from '@openfeature/shared';
import { ApiEvents, EvaluationContext, FlagValue, ProviderMetadata } from '@openfeature/shared';
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
    await this._provider?.onContextChange?.(oldContext, context);
  }

  setProvider(provider: Provider): OpenFeatureCommonAPI {
    // ignore no-ops
    if (this._provider !== provider) {
      const oldProvider = this._provider;
      this._provider = provider;
      window.dispatchEvent(new CustomEvent(ApiEvents.ProviderChanged));
      oldProvider?.onClose?.();
    }
    return this;
  }

  async close(): Promise<void> {
    await this?._provider?.onClose?.();
  }

  getClient(name?: string, version?: string): Client {
    return new OpenFeatureClient(
      () => this._provider,
      () => this._logger,
      { name, version },
    );
  }
}

/**
 * A singleton instance of the OpenFeature API.
 *
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
