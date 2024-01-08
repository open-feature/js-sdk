import {
  DynamicModule,
  Module,
  FactoryProvider as NestFactoryProvider,
  ValueProvider,
  ClassProvider,
  Provider as NestProvider,
  ExecutionContext,
} from '@nestjs/common';
import { Client, OpenFeature, Provider, EvaluationContext } from '@openfeature/server-sdk';
import { ContextFactory, ContextFactoryToken } from './context-factory';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AsyncLocalStorageTransactionContext } from './evaluation-context-propagator';
import { EvaluationContextInterceptor } from './evaluation-context-interceptor';

@Module({})
export class OpenFeatureModule {
  static forRoot({ useGlobalInterceptor = true, ...options }: OpenFeatureModuleOptions): DynamicModule {
    OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContext());
    const providers: NestProvider[] = [];

    const clientValueProviders: NestFactoryProvider<Client>[] = [
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
      exports: [...clientValueProviders, ContextFactoryToken],
    };
  }
}

/**
 * Options for the {@link OpenFeatureModule}.
 */
export interface OpenFeatureModuleOptions {
  /**
   * The provider to be set as OpenFeature default provider.
   * @see {@link OpenFeature#setProvider}
   */
  defaultProvider?: Provider;
  /**
   * Named providers to set to OpenFeature.
   * @see {@link OpenFeature#setProvider}
   */
  providers?: {
    [providerName: string]: Provider;
  };
  /**
   * The {@link ContextFactory} for creating an {@link EvaluationContext} from Nest {@link ExecutionContext} information.
   * This could be header values of a request or something similar.
   * The context is automatically used for all feature flag evaluations during this request.
   * @see {@link AsyncLocalStorageTransactionContext}
   */
  contextFactory?: ContextFactory;
  /**
   * If set to false, the global {@link EvaluationContextInterceptor} is disabled.
   * This means that automatic propagation of the  {@link EvaluationContext} created by the {@link this#contextFactory} is not working.
   *
   * To enable it again for specific routes, the interceptor can be added for specific controllers or request handlers like seen below:
   * ```typescript
   * @Controller()
   * @UseInterceptors(EvaluationContextInterceptor)
   * export class Controller {}
   * ```
   * @default true
   */
  useGlobalInterceptor?: boolean;
}

/**
 * Returns an injection token for a (named) OpenFeature client.
 * @param {string} name The name of the OpenFeature client.
 * @returns {Client} The injection token.
 */
export function getOpenFeatureClientToken(name?: string): string {
  return name ? `OpenFeatureClient_${name}` : 'OpenFeatureClient_default';
}
