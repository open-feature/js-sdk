import {
  EvaluationContext,
  ManageContext,
  OpenFeatureCommonAPI,
  ProviderWrapper,
  objectOrUndefined,
  stringOrUndefined,
} from '@openfeature/core';
import { Client } from './client';
import { OpenFeatureEventEmitter } from './events';
import { Hook } from './hooks';
import { NOOP_PROVIDER, Provider, ProviderStatus } from './provider';
import {
  ManageTransactionContextPropagator,
  NOOP_TRANSACTION_CONTEXT_PROPAGATOR,
  TransactionContext,
  TransactionContextPropagator,
} from './transaction-context';
import { ServerProviderStatus } from '@openfeature/core';
import { OpenFeatureClient } from './client/open-feature-client';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI
  extends OpenFeatureCommonAPI<ServerProviderStatus, Provider, Hook>
  implements
    ManageContext<OpenFeatureAPI>,
    ManageTransactionContextPropagator<OpenFeatureCommonAPI<ServerProviderStatus, Provider>>
{
  protected _statusEnumType: typeof ProviderStatus = ProviderStatus;
  protected _apiEmitter = new OpenFeatureEventEmitter();
  protected _defaultProvider: ProviderWrapper<Provider, ServerProviderStatus> = new ProviderWrapper(
    NOOP_PROVIDER,
    ProviderStatus.NOT_READY,
    this._statusEnumType,
  );
  protected _domainScopedProviders: Map<string, ProviderWrapper<Provider, ServerProviderStatus>> = new Map();
  protected _createEventEmitter = () => new OpenFeatureEventEmitter();

  private _transactionContextPropagator: TransactionContextPropagator = NOOP_TRANSACTION_CONTEXT_PROPAGATOR;

  private constructor() {
    super('server');
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
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  setProviderAndWait(provider: Provider): Promise<void>;
  /**
   * Sets the provider that OpenFeature will use for flag evaluations on clients bound to the same domain.
   * A promise is returned that resolves when the provider is ready.
   * Setting a provider supersedes the current provider used in new and existing clients bound to the same domain.
   * @param {string} domain The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {Promise<void>}
   * @throws Uncaught exceptions thrown by the provider during initialization.
   */
  setProviderAndWait(domain: string, provider: Provider): Promise<void>;
  async setProviderAndWait(domainOrProvider?: string | Provider, providerOrUndefined?: Provider): Promise<void> {
    const domain = stringOrUndefined(domainOrProvider);
    const provider = domain
      ? objectOrUndefined<Provider>(providerOrUndefined)
      : objectOrUndefined<Provider>(domainOrProvider);

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
   * Sets the provider for flag evaluations of providers with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients bound to the same domain.
   * @param {string} domain The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {this} OpenFeature API
   */
  setProvider(domain: string, provider: Provider): this;
  setProvider(clientOrProvider?: string | Provider, providerOrUndefined?: Provider): this {
    const domain = stringOrUndefined(clientOrProvider);
    const provider = domain
      ? objectOrUndefined<Provider>(providerOrUndefined)
      : objectOrUndefined<Provider>(clientOrProvider);

    const maybePromise = this.setAwaitableProvider(domain, provider);

    // The setProvider method doesn't return a promise so we need to catch and
    // log any errors that occur during provider initialization to avoid having
    // an unhandled promise rejection.
    Promise.resolve(maybePromise).catch((err) => {
      this._logger.error('Error during provider initialization:', err);
    });

    return this;
  }

  setContext(context: EvaluationContext): this {
    this._context = context;
    return this;
  }

  getContext(): EvaluationContext {
    return this._context;
  }

  /**
   * A factory function for creating new domainless OpenFeature clients.
   * Clients can contain their own state (e.g. logger, hook, context).
   * Multiple clients can be used to segment feature flag configuration.
   *
   * All domainless or unbound clients use the default provider set via {@link this.setProvider setProvider}.
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(context?: EvaluationContext): Client;
  /**
   * A factory function for creating new domain scoped OpenFeature clients.
   * Clients can contain their own state (e.g. logger, hook, context).
   * Multiple clients can be used to segment feature flag configuration.
   *
   * If there is already a provider bound to this domain via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that domain.
   * @param {string} domain An identifier which logically binds clients with providers
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(domain: string, context?: EvaluationContext): Client;
  /**
   * A factory function for creating new domain scoped OpenFeature clients.
   * Clients can contain their own state (e.g. logger, hook, context).
   * Multiple clients can be used to segment feature flag configuration.
   *
   * If there is already a provider bound to this domain via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that domain.
   * @param {string} domain An identifier which logically binds clients with providers
   * @param {string} version The version of the client (only used for metadata)
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(domain: string, version: string, context?: EvaluationContext): Client;
  getClient(
    domainOrContext?: string | EvaluationContext,
    versionOrContext?: string | EvaluationContext,
    contextOrUndefined?: EvaluationContext,
  ): Client {
    const domain = stringOrUndefined(domainOrContext);
    const version = stringOrUndefined(versionOrContext);
    const context =
      objectOrUndefined<EvaluationContext>(domainOrContext) ??
      objectOrUndefined<EvaluationContext>(versionOrContext) ??
      objectOrUndefined<EvaluationContext>(contextOrUndefined);

    return new OpenFeatureClient(
      () => this.getProviderForClient(domain),
      () => this.getProviderStatus(domain),
      () => this.buildAndCacheEventEmitterForClient(domain),
      () => this._logger,
      { domain, version },
      context,
    );
  }

  /**
   * Clears all registered providers and resets the default provider.
   * @returns {Promise<void>}
   */
  clearProviders(): Promise<void> {
    return super.clearProvidersAndSetDefault(NOOP_PROVIDER);
  }

  setTransactionContextPropagator(
    transactionContextPropagator: TransactionContextPropagator,
  ): OpenFeatureCommonAPI<ServerProviderStatus, Provider> {
    const baseMessage = 'Invalid TransactionContextPropagator, will not be set: ';
    if (typeof transactionContextPropagator?.getTransactionContext !== 'function') {
      this._logger.error(`${baseMessage}: getTransactionContext is not a function.`);
    } else if (typeof transactionContextPropagator?.setTransactionContext !== 'function') {
      this._logger.error(`${baseMessage}: setTransactionContext is not a function.`);
    } else {
      this._transactionContextPropagator = transactionContextPropagator;
    }
    return this;
  }

  setTransactionContext<TArgs extends unknown[], R>(
    transactionContext: TransactionContext,
    callback: (...args: TArgs) => R,
    ...args: TArgs
  ): void {
    this._transactionContextPropagator.setTransactionContext(transactionContext, callback, ...args);
  }

  getTransactionContext(): TransactionContext {
    try {
      return this._transactionContextPropagator.getTransactionContext();
    } catch (err: unknown) {
      const error = err as Error | undefined;
      this._logger.error(`Error getting transaction context: ${error?.message}, returning empty context.`);
      this._logger.error(error?.stack);
      return {};
    }
  }
}

/**
 * A singleton instance of the OpenFeature API.
 * @returns {OpenFeatureAPI} OpenFeature API
 */
export const OpenFeature = OpenFeatureAPI.getInstance();
