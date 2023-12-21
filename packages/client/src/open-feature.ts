import {
  EvaluationContext,
  GenericEventEmitter,
  ManageContext,
  OpenFeatureCommonAPI,
  objectOrUndefined,
  stringOrUndefined,
} from '@openfeature/core';
import { Client, OpenFeatureClient } from './client';
import { OpenFeatureEventEmitter, ProviderEvents } from './events';
import { Hook } from './hooks';
import { NOOP_PROVIDER, Provider } from './provider';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/web-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI<Provider, Hook> implements ManageContext<Promise<void>> {
  protected _events: GenericEventEmitter<ProviderEvents> = new OpenFeatureEventEmitter();
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
        await this.runProviderContextChangeHandler(clientName, provider, oldContext, context);
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
        allProviders.map((provider) => this.runProviderContextChangeHandler(undefined, provider, oldContext, context)),
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
  getContext(clientName: string): EvaluationContext;
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
        await this.runProviderContextChangeHandler(clientName, provider, oldContext, newContext);
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
    clientName: string | undefined,
    provider: Provider,
    oldContext: EvaluationContext,
    newContext: EvaluationContext,
  ): Promise<void> {
      const providerName = provider.metadata.name;
      return provider.onContextChange?.(oldContext, newContext).then(() => {
        this.getAssociatedEventEmitters(clientName).forEach((emitter) => {
          emitter?.emit(ProviderEvents.ContextChanged, { clientName, providerName });
        });
        this._events?.emit(ProviderEvents.ContextChanged, { clientName, providerName });
      }).catch((err) => {
        this._logger?.error(`Error running ${provider.metadata.name}'s context change handler:`, err);
        this.getAssociatedEventEmitters(clientName).forEach((emitter) => {
          emitter?.emit(ProviderEvents.Error, { clientName, providerName, message: err?.message, });
        });
        this._events?.emit(ProviderEvents.Error, { clientName, providerName, message: err?.message, });
      });
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
