import { OpenFeatureClient } from './client';
import { DefaultLogger, SafeLogger } from './logger';
import { NOOP_PROVIDER } from './no-op-provider';
import { Client, EvaluationContext, FlagValue, GlobalApi, Hook, Logger, Provider, ProviderMetadata } from './types';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

class OpenFeatureAPI implements GlobalApi {
  private _provider: Provider = NOOP_PROVIDER;
  private _context: EvaluationContext = {};
  private _hooks: Hook[] = [];
  private _logger: Logger = new DefaultLogger();

  static getInstance(): OpenFeatureAPI {
    const globalApi = _globalThis[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeatureAPI();
    _globalThis[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }

  setLogger(logger: Logger): OpenFeatureAPI {
    this._logger = new SafeLogger(logger);
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

  /**
   * Get metadata about registered provider.
   *
   * @returns {ProviderMetadata} Provider Metadata
   */
  get providerMetadata(): ProviderMetadata {
    return this._provider.metadata;
  }

  addHooks(...hooks: Hook<FlagValue>[]): OpenFeatureAPI {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  getHooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  clearHooks(): OpenFeatureAPI {
    this._hooks = [];
    return this;
  }

  setProvider(provider: Provider): OpenFeatureAPI {
    this._provider = provider;
    return this;
  }

  setContext(context: EvaluationContext): OpenFeatureAPI {
    this._context = context;
    return this;
  }

  getContext(): EvaluationContext {
    return this._context;
  }
}

export const OpenFeature = OpenFeatureAPI.getInstance();
