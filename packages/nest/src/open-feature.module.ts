import {
  DynamicModule,
  Module,
  FactoryProvider as NestValueProvider,
  ValueProvider,
  ClassProvider,
  Provider as NestProvider,
} from '@nestjs/common';
import { Client, OpenFeature, Provider } from '@openfeature/server-sdk';
import { ContextFactory, ContextFactoryToken } from './context-factory';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AsyncLocalStorageTransactionContext } from './evaluation-context-propagator';
import { EvaluationContextInterceptor } from './evaluation-context-interceptor';

@Module({})
export class OpenFeatureModule {

  static forRoot({  useGlobalInterceptor = true, ...options }: OpenFeatureModuleOptions): DynamicModule {
    OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContext());
    const providers: NestProvider[] = [];

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

    providers.push(...clientValueProviders);

    const contextFactoryProvider: ValueProvider = {
      provide: ContextFactoryToken,
      useValue: options?.contextFactory,
    };

    providers.push(contextFactoryProvider);

    if (useGlobalInterceptor) {
      const interceptorProvider: ClassProvider = {
        provide: APP_INTERCEPTOR,
        useClass: EvaluationContextInterceptor,
      };
      providers.push(interceptorProvider);
    }

    return {
      global: true,
      module: OpenFeatureModule,
      providers,
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
  useGlobalInterceptor?: boolean;
}

/**
 *
 * @param name
 */
export function getOpenFeatureClientToken(name?: string): string {
  return name ? `OpenFeatureClient_${name}` : 'OpenFeatureClient_default';
}
