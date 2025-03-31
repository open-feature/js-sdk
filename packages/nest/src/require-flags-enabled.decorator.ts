import type { CallHandler, ExecutionContext, HttpException, NestInterceptor } from '@nestjs/common';
import { applyDecorators, mixin, NotFoundException, UseInterceptors } from '@nestjs/common';
import { getClientForEvaluation } from './utils';
import type { EvaluationContext } from '@openfeature/server-sdk';

type RequiredFlag = {
  flagKey: string;
  defaultValue?: boolean;
};

/**
 * Options for using one or more Boolean feature flags to control access to a Controller or Route.
 */
interface RequireFlagsEnabledProps {
  /**
   * The key and default value of the feature flag.
   * @see {@link Client#getBooleanValue}
   */
  flags: RequiredFlag[];

  /**
   * The exception to throw if any of the required feature flags are not enabled.
   * Defaults to a 404 Not Found exception.
   * @see {@link HttpException}
   * @default new NotFoundException(`Cannot ${req.method} ${req.url}`)
   */
  exception?: HttpException;

  /**
   * The domain of the OpenFeature client, if a domain scoped client should be used.
   * @see {@link OpenFeature#getClient}
   */
  domain?: string;

  /**
   * The {@link EvaluationContext} for evaluating the feature flag.
   * @see {@link OpenFeature#setContext}
   */
  context?: EvaluationContext;
}

/**
 * Controller or Route permissions handler decorator.
 *
 * Requires that the given feature flags are enabled for the request to be processed, else throws an exception.
 *
 * For example:
 * ```typescript
 * @RequireFlagsEnabled({
 *   flags: [                               // Required, an array of Boolean flags to check, with optional default values (defaults to false)
 *     { flagKey: 'flagName' },
 *     { flagKey: 'flagName2', defaultValue: true },
 *   ],
 *   exception: new ForbiddenException(),   // Optional, defaults to a 404 Not Found Exception
 *   domain: 'my-domain',                   // Optional, defaults to the default OpenFeature Client
 *   context: {                             // Optional, defaults to the global OpenFeature Context
 *     targetingKey: 'user-id',
 *   },
 * })
 * @Get('/')
 * public async handleGetRequest()
 * ```
 * @param {RequireFlagsEnabledProps} props The options for injecting the feature flag.
 * @returns {ClassDecorator & MethodDecorator} The decorator that can be used to require Boolean Feature Flags to be enabled for a controller or a specific route.
 */
export const RequireFlagsEnabled = (props: RequireFlagsEnabledProps): ClassDecorator & MethodDecorator =>
  applyDecorators(UseInterceptors(FlagsEnabledInterceptor(props)));

const FlagsEnabledInterceptor = (props: RequireFlagsEnabledProps) => {
  class FlagsEnabledInterceptor implements NestInterceptor {
    constructor() {}

    async intercept(context: ExecutionContext, next: CallHandler) {
      const req = context.switchToHttp().getRequest();
      const client = getClientForEvaluation(props.domain, props.context);

      for (const flag of props.flags) {
        const endpointAccessible = await client.getBooleanValue(flag.flagKey, flag.defaultValue ?? false);

        if (!endpointAccessible) {
          throw props.exception || new NotFoundException(`Cannot ${req.method} ${req.url}`);
        }
      }

      return next.handle();
    }
  }

  return mixin(FlagsEnabledInterceptor);
};
