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

// use a symbol as a key for the global singleton
const GLOBAL_OPENFEATURE_API_KEY = Symbol.for('@openfeature/js-sdk/api');

type OpenFeatureGlobal = {
  [GLOBAL_OPENFEATURE_API_KEY]?: OpenFeatureAPI;
};
const _globalThis = globalThis as OpenFeatureGlobal;

export class OpenFeatureAPI
  extends OpenFeatureCommonAPI<Provider>
  implements ManageContext<OpenFeatureAPI>, ManageTransactionContextPropagator<OpenFeatureCommonAPI<Provider>>
{
  private _transactionContextPropagator: TransactionContextPropagator = NOOP_TRANSACTION_CONTEXT_PROPAGATOR;
  protected _defaultProvider: Provider = NOOP_PROVIDER;

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
    contextOrUndefined?: EvaluationContext
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
      context
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
    transactionContextPropagator: TransactionContextPropagator
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
