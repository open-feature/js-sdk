import {
  EvaluationContext,
  ManageContext,
  OpenFeatureCommonAPI,
  objectOrUndefined,
  stringOrUndefined,
} from '@openfeature/core';
import { Client, OpenFeatureClient } from './client';
import { NOOP_PROVIDER, Provider } from './provider';
import { OpenFeatureEventEmitter } from './events';
import { Hook } from './hooks';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/web-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI<Provider, Hook> implements ManageContext<Promise<void>> {
  protected _events = new OpenFeatureEventEmitter();
  protected _defaultProvider: Provider = NOOP_PROVIDER;
  protected _createEventEmitter = () => new OpenFeatureEventEmitter();
  protected _namedProviderContext: Map<string, EvaluationContext> = new Map();

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

  /**
   * Sets the default provider for flag evaluations and returns a promise that resolves when the provider is ready.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {Promise<void>}
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  setProviderAndWait(provider: Provider): Promise<void>;
  /**
   * Sets the default provider and evaluation context for flag evaluations and returns a promise that resolves when the provider is ready.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param {EvaluationContext} context The evaluation context to use for flag evaluations.
   * @returns {Promise<void>}
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  setProviderAndWait(provider: Provider, context: EvaluationContext): Promise<void>;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations of providers with the given name.
   * A promise is returned that resolves when the provider is ready.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   * @param {string} clientName The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {Promise<void>}
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  setProviderAndWait(clientName: string, provider: Provider): Promise<void>;
  /**
   * Sets the provider and evaluation context for flag evaluations of providers with the given name.
   * A promise is returned that resolves when the provider is ready.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   * @param {string} clientName The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param {EvaluationContext} context The evaluation context to use for flag evaluations.
   * @returns {Promise<void>}
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  setProviderAndWait(clientName: string, provider: Provider, context: EvaluationContext): Promise<void>;
  async setProviderAndWait(
    clientOrProvider?: string | Provider,
    providerContextOrUndefined?: Provider | EvaluationContext,
    contextOrUndefined?: EvaluationContext,
  ): Promise<void> {
    const clientName = stringOrUndefined(clientOrProvider);
    const provider = clientName
      ? objectOrUndefined<Provider>(providerContextOrUndefined)
      : objectOrUndefined<Provider>(clientOrProvider);
    const context = clientName
      ? objectOrUndefined<EvaluationContext>(contextOrUndefined)
      : objectOrUndefined<EvaluationContext>(providerContextOrUndefined);

    if (context) {
      if (clientName) {
        this.setContext(clientName, context);
      } else {
        this.setContext(context);
      }
    }

    await this.setAwaitableProvider(clientName, provider, this.getContext(clientName));
  }

  /**
   * Sets the default provider for flag evaluations.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(provider: Provider): this;
  /**
   * Sets the default provider and evaluation context for flag evaluations.
   * This provider will be used by unnamed clients and named clients to which no provider is bound.
   * Settings a provider supersedes the current provider used in new and existing clients without a name.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param context {EvaluationContext} The evaluation context to use for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(provider: Provider, context: EvaluationContext): this;
  /**
   * Sets the provider for flag evaluations of providers with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   * @param {string} clientName The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(clientName: string, provider: Provider): this;
  /**
   * Sets the provider and evaluation context flag evaluations of providers with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   * @param {string} clientName The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param context {EvaluationContext} The evaluation context to use for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(clientName: string, provider: Provider, context: EvaluationContext): this;
  setProvider(
    clientOrProvider?: string | Provider,
    providerContextOrUndefined?: Provider | EvaluationContext,
    contextOrUndefined?: EvaluationContext,
  ): this {
    const clientName = stringOrUndefined(clientOrProvider);
    const provider = clientName
      ? objectOrUndefined<Provider>(providerContextOrUndefined)
      : objectOrUndefined<Provider>(clientOrProvider);
    const context = clientName
      ? objectOrUndefined<EvaluationContext>(contextOrUndefined)
      : objectOrUndefined<EvaluationContext>(providerContextOrUndefined);

    if (context) {
      if (clientName) {
        this.setContext(clientName, context);
      } else {
        this.setContext(context);
      }
    }

    this.catchPromiseErrors(this.setAwaitableProvider(clientName, provider, this.getContext(clientName)));
    return this;
  }

  /**
   * Sets the evaluation context globally.
   * This will be used by all providers that have not been overridden with a named client.
   * @param {EvaluationContext} context Evaluation context
   * @example
   * await OpenFeature.setContext({ region: "us" });
   */
  async setContext(context: EvaluationContext): Promise<void>;
  /**
   * Sets the evaluation context for a specific provider.
   * This will only affect providers with a matching client name.
   * @param {string} clientName The name to identify the client
   * @param {EvaluationContext} context Evaluation context
   * @example
   * await OpenFeature.setContext("test", { scope: "provider" });
   * OpenFeature.setProvider(new MyProvider()) // Uses the default context
   * OpenFeature.setProvider("test", new MyProvider()) // Uses context: { scope: "provider" }
   */
  async setContext(clientName: string, context: EvaluationContext): Promise<void>;
  async setContext<T extends EvaluationContext>(nameOrContext: T | string, contextOrUndefined?: T): Promise<void> {
    const clientName = stringOrUndefined(nameOrContext);
    const context = objectOrUndefined<T>(nameOrContext) ?? objectOrUndefined(contextOrUndefined) ?? {};

    if (clientName) {
      const provider = this._clientProviders.get(clientName);
      if (provider) {
        const oldContext = this.getContext(clientName);
        this._namedProviderContext.set(clientName, context);
        await this.runProviderContextChangeHandler(provider, oldContext, context);
      } else {
        this._namedProviderContext.set(clientName, context);
      }
    } else {
      const oldContext = this._context;
      this._context = context;

      const providersWithoutContextOverride = Array.from(this._clientProviders.entries())
        .filter(([name]) => !this._namedProviderContext.has(name))
        .reduce<Provider[]>((acc, [, provider]) => {
          acc.push(provider);
          return acc;
        }, []);

      const allProviders = [this._defaultProvider, ...providersWithoutContextOverride];
      await Promise.all(
        allProviders.map((provider) => this.runProviderContextChangeHandler(provider, oldContext, context)),
      );
    }
  }

  /**
   * Access the global evaluation context.
   * @returns {EvaluationContext} Evaluation context
   */
  getContext(): EvaluationContext;
  /**
   * Access the evaluation context for a specific named client.
   * The global evaluation context is returned if a matching named client is not found.
   * @param {string} clientName The name to identify the client
   * @returns {EvaluationContext} Evaluation context
   */
  getContext(clientName: string | undefined): EvaluationContext;
  getContext(nameOrUndefined?: string): EvaluationContext {
    const clientName = stringOrUndefined(nameOrUndefined);
    if (clientName) {
      const context = this._namedProviderContext.get(clientName);
      if (context) {
        return context;
      } else {
        this._logger.debug(`Unable to find context for '${clientName}'.`);
      }
    }
    return this._context;
  }

  /**
   * Resets the global evaluation context to an empty object.
   */
  clearContext(): Promise<void>;
  /**
   * Removes the evaluation context for a specific named client.
   * @param {string} clientName The name to identify the client
   */
  clearContext(clientName: string): Promise<void>;
  async clearContext(nameOrUndefined?: string): Promise<void> {
    const clientName = stringOrUndefined(nameOrUndefined);
    if (clientName) {
      const provider = this._clientProviders.get(clientName);
      if (provider) {
        const oldContext = this.getContext(clientName);
        this._namedProviderContext.delete(clientName);
        const newContext = this.getContext();
        await this.runProviderContextChangeHandler(provider, oldContext, newContext);
      } else {
        this._namedProviderContext.delete(clientName);
      }
    } else {
      return this.setContext({});
    }
  }

  /**
   * Resets the global evaluation context and removes the evaluation context for
   * all named clients.
   */
  async clearContexts(): Promise<void> {
    // Default context must be cleared first to avoid calling the onContextChange
    // handler multiple times for named clients.
    await this.clearContext();

    // Use allSettled so a promise rejection doesn't affect others
    await Promise.allSettled(Array.from(this._clientProviders.keys()).map((name) => this.clearContext(name)));
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
      { name, version },
    );
  }

  /**
   * Clears all registered providers and resets the default provider.
   * @returns {Promise<void>}
   */
  async clearProviders(): Promise<void> {
    await super.clearProvidersAndSetDefault(NOOP_PROVIDER);
    this._namedProviderContext.clear();
  }

  private async runProviderContextChangeHandler(
    provider: Provider,
    oldContext: EvaluationContext,
    newContext: EvaluationContext,
  ): Promise<void> {
    try {
      return await provider.onContextChange?.(oldContext, newContext);
    } catch (err) {
      this._logger?.error(`Error running ${provider.metadata.name}'s context change handler:`, err);
    }
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
