import type { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Inject, Injectable } from '@nestjs/common';
import type { ContextFactory} from './context-factory';
import { ContextFactoryToken } from './context-factory';
import { Observable } from 'rxjs';
import { OpenFeature } from '@openfeature/server-sdk';
import { OpenFeatureModule } from './open-feature.module';

/** 
 *  NestJS interceptor used in {@link OpenFeatureModule}
 *  to configure flag evaluation context.
 *
 *  This interceptor is configured globally by default.
 *  If `useGlobalInterceptor` is set to `false` in {@link OpenFeatureModule} it needs to be configured for the specific controllers or routes.
 *
 *  If just the interceptor class is passed to the `UseInterceptors` like below, the `contextFactory` provided in the {@link OpenFeatureModule} will be injected and used in order to create the context.
 *  ```ts
 *  //route interceptor
 *  @UseInterceptors(EvaluationContextInterceptor)
 *  @Get('/user-info')
 *  getUserInfo(){}
 *  ```
 *
 *  A different `contextFactory` can also be provided, but the interceptor instance has to be instantiated like in the following example.
 *  ```ts
 *  //route interceptor
 *  @UseInterceptors(new EvaluationContextInterceptor(<context factory>))
 *  @Get('/user-info')
 *  getUserInfo(){}
 *  ```
 */
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
