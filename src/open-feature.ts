import { OpenFeatureClient } from './client';
import { DefaultLogger, SafeLogger } from './logger';
import { NOOP_PROVIDER } from './no-op-provider';
import { Client, EvaluationContext, FlagValue, GlobalApi, Hook, Logger, Provider, ProviderMetadata } from './types';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _global = global as OpenFeatureGlobal;

class OpenFeatureAPI implements GlobalApi {
  private _provider: Provider = NOOP_PROVIDER;
  private _context: EvaluationContext = {};
  private _hooks: Hook[] = [];
  private _logger: Logger = new DefaultLogger();

  static getInstance(): OpenFeatureAPI {
    const globalApi = _global[GLOBAL_OPENFEATURE_API_KEY];
    if (globalApi) {
      return globalApi;
    }

    const instance = new OpenFeatureAPI();
    _global[GLOBAL_OPENFEATURE_API_KEY] = instance;
    return instance;
  }

  /**
   * Sets a logger that used globally within OpenFeature. This logger supersedes
   * to the default logger and is passed to various components in the SDK. The
   * global logger can be overridden per client.
   *
   * @param {Logger} logger The logger to to be used
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  setLogger(logger: Logger): OpenFeatureAPI {
    this._logger = new SafeLogger(logger);
    return this;
  }

  /**
   * A factory function for creating new OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * @param {string} name The name of the client
   * @param {string} version The version of the client
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
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

  /**
   * Adds global hooks that will always run during a flag evaluation. Global
   * hooks are executed in the order that they were registered. Adding additional
   * hooks will not remove existing hooks.
   *
   * @param {Hook<FlagValue>[]} hooks A list of hooks that should always run
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  addHooks(...hooks: Hook<FlagValue>[]): OpenFeatureAPI {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  /**
   * Access all the hooks that are globally registered.
   *
   * @returns {Hook<FlagValue>[]} A list of the global hooks
   */
  getHooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  /**
   * Clears all the globally registered hooks.
   *
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  clearHooks(): OpenFeatureAPI {
    this._hooks = [];
    return this;
  }

  /**
   * Sets the provider that OpenFeature will use for flag evaluations. Setting
   * a provider supersedes the current provider used in new and existing clients.
   *
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  setProvider(provider: Provider): OpenFeatureAPI {
    this._provider = provider;
    return this;
  }

  /**
   * Sets a global evaluation context that will be used during all flag evaluations.
   * This is useful for evaluation context properties that are static (e.g. region,
   * environment, hostname).
   *
   * @param {EvaluationContext} context Global evaluation context
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  setContext(context: EvaluationContext): OpenFeatureAPI {
    this._context = context;
    return this;
  }

  /**
   * Access the global evaluation context.
   *
   * @returns {EvaluationContext} Global evaluation context
   */
  getContext(): EvaluationContext {
    return this._context;
  }
}

export const OpenFeature = OpenFeatureAPI.getInstance();
