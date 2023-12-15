import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AsyncLocalStorage } from 'async_hooks';
import { EvaluationContext } from '@openfeature/core';

export const asyncLocalStorage = new AsyncLocalStorage<EvaluationContext>();

@Injectable()
export class OpenFeatureContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {

    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest();
      const targetingKey = req.get('x-user-id');
      if (targetingKey) {

        return asyncLocalStorage.run({targetingKey}, () => next.handle());
      }

    }

    return next
      .handle();
  }
}
