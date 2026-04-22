import type { DynamicModule } from '@nestjs/common';
import { Module, ConfigurableModuleBuilder } from '@nestjs/common';
import type {
  Hook,
  Provider,
  EvaluationContext,
  ServerProviderEvents,
  EventHandler,
  Logger,
} from '@openfeature/server-sdk';
import { OpenFeature, AsyncLocalStorageTransactionContextPropagator } from '@openfeature/server-sdk';
import type { ContextFactory } from './context-factory';
import { ContextFactoryToken } from './context-factory';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { EvaluationContextInterceptor } from './evaluation-context-interceptor';
import { ShutdownService } from './shutdown.service';

export const OPEN_FEATURE_INIT_TOKEN = Symbol('OPEN_FEATURE_INIT');

/**
 * Initialize OpenFeature with the provided options.
 */
async function initializeOpenFeature(options: OpenFeatureModuleOptions): Promise<OpenFeatureModuleOptions> {
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

  if (options.defaultProvider) {
    await OpenFeature.setProviderAndWait(options.defaultProvider);
  }

  if (options.providers) {
    await Promise.all(
      Object.entries(options.providers).map(([domain, provider]) => OpenFeature.setProviderAndWait(domain, provider)),
    );
  }

  return options;
}

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN, OPTIONS_TYPE, ASYNC_OPTIONS_TYPE } =
  new ConfigurableModuleBuilder<OpenFeatureModuleOptions>()
    .setClassMethodName('forRoot')
    .setExtras<OpenFeatureModuleExtras>(
      { isGlobal: true, useGlobalInterceptor: true, domains: [] },
      (definition, extras) => {
        const moduleProviders: DynamicModule['providers'] = [
          ...(definition.providers || []),
          ShutdownService,
          {
            provide: OPEN_FEATURE_INIT_TOKEN,
            inject: [MODULE_OPTIONS_TOKEN],
            useFactory: initializeOpenFeature,
          },
          // Default client
          {
            provide: getOpenFeatureClientToken(),
            inject: [OPEN_FEATURE_INIT_TOKEN],
            useFactory: () => OpenFeature.getClient(),
          },
          // Context factory
          {
            provide: ContextFactoryToken,
            inject: [OPEN_FEATURE_INIT_TOKEN],
            useFactory: (options: OpenFeatureModuleOptions) => options.contextFactory,
          },
        ];

        const moduleExports: DynamicModule['exports'] = [
          ...(definition.exports || []),
          ContextFactoryToken,
          getOpenFeatureClientToken(),
        ];

        if (extras.useGlobalInterceptor) {
          moduleProviders.push({
            provide: APP_INTERCEPTOR,
            useClass: EvaluationContextInterceptor,
          });
        }

        for (const domain of extras.domains || []) {
          moduleProviders.push({
            provide: getOpenFeatureClientToken(domain),
            useFactory: () => OpenFeature.getClient(domain),
            inject: [OPEN_FEATURE_INIT_TOKEN],
          });
          moduleExports.push(getOpenFeatureClientToken(domain));
        }

        return {
          ...definition,
          global: extras.isGlobal,
          providers: moduleProviders,
          exports: moduleExports,
        };
      },
    )
    .build();

/**
 * OpenFeatureModule is a NestJS wrapper for OpenFeature Server-SDK.
 */
@Module({})
export class OpenFeatureModule extends ConfigurableModuleClass {}

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
}

/**
 * Extra options available at module definition time
 */
export interface OpenFeatureModuleExtras {
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
  /**
   * Whether the module should be global.
   * @default true
   */
  isGlobal?: boolean;
  /**
   * Domains for which to create domain-scoped OpenFeature clients.
   * Each domain will get its own injectable client token via {@link getOpenFeatureClientToken}.
   */
  domains?: string[];
}

/**
 * Returns an injection token for a (domain scoped) OpenFeature client.
 * @param {string} domain The domain of the OpenFeature client.
 * @returns {Client} The injection token.
 */
export function getOpenFeatureClientToken(domain?: string): string {
  return domain ? `OpenFeatureClient_${domain}` : 'OpenFeatureClient_default';
}
