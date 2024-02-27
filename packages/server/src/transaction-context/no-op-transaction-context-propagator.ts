import { EvaluationContext } from '@openfeature/core';
import { TransactionContext, TransactionContextPropagator } from './transaction-context';

class NoopTransactionContextPropagator implements TransactionContextPropagator {
  getTransactionContext(): EvaluationContext {
    return {};
  }

  setTransactionContext<TArgs extends unknown[], R>(
    _: TransactionContext,
    callback: (...args: TArgs) => R,
    ...args: TArgs
  ): void {
    callback(...args);
  }
}

export const NOOP_TRANSACTION_CONTEXT_PROPAGATOR = new NoopTransactionContextPropagator();
