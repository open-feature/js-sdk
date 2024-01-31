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
type DomainRecord = {
  domain?: string;
  provider: Provider;
};

const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI extends OpenFeatureCommonAPI<Provider, Hook> implements ManageContext<Promise<void>> {
  protected _events: GenericEventEmitter<ProviderEvents> = new OpenFeatureEventEmitter();
  protected _defaultProvider: Provider = NOOP_PROVIDER;
  protected _createEventEmitter = () => new OpenFeatureEventEmitter();
  protected _domainScopedContext: Map<string, EvaluationContext> = new Map();

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
   * This will be used by all providers that have not bound to a domain.
   * @param {EvaluationContext} context Evaluation context
   * @example
   * await OpenFeature.setContext({ region: "us" });
   */
  async setContext(context: EvaluationContext): Promise<void>;
  /**
   * Sets the evaluation context for a specific provider.
   * This will only affect providers bound to a domain.
   * @param {string} domain An identifier which logically binds clients with providers
   * @param {EvaluationContext} context Evaluation context
   * @example
   * await OpenFeature.setContext("test", { scope: "provider" });
   * OpenFeature.setProvider(new MyProvider()) // Uses the default context
   * OpenFeature.setProvider("test", new MyProvider()) // Uses context: { scope: "provider" }
   */
  async setContext(domain: string, context: EvaluationContext): Promise<void>;
  async setContext<T extends EvaluationContext>(domainOrContext: T | string, contextOrUndefined?: T): Promise<void> {
    const domain = stringOrUndefined(domainOrContext);
    const context = objectOrUndefined<T>(domainOrContext) ?? objectOrUndefined(contextOrUndefined) ?? {};

    if (domain) {
      const provider = this._domainScopedProviders.get(domain);
      if (provider) {
        const oldContext = this.getContext(domain);
        this._domainScopedContext.set(domain, context);
        await this.runProviderContextChangeHandler(domain, provider, oldContext, context);
      } else {
        this._domainScopedContext.set(domain, context);
      }
    } else {
      const oldContext = this._context;
      this._context = context;

      // collect all providers that are using the default context (not bound to a domain)
      const unboundProviders: DomainRecord[] = Array.from(this._domainScopedProviders.entries())
        .filter(([domain]) => !this._domainScopedContext.has(domain))
        .reduce<DomainRecord[]>((acc, [domain, provider]) => {
          acc.push({ domain, provider });
          return acc;
        }, []);

      const allProviders: DomainRecord[] = [
        // add in the default (no domain)
        { domain: undefined, provider: this._defaultProvider },
        ...unboundProviders,
      ];
      await Promise.all(
        allProviders.map((tuple) =>
          this.runProviderContextChangeHandler(tuple.domain, tuple.provider, oldContext, context),
        ),
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
   * @param {string} domain An identifier which logically binds clients with providers
   * @returns {EvaluationContext} Evaluation context
   */
  getContext(domain?: string): EvaluationContext;
  getContext(domainOrUndefined?: string): EvaluationContext {
    const domain = stringOrUndefined(domainOrUndefined);
    if (domain) {
      const context = this._domainScopedContext.get(domain);
      if (context) {
        return context;
      } else {
        this._logger.debug(`Unable to find context for '${domain}'.`);
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
   * @param {string} domain An identifier which logically binds clients with providers
   */
  clearContext(domain: string): Promise<void>;
  async clearContext(domainOrUndefined?: string): Promise<void> {
    const domain = stringOrUndefined(domainOrUndefined);
    if (domain) {
      const provider = this._domainScopedProviders.get(domain);
      if (provider) {
        const oldContext = this.getContext(domain);
        this._domainScopedContext.delete(domain);
        const newContext = this.getContext();
        await this.runProviderContextChangeHandler(domain, provider, oldContext, newContext);
      } else {
        this._domainScopedContext.delete(domain);
      }
    } else {
      return this.setContext({});
    }
  }

  /**
   * Resets the global evaluation context and removes the evaluation context for
   * all domains.
   */
  async clearContexts(): Promise<void> {
    // Default context must be cleared first to avoid calling the onContextChange
    // handler multiple times for clients bound to a domain.
    await this.clearContext();

    // Use allSettled so a promise rejection doesn't affect others
    await Promise.allSettled(Array.from(this._domainScopedProviders.keys()).map((domain) => this.clearContext(domain)));
  }

  /**
   * A factory function for creating new named OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that name.
   * @param {string} domain An identifier which logically binds clients with providers
   * @param {string} version The version of the client (only used for metadata)
   * @returns {Client} OpenFeature Client
   */
  getClient(domain?: string, version?: string): Client {
    return new OpenFeatureClient(
      // functions are passed here to make sure that these values are always up to date,
      // and so we don't have to make these public properties on the API class.
      () => this.getProviderForClient(domain),
      () => this.buildAndCacheEventEmitterForClient(domain),
      () => this._logger,
      { domain, version },
    );
  }

  /**
   * Clears all registered providers and resets the default provider.
   * @returns {Promise<void>}
   */
  async clearProviders(): Promise<void> {
    await super.clearProvidersAndSetDefault(NOOP_PROVIDER);
    this._domainScopedContext.clear();
  }

  private async runProviderContextChangeHandler(
    domain: string | undefined,
    provider: Provider,
    oldContext: EvaluationContext,
    newContext: EvaluationContext,
  ): Promise<void> {
    const providerName = provider.metadata.name;
    try {
      await provider.onContextChange?.(oldContext, newContext);

      // only run the event handlers if the onContextChange method succeeded
      this.getAssociatedEventEmitters(domain).forEach((emitter) => {
        emitter?.emit(ProviderEvents.ContextChanged, { clientName: domain, providerName });
      });
      this._events?.emit(ProviderEvents.ContextChanged, { clientName: domain, providerName });
    } catch (err) {
      // run error handlers instead
      const error = err as Error | undefined;
      const message = `Error running ${provider?.metadata?.name}'s context change handler: ${error?.message}`;
      this._logger?.error(`${message}`, err);
      this.getAssociatedEventEmitters(domain).forEach((emitter) => {
        emitter?.emit(ProviderEvents.Error, { clientName: domain, providerName, message });
      });
      this._events?.emit(ProviderEvents.Error, { clientName: domain, providerName, message });
    }
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
