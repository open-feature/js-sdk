import { NOOP_PROVIDER } from './no-op-provider';
import { Logger, OpenFeatureCommonAPI, SafeLogger } from '@openfeature/shared';
import { EvaluationContext, FlagValue, ProviderMetadata } from '@openfeature/shared';
import { OpenFeatureClient } from './client';
import { Client, Hook, Provider } from './types';
import { objectOrUndefined, stringOrUndefined } from '@openfeature/shared/src/type-guards';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js.api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI {
  protected _hooks: Hook[] = [];
  protected _defaultProvider: Provider = NOOP_PROVIDER;
  protected _providers: Map<string, Provider> = new Map();

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
   * @returns {ProviderMetadata} Provider Metadata
   */
  get providerMetadata(): ProviderMetadata {
    return this._defaultProvider.metadata;
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

  /**
   * Sets the default provider for flag evaluations.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  setProvider(provider: Provider): this;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations of clients with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   * @param {string} clientName The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {OpenFeatureAPI} OpenFeature API
   */
  setProvider(clientName: string, provider: Provider): this;
  setProvider(clientOrProvider?: string | Provider, providerOrUndefined?: Provider): this {
    const clientName = stringOrUndefined(clientOrProvider);
    const provider = objectOrUndefined<Provider>(clientOrProvider) ?? objectOrUndefined<Provider>(providerOrUndefined);

    if (!provider) {
      return this;
    }

    if (clientName) {
      this._providers.set(clientName, provider);
    } else {
      this._defaultProvider = provider;
    }

    return this;
  }

  /**
   * A factory function for creating new unnamed OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * All unnamed clients use the same provider set via {@link this.setProvider setProvider}.
   * @param {string} name The name of the client
   * @param {string} version The version of the client (only used for metadata)
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(context?: EvaluationContext): Client;
  /**
   * A factory function for creating new named OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that name.
   * @param {string} name The name of the client
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(name: string, context?: EvaluationContext): Client;
  /**
   * A factory function for creating new named OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that name.
   * @param {string} name The name of the client
   * @param {string} version The version of the client (only used for metadata)
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(name: string, version: string, context?: EvaluationContext): Client;
  getClient(
    nameOrContext?: string | EvaluationContext,
    versionOrContext?: string | EvaluationContext,
    contextOrUndefined?: EvaluationContext
  ): Client {
    const name = stringOrUndefined(nameOrContext);
    const version = stringOrUndefined(versionOrContext);
    const context =
      objectOrUndefined<EvaluationContext>(nameOrContext) ??
      objectOrUndefined<EvaluationContext>(versionOrContext) ??
      objectOrUndefined<EvaluationContext>(contextOrUndefined);

    return new OpenFeatureClient(
      () => this.getProviderForClient.bind(this)(name),
      () => this._logger,
      { name, version },
      context
    );
  }

  private getProviderForClient(name?: string): Provider {
    if (!name) {
      return this._defaultProvider;
    }

    return this._providers.get(name) ?? this._defaultProvider;
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
