import {
  DynamicModule,
  Module,
  FactoryProvider as NestValueProvider,
  ValueProvider,
  Inject,
  ClassProvider,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { EvaluationContext, OpenFeature, Provider } from '@openfeature/server-sdk';
import { OpenFeatureContextService, OpenFeatureClientService } from './feature.service';
import { ContextFactory, ContextFactoryToken } from './context-factory';
import { AsyncLocalStorage } from 'async_hooks';
import { SharedAsyncLocalStorage } from './async-storage';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Observable } from 'rxjs';

export type AsyncContextType = { context?: EvaluationContext | undefined };


@Module({})
export class OpenFeatureModule {

  static forRoot(options?: OpenFeatureModuleOptions): DynamicModule {
    const clientValueProviders: NestValueProvider<OpenFeatureClientService>[] = [
      {
        provide: getOpenFeatureClientToken(),
        useFactory: (openFeatureContextService: OpenFeatureContextService) => new OpenFeatureClientService(openFeatureContextService, getOpenFeatureClientToken()),
        inject: [OpenFeatureContextService],
      },
    ];

    if (options?.defaultProvider) {
      OpenFeature.setProvider(options.defaultProvider);
    }

    if (options?.providers) {
      Object.entries(options.providers).forEach(([name, provider]) => {
        OpenFeature.setProvider(name, provider);
        clientValueProviders.push({
          provide: getOpenFeatureClientToken(name),
          useFactory: (openFeatureContextService: OpenFeatureContextService) => new OpenFeatureClientService(openFeatureContextService, name),
          inject: [OpenFeatureContextService]
        });
      });
    }

    const alsProvider: ValueProvider = {
      provide: AsyncLocalStorage,
      useValue: SharedAsyncLocalStorage,
    };

    const contextFactoryProvider: ValueProvider = {
      provide: ContextFactoryToken,
      useValue: options?.contextFactory,
    };

    const contextServiceProvider: ValueProvider = {
      provide: OpenFeatureContextService,
      useValue: new OpenFeatureContextService(SharedAsyncLocalStorage),
    };

    const openFeatureContextInterceptor: ClassProvider = {
      provide: APP_INTERCEPTOR,
      useClass: EvaluationContextInterceptor,
    };


    return {
      global: true,
      module: OpenFeatureModule,
      providers: [alsProvider, contextFactoryProvider, openFeatureContextInterceptor, contextServiceProvider, ...clientValueProviders],
      exports: [contextServiceProvider, ...clientValueProviders],
    };
  }
}

export interface OpenFeatureModuleOptions {
  defaultProvider?: Provider;
  providers?: {
    [providerName: string]: Provider;
  };
  contextFactory?: ContextFactory;
}

export function getOpenFeatureClientToken(name?: string): string {
  return name ? `OpenFeatureClient_${name}` : 'OpenFeatureClient_default';
}

@Injectable()
class EvaluationContextInterceptor implements NestInterceptor {
  constructor(
    @Inject(AsyncLocalStorage) private asyncLocalStorage: AsyncLocalStorage<AsyncContextType>,
    @Inject(ContextFactoryToken) private contextFactory?: ContextFactory,
  ) { }

  async intercept(executionContext: ExecutionContext, next: CallHandler) {
    const context = await this.contextFactory?.(executionContext);

    return new Observable((subscriber) => {
      this.asyncLocalStorage.run(
        {
          context,
        },
        async () => {
          next
            .handle()
            .pipe()
            .subscribe({
              next: (res) => subscriber.next(res),
              error: (err) => subscriber.error(err),
              complete: () => subscriber.complete(),
            });
        },
      );
    });
  }
}
