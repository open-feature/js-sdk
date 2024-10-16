import type { EvaluationContext } from '@openfeature/core';

/**
 * Transaction context is a mechanism for adding transaction specific context that
 * is merged with evaluation context prior to flag evaluation. Examples of potential
 * transaction specific context include: a user id, user agent, or request path.
 */
export type TransactionContext = EvaluationContext;

export interface ManageTransactionContextPropagator<T> extends TransactionContextPropagator {
  /**
   * Sets a transaction context propagator on this receiver. The transaction context
   * propagator is responsible for persisting context for the duration of a single
   * transaction.
   * @template T The type of the receiver
   * @param {TransactionContextPropagator} transactionContextPropagator The context propagator to be used
   * @returns {T} The receiver (this object)
   */
  setTransactionContextPropagator(transactionContextPropagator: TransactionContextPropagator): T;
}

export interface TransactionContextPropagator {
  /**
   * Returns the currently defined transaction context using the registered transaction
   * context propagator.
   * @returns {TransactionContext} The current transaction context
   */
  getTransactionContext(): TransactionContext;

  /**
   * Sets the transaction context using the registered transaction context propagator.
   * Runs the {@link callback} function, in which the {@link transactionContext} will be available by calling
   * {@link this#getTransactionContext}.
   *
   * The {@link TransactionContextPropagator} must persist the {@link transactionContext} and make it available
   * to {@link callback} via {@link this#getTransactionContext}.
   *
   * The precedence of merging context can be seen in {@link https://openfeature.dev/specification/sections/evaluation-context#requirement-323 the specification}.
   *
   * Example:
   *
   * ```js
   * app.use((req: Request, res: Response, next: NextFunction) => {
   *     const ip = res.headers.get("X-Forwarded-For")
   *     OpenFeature.setTransactionContext({ targetingKey: req.user.id, ipAddress: ip }, () => {
   *         // The transaction context is used in any flag evaluation throughout the whole call chain of next
   *         next();
   *     });
   * })
   *
   * ```
   * @template TArgs The optional args passed to the callback function
   * @template R The return value of the callback
   * @param {TransactionContext} transactionContext The transaction specific context
   * @param {(...args: unknown[]) => R} callback Callback function to run
   * @param {...unknown[]} args Optional arguments that are passed to the callback function
   */
  setTransactionContext<TArgs extends unknown[], R>(
    transactionContext: TransactionContext,
    callback: (...args: TArgs) => R,
    ...args: TArgs
  ): void;
}
