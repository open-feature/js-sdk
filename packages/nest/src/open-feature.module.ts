import {
  DynamicModule,
  Module,
  FactoryProvider as NestFactoryProvider,
  ValueProvider,
  ClassProvider,
  Provider as NestProvider,
  ExecutionContext,
} from '@nestjs/common';
import {
  Client,
  Hook,
  OpenFeature,
  Provider,
  EvaluationContext,
  ServerProviderEvents,
  EventHandler,
  Logger,
  AsyncLocalStorageTransactionContextPropagator,
} from '@openfeature/server-sdk';
import { ContextFactory, ContextFactoryToken } from './context-factory';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EvaluationContextInterceptor } from './evaluation-context-interceptor';
import { ShutdownService } from './shutdown.service';

/**
 * OpenFeatureModule is a NestJS wrapper for OpenFeature Server-SDK.
 */
@Module({})
export class OpenFeatureModule {
  static forRoot({ useGlobalInterceptor = true, ...options }: OpenFeatureModuleOptions): DynamicModule {
    OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContextPropagator());

    if (options.logger) {
      OpenFeature.setLogger(options.logger);
    }

    if (options.hooks) {
      OpenFeature.addHooks(...options.hooks);
    }

    options.handlers?.forEach(([event, handler]) => {
      OpenFeature.addHandler(event, handler);
    });

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
      Object.entries(options.providers).forEach(([domain, provider]) => {
        OpenFeature.setProvider(domain, provider);
        clientValueProviders.push({
          provide: getOpenFeatureClientToken(domain),
          useFactory: () => OpenFeature.getClient(domain),
        });
      });
    }

    const nestProviders: NestProvider[] = [ShutdownService];
    nestProviders.push(...clientValueProviders);

    const contextFactoryProvider: ValueProvider = {
      provide: ContextFactoryToken,
      useValue: options?.contextFactory,
    };
    nestProviders.push(contextFactoryProvider);

    if (useGlobalInterceptor) {
      const interceptorProvider: ClassProvider = {
        provide: APP_INTERCEPTOR,
        useClass: EvaluationContextInterceptor,
      };
      nestProviders.push(interceptorProvider);
    }

    return {
      global: true,
      module: OpenFeatureModule,
      providers: nestProviders,
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
   * Domain scoped providers to set to OpenFeature.
   * @see {@link OpenFeature#setProvider}
   */
  providers?: {
    [domain: string]: Provider;
  };
  /**
   * Global {@link Logger} for OpenFeature.
   * @see {@link OpenFeature#setLogger}
   */
  logger?: Logger;
  /**
   * Global {@link EvaluationContext} for OpenFeature.
   * @see {@link OpenFeature#setContext}
   */
  context?: EvaluationContext;
  /**
   * Global {@link Hook Hooks} for OpenFeature.
   * @see {@link OpenFeature#addHooks}
   */
  hooks?: Hook[];
  /**
   * Global {@link EventHandler EventHandlers} for OpenFeature.
   * @see {@link OpenFeature#addHandler}
   */
  handlers?: [ServerProviderEvents, EventHandler][];
  /**
   * The {@link ContextFactory} for creating an {@link EvaluationContext} from Nest {@link ExecutionContext} information.
   * This could be header values of a request or something similar.
   * The context is automatically used for all feature flag evaluations during this request.
   * @see {@link AsyncLocalStorageTransactionContextPropagator}
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
 * Returns an injection token for a (domain scoped) OpenFeature client.
 * @param {string} domain The domain of the OpenFeature client.
 * @returns {Client} The injection token.
 */
export function getOpenFeatureClientToken(domain?: string): string {
  return domain ? `OpenFeatureClient_${domain}` : 'OpenFeatureClient_default';
}
