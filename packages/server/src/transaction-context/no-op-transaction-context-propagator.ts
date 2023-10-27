import { EvaluationContext } from '@openfeature/core';
import { TransactionContextPropagator } from './transaction-context';

class NoopTransactionContextPropagator implements TransactionContextPropagator {
  getTransactionContext(): EvaluationContext {
    return {};
  }

  setTransactionContext(_: EvaluationContext, callback: () => void): void {
    callback();
  }
}

export const NOOP_TRANSACTION_CONTEXT_PROPAGATOR = new NoopTransactionContextPropagator();
