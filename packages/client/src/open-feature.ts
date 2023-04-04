import {
  ApiEvents,
  EvaluationContext,
  FlagValue,
  Logger,
  OpenFeatureCommonAPI,
  ProviderEvents,
  ProviderMetadata,
  SafeLogger,
} from '@openfeature/shared';
import { OpenFeatureClient } from './client';
import { NOOP_PROVIDER } from './no-op-provider';
import { Client, Hook, OpenFeatureEventEmitter, Provider } from './types';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI {

  private _apiEvents = new OpenFeatureEventEmitter();
  private _providerReady = false;
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
      this._providerReady = false;

      if (!this._provider.events) {
        this._provider.events = new OpenFeatureEventEmitter();
      }

      if (typeof this._provider?.initialize === 'function') {
        this._provider.initialize?.(this._context)?.then(() => {
          this._providerReady = true;
          this._provider.events?.emit(ProviderEvents.Ready);
        })?.catch(() => {
          this._provider.events?.emit(ProviderEvents.Error);
        });
      } else {
        this._providerReady = true;
        this._provider.events?.emit(ProviderEvents.Ready);
      }
      this._apiEvents.emit(ApiEvents.ProviderChanged);
      oldProvider?.onClose?.();
    }
    return this;
  }

  async close(): Promise<void> {
    await this?._provider?.onClose?.();
  }

  getClient(name?: string, version?: string): Client {
    return new OpenFeatureClient(
      // functions are passed here to make sure that these values are always up to date,
      // and so we don't have to make these public properties on the API class. 
      () => this._provider,
      () => this._providerReady,
      () => this._apiEvents,
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
