import { NOOP_PROVIDER, Provider } from './provider';
import {
  ManageContext,
  OpenFeatureCommonAPI,
  EvaluationContext,
  objectOrUndefined,
  stringOrUndefined,
} from '@openfeature/core';
import {
  ManageTransactionContextPropagator,
  NOOP_TRANSACTION_CONTEXT_PROPAGATOR,
  TransactionContext,
  TransactionContextPropagator,
} from './transaction-context';
import { Client, OpenFeatureClient } from './client';
import { OpenFeatureEventEmitter } from './events';
import { Hook } from './hooks';

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI
  extends OpenFeatureCommonAPI<Provider, Hook>
  implements ManageContext<OpenFeatureAPI>, ManageTransactionContextPropagator<OpenFeatureCommonAPI<Provider>>
{
  protected _events = new OpenFeatureEventEmitter();
  protected _defaultProvider: Provider = NOOP_PROVIDER;
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
      this.setContext(context);
    }
    await this.setAwaitableProvider(clientName, provider, this.getContext());
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
      this.setContext(context);
    }

    this.catchPromiseErrors(this.setAwaitableProvider(clientName, provider, this.getContext()));
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
   * A factory function for creating new unnamed OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * All unnamed clients use the same provider set via {@link this.setProvider setProvider}.
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
    contextOrUndefined?: EvaluationContext,
  ): Client {
    const name = stringOrUndefined(nameOrContext);
    const version = stringOrUndefined(versionOrContext);
    const context =
      objectOrUndefined<EvaluationContext>(nameOrContext) ??
      objectOrUndefined<EvaluationContext>(versionOrContext) ??
      objectOrUndefined<EvaluationContext>(contextOrUndefined);

    return new OpenFeatureClient(
      () => this.getProviderForClient(name),
      () => this.buildAndCacheEventEmitterForClient(name),
      () => this._logger,
      { name, version },
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
  ): OpenFeatureCommonAPI<Provider> {
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

  setTransactionContext<R>(
    transactionContext: TransactionContext,
    callback: (...args: unknown[]) => R,
    ...args: unknown[]
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
