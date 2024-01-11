import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { ContextFactory, ContextFactoryToken } from './context-factory';
import { Observable } from 'rxjs';
import { OpenFeature } from '@openfeature/server-sdk';

@Injectable()
export class EvaluationContextInterceptor implements NestInterceptor {
  constructor(@Inject(ContextFactoryToken) private contextFactory?: ContextFactory) {}

  async intercept(executionContext: ExecutionContext, next: CallHandler) {
    const context = await this.contextFactory?.(executionContext);

    return new Observable((subscriber) => {
      OpenFeature.setTransactionContext(context ?? {}, async () => {
        next.handle().subscribe({
          next: (res) => subscriber.next(res),
          error: (err) => subscriber.error(err),
          complete: () => subscriber.complete(),
        });
      });
    });
  }
}
