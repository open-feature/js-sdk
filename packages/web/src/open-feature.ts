import type {
  ClientProviderStatus,
  EvaluationContext,
  GenericEventEmitter,
  ManageContext} from '@openfeature/core';
import {
  OpenFeatureCommonAPI,
  ProviderWrapper,
  objectOrUndefined,
  stringOrUndefined,
} from '@openfeature/core';
import type { Client } from './client';
import { OpenFeatureClient } from './client/internal/open-feature-client';
import { OpenFeatureEventEmitter, ProviderEvents } from './events';
import type { Hook } from './hooks';
import type { Provider} from './provider';
import { NOOP_PROVIDER, ProviderStatus } from './provider';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/web-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
type DomainRecord = {
  domain?: string;
  wrapper: ProviderWrapper<Provider, ClientProviderStatus>;
};

const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI
  extends OpenFeatureCommonAPI<ClientProviderStatus, Provider, Hook>
  implements ManageContext<Promise<void>>
{
  protected _statusEnumType: typeof ProviderStatus = ProviderStatus;
  protected _apiEmitter: GenericEventEmitter<ProviderEvents> = new OpenFeatureEventEmitter();
  protected _defaultProvider: ProviderWrapper<Provider, ClientProviderStatus> = new ProviderWrapper(
    NOOP_PROVIDER,
    ProviderStatus.NOT_READY,
    this._statusEnumType,
  );
  protected _domainScopedProviders: Map<string, ProviderWrapper<Provider, ClientProviderStatus>> = new Map();
  protected _createEventEmitter = () => new OpenFeatureEventEmitter();

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

  private getProviderStatus(domain?: string): ProviderStatus {
    if (!domain) {
      return this._defaultProvider.status;
    }

    return this._domainScopedProviders.get(domain)?.status ?? this._defaultProvider.status;
  }

  /**
   * Sets the default provider for flag evaluations and returns a promise that resolves when the provider is ready.
   * This provider will be used by domainless clients and clients associated with domains to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing unbound clients.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {Promise<void>}
   * @throws {Error} If the provider throws an exception during initialization.
   */
  setProviderAndWait(provider: Provider): Promise<void>;
  /**
   * Sets the default provider for flag evaluations and returns a promise that resolves when the provider is ready.
   * This provider will be used by domainless clients and clients associated with domains to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing unbound clients.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param {EvaluationContext} context The evaluation context to use for flag evaluations.
   * @returns {Promise<void>}
   * @throws {Error} If the provider throws an exception during initialization.
   */
  setProviderAndWait(provider: Provider, context: EvaluationContext): Promise<void>;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations on clients bound to the same domain.
   * A promise is returned that resolves when the provider is ready.
   * Setting a provider supersedes the current provider used in new and existing clients bound to the same domain.
   * @param {string} domain The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {Promise<void>}
   * @throws {Error} If the provider throws an exception during initialization.
   */
  setProviderAndWait(domain: string, provider: Provider): Promise<void>;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations on clients bound to the same domain.
   * A promise is returned that resolves when the provider is ready.
   * Setting a provider supersedes the current provider used in new and existing clients bound to the same domain.
   * @param {string} domain The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param {EvaluationContext} context The evaluation context to use for flag evaluations.
   * @returns {Promise<void>}
   * @throws {Error} If the provider throws an exception during initialization.
   */
  setProviderAndWait(domain: string, provider: Provider, context: EvaluationContext): Promise<void>;
  async setProviderAndWait(
    clientOrProvider?: string | Provider,
    providerContextOrUndefined?: Provider | EvaluationContext,
    contextOrUndefined?: EvaluationContext,
  ): Promise<void> {
    const domain = stringOrUndefined(clientOrProvider);
    const provider = domain
      ? objectOrUndefined<Provider>(providerContextOrUndefined)
      : objectOrUndefined<Provider>(clientOrProvider);
    const context = domain
      ? objectOrUndefined<EvaluationContext>(contextOrUndefined)
      : objectOrUndefined<EvaluationContext>(providerContextOrUndefined);

    if (context) {
      // synonymously setting context prior to provider initialization.
      // No context change event will be emitted.
      if (domain) {
        this._domainScopedContext.set(domain, context);
      } else {
        this._context = context;
      }
    }

    await this.setAwaitableProvider(domain, provider);
  }

  /**
   * Sets the default provider for flag evaluations.
   * This provider will be used by domainless clients and clients associated with domains to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing unbound clients.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(provider: Provider): this;
  /**
   * Sets the default provider and evaluation context for flag evaluations.
   * This provider will be used by domainless clients and clients associated with domains to which no provider is bound.
   * Setting a provider supersedes the current provider used in new and existing unbound clients.
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param context {EvaluationContext} The evaluation context to use for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(provider: Provider, context: EvaluationContext): this;
  /**
   * Sets the provider for flag evaluations of providers with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients bound to the same domain.
   * @param {string} domain The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(domain: string, provider: Provider): this;
  /**
   * Sets the provider and evaluation context flag evaluations of providers with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients bound to the same domain.
   * @param {string} domain The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @param context {EvaluationContext} The evaluation context to use for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(domain: string, provider: Provider, context: EvaluationContext): this;
  setProvider(
    domainOrProvider?: string | Provider,
    providerContextOrUndefined?: Provider | EvaluationContext,
    contextOrUndefined?: EvaluationContext,
  ): this {
    const domain = stringOrUndefined(domainOrProvider);
    const provider = domain
      ? objectOrUndefined<Provider>(providerContextOrUndefined)
      : objectOrUndefined<Provider>(domainOrProvider);
    const context = domain
      ? objectOrUndefined<EvaluationContext>(contextOrUndefined)
      : objectOrUndefined<EvaluationContext>(providerContextOrUndefined);

    if (context) {
      // synonymously setting context prior to provider initialization.
      // No context change event will be emitted.
      if (domain) {
        this._domainScopedContext.set(domain, context);
      } else {
        this._context = context;
      }
    }

    const maybePromise = this.setAwaitableProvider(domain, provider);

    // The setProvider method doesn't return a promise so we need to catch and
    // log any errors that occur during provider initialization to avoid having
    // an unhandled promise rejection.
    Promise.resolve(maybePromise).catch((err) => {
      this._logger.error('Error during provider initialization:', err);
    });
    return this;
  }

  /**
   * Get the default provider.
   *
   * Note that it isn't recommended to interact with the provider directly, but rather through
   * an OpenFeature client.
   * @returns {Provider} Default Provider
   */
  getProvider(): Provider;
  /**
   * Get the provider bound to the specified domain.
   *
   * Note that it isn't recommended to interact with the provider directly, but rather through
   * an OpenFeature client.
   * @param {string} domain An identifier which logically binds clients with providers
   * @returns {Provider} Domain-scoped provider
   */
  getProvider(domain?: string): Provider;
  getProvider(domain?: string): Provider {
    return this.getProviderForClient(domain);
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
      const wrapper = this._domainScopedProviders.get(domain);
      if (wrapper) {
        const oldContext = this.getContext(domain);
        this._domainScopedContext.set(domain, context);
        await this.runProviderContextChangeHandler(domain, wrapper, oldContext, context);
      } else {
        this._domainScopedContext.set(domain, context);
      }
    } else {
      const oldContext = this._context;
      this._context = context;

      // collect all providers that are using the default context (not bound to a domain)
      const unboundProviders: DomainRecord[] = Array.from(this._domainScopedProviders.entries())
        .filter(([domain]) => !this._domainScopedContext.has(domain))
        .reduce<DomainRecord[]>((acc, [domain, wrapper]) => {
          acc.push({ domain, wrapper });
          return acc;
        }, []);

      const allDomainRecords: DomainRecord[] = [
        // add in the default (no domain)
        { domain: undefined, wrapper: this._defaultProvider },
        ...unboundProviders,
      ];
      await Promise.all(
        allDomainRecords.map((dm) => this.runProviderContextChangeHandler(dm.domain, dm.wrapper, oldContext, context)),
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
  getContext(domain?: string | undefined): EvaluationContext;
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
      const wrapper = this._domainScopedProviders.get(domain);
      if (wrapper) {
        const oldContext = this.getContext(domain);
        this._domainScopedContext.delete(domain);
        const newContext = this.getContext();
        await this.runProviderContextChangeHandler(domain, wrapper, oldContext, newContext);
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
   * A factory function for creating new domain-scoped OpenFeature clients. Clients
   * can contain their own state (e.g. logger, hook, context). Multiple domains
   * can be used to segment feature flag configuration.
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
      () => this.getProviderStatus(domain),
      () => this.buildAndCacheEventEmitterForClient(domain),
      (domain?: string) => this.getContext(domain),
      () => this.getHooks(),
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
    wrapper: ProviderWrapper<Provider, ClientProviderStatus>,
    oldContext: EvaluationContext,
    newContext: EvaluationContext,
  ): Promise<void> {
    // this should always be set according to the typings, but let's be defensive considering JS
    const providerName = wrapper.provider?.metadata?.name || 'unnamed-provider';

    try {
      if (typeof wrapper.provider.onContextChange === 'function') {
        const maybePromise = wrapper.provider.onContextChange(oldContext, newContext);

        // only reconcile if the onContextChange method returns a promise
        if (typeof maybePromise?.then === 'function') {
          wrapper.incrementPendingContextChanges();
          wrapper.status = this._statusEnumType.RECONCILING;
          this.getAssociatedEventEmitters(domain).forEach((emitter) => {
            emitter?.emit(ProviderEvents.Reconciling, { domain, providerName });
          });
          this._apiEmitter?.emit(ProviderEvents.Reconciling, { domain, providerName });

          await maybePromise;
          wrapper.decrementPendingContextChanges();
        }
      }
      // only run the event handlers, and update the state if the onContextChange method succeeded
      wrapper.status = this._statusEnumType.READY;
      if (wrapper.allContextChangesSettled) {
        this.getAssociatedEventEmitters(domain).forEach((emitter) => {
          emitter?.emit(ProviderEvents.ContextChanged, { clientName: domain, domain, providerName });
        });
        this._apiEmitter?.emit(ProviderEvents.ContextChanged, { clientName: domain, domain, providerName });
      }
    } catch (err) {
      // run error handlers instead
      wrapper.decrementPendingContextChanges();
      wrapper.status = this._statusEnumType.ERROR;
      if (wrapper.allContextChangesSettled) {
        const error = err as Error | undefined;
        const message = `Error running ${providerName}'s context change handler: ${error?.message}`;
        this._logger?.error(`${message}`, err);
        this.getAssociatedEventEmitters(domain).forEach((emitter) => {
          emitter?.emit(ProviderEvents.Error, { clientName: domain, domain, providerName, message });
        });
        this._apiEmitter?.emit(ProviderEvents.Error, { clientName: domain, domain, providerName, message });
      }
    }
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
