import { EvaluationContext } from '@openfeature/core';
import { TransactionContext, TransactionContextPropagator } from './transaction-context';
import { AsyncLocalStorage } from 'async_hooks';

export class AsyncLocalStorageTransactionContextProvider implements TransactionContextPropagator {
  private asyncLocalStorage = new AsyncLocalStorage<EvaluationContext>();

  getTransactionContext(): EvaluationContext {
    return this.asyncLocalStorage.getStore() ?? {};
  }

  setTransactionContext<TArgs extends unknown[], R>(
    transactionContext: TransactionContext,
    callback: (...args: TArgs) => R,
    ...args: TArgs
  ): void {
    this.asyncLocalStorage.run(transactionContext, callback, ...args);
  }
}
