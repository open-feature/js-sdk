import {
  applyDecorators,
  CallHandler,
  ExecutionContext,
  HttpException,
  mixin,
  NestInterceptor,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { OpenFeature } from '@openfeature/server-sdk';

/**
 * Options for injecting a feature flag into a route handler.
 */
interface RequireFlagsEnabledProps {
  /**
   * The key of the feature flag.
   * @see {@link Client#getBooleanValue}
   */
  flagKeys: string[];
  /**
   * The exception to throw if any of the required feature flags are not enabled.
   * Defaults to a 404 Not Found exception.
   * @see {@link HttpException}
   */
  exception?: HttpException;

  /**
   * The domain of the OpenFeature client, if a domain scoped client should be used.
   * @see {@link OpenFeature#getClient}
   */
  domain?: string;
}

/**
 * Returns a domain scoped or the default OpenFeature client with the given context.
 * @param {string} domain The domain of the OpenFeature client.
 * @returns {Client} The OpenFeature client.
 */
function getClientForEvaluation(domain?: string) {
  return domain ? OpenFeature.getClient(domain) : OpenFeature.getClient();
}

/**
 * Controller or Route permissions handler decorator.
 *
 * Requires that the given feature flags are enabled for the request to be processed, else throws an exception.
 *
 * For example:
 * ```typescript
 * @RequireFlagsEnabled({
 *   flagKeys: ['flagName', 'flagName2'],  // Required, an array of Boolean feature flag keys
 *   exception: new ForbiddenException(),  // Optional, defaults to a 404 Not Found exception
 *   domain: 'my-domain',                  // Optional, defaults to the default OpenFeature client
 * })
 * @Get('/')
 * public async handleGetRequest()
 * ```
 * @param {RequireFlagsEnabledProps} options The options for injecting the feature flag.
 * @returns {Decorator}
 */
export const RequireFlagsEnabled = (props: RequireFlagsEnabledProps): ClassDecorator & MethodDecorator =>
  applyDecorators(UseInterceptors(FlagsEnabledInterceptor(props)));

const FlagsEnabledInterceptor = (props: RequireFlagsEnabledProps) => {
  class FlagsEnabledInterceptor implements NestInterceptor {
    constructor() {}

    async intercept(context: ExecutionContext, next: CallHandler) {
      const req = context.switchToHttp().getRequest();
      const client = getClientForEvaluation(props.domain);

      for (const flagKey of props.flagKeys) {
        const endpointAccessible = await client.getBooleanValue(flagKey, false);

        if (!endpointAccessible) {
          throw props.exception || new NotFoundException(`Cannot ${req.method} ${req.url}`);
        }
      }

      return next.handle();
    }
  }

  return mixin(FlagsEnabledInterceptor);
};
