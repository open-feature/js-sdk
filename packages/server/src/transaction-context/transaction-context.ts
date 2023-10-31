import { EvaluationContext } from '@openfeature/core';

/**
 * Transaction context is a mechanism for adding transaction specific context that
 * is merged with evaluation context prior to flag evaluation. Examples of potential
 * transaction specific context include: a user id, user agent, or request path.
 */
export type TransactionContext = EvaluationContext;

export interface ManageTransactionContextPropagator<T> extends TransactionContextPropagator {
  /**
   * EXPERIMENTAL: Transaction context propagation is experimental and subject to change.
   * The OpenFeature Enhancement Proposal regarding transaction context can be found [here](https://github.com/open-feature/ofep/pull/32).
   *
   * Sets a transaction context propagator on this receiver. The transaction context
   * propagator is responsible for persisting context for the duration of a single
   * transaction.
   * @experimental
   * @template T The type of the receiver
   * @param {TransactionContextPropagator} transactionContextPropagator The context propagator to be used
   * @returns {T} The receiver (this object)
   */
  setTransactionContextPropagator(transactionContextPropagator: TransactionContextPropagator): T;
}

export interface TransactionContextPropagator {
  /**
   * EXPERIMENTAL: Transaction context propagation is experimental and subject to change.
   * The OpenFeature Enhancement Proposal regarding transaction context can be found [here](https://github.com/open-feature/ofep/pull/32).
   *
   * Returns the currently defined transaction context using the registered transaction
   * context propagator.
   * @experimental
   * @returns {TransactionContext} The current transaction context
   */
  getTransactionContext(): TransactionContext;

  /**
   * EXPERIMENTAL: Transaction context propagation is experimental and subject to change.
   * The OpenFeature Enhancement Proposal regarding transaction context can be found [here](https://github.com/open-feature/ofep/pull/32).
   *
   * Sets the transaction context using the registered transaction context propagator.
   * @experimental
   * @template R The return value of the callback
   * @param {TransactionContext} transactionContext The transaction specific context
   * @param {(...args: unknown[]) => R} callback Callback function used to set the transaction context on the stack
   * @param {...unknown[]} args Optional arguments that are passed to the callback function
   */
  setTransactionContext<R>(
    transactionContext: TransactionContext,
    callback: (...args: unknown[]) => R,
    ...args: unknown[]
  ): void;
}
