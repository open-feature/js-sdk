import { TransactionContextPropagator, EvaluationContext } from '@openfeature/server-sdk';
import { AsyncLocalStorage } from 'async_hooks';

export class AsyncLocalStorageTransactionContext implements TransactionContextPropagator {
  private asyncLocalStorage = new AsyncLocalStorage<EvaluationContext>();

  getTransactionContext(): EvaluationContext {
    return this.asyncLocalStorage.getStore() ?? {};
  }
  setTransactionContext(context: EvaluationContext, callback: () => void): void {
    this.asyncLocalStorage.run(context, callback);
  }
}
