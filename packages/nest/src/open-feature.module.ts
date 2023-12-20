import {
  DynamicModule,
  Module,
  FactoryProvider as NestValueProvider,
  ValueProvider,
  Inject,
  ClassProvider,
} from '@nestjs/common';
import { Client, OpenFeature, Provider } from '@openfeature/server-sdk';
import { ContextFactory, ContextFactoryToken } from './context-factory';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AsyncLocalStorageTransactionContext } from './evaluation-context-propagator';
import { EvaluationContextInterceptor } from './evaluation-context-interceptor';

@Module({})
export class OpenFeatureModule {
  constructor(@Inject(ContextFactoryToken) private contextFactory?: ContextFactory) {}

  static forRoot(options?: OpenFeatureModuleOptions): DynamicModule {
    OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContext());

    const clientValueProviders: NestValueProvider<Client>[] = [
      {
        provide: getOpenFeatureClientToken(),
        useFactory: () => OpenFeature.getClient(),
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
          useFactory: () => OpenFeature.getClient(name),
        });
      });
    }

    const contextFactoryProvider: ValueProvider = {
      provide: ContextFactoryToken,
      useValue: options?.contextFactory,
    };

    const interceptorProvider: ClassProvider = {
      provide: APP_INTERCEPTOR,
      useClass: EvaluationContextInterceptor,
    };

    return {
      global: true,
      module: OpenFeatureModule,
      providers: [contextFactoryProvider, interceptorProvider, ...clientValueProviders],
      exports: [...clientValueProviders],
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
