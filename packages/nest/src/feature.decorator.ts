import { createParamDecorator, Inject } from '@nestjs/common';
import type { EvaluationContext, EvaluationDetails, FlagValue, JsonValue } from '@openfeature/server-sdk';
import { Client } from '@openfeature/server-sdk';
import { getOpenFeatureClientToken } from './open-feature.module';
import type { Observable } from 'rxjs';
import { from } from 'rxjs';
import { getClientForEvaluation } from './utils';

/**
 * Options for injecting an OpenFeature client into a constructor.
 */
interface FeatureClientProps {
  /**
   * The domain of the OpenFeature client, if a domain scoped client should be used.
   * @see {@link Client.getBooleanDetails}
   */
  domain?: string;
}

/**
 * Injects a feature client into a constructor or property of a class.
 * @param {FeatureClientProps} [props] The options for injecting the client.
 * @returns {PropertyDecorator & ParameterDecorator} The decorator function.
 */
export const OpenFeatureClient = (props?: FeatureClientProps) => Inject(getOpenFeatureClientToken(props?.domain));

/**
 * Options for injecting a feature flag into a route handler.
 */
interface FeatureProps<T extends FlagValue> {
  /**
   * The domain of the OpenFeature client, if a domain scoped client should be used.
   * @see {@link OpenFeature#getClient}
   */
  domain?: string;
  /**
   * The key of the feature flag.
   * @see {@link Client#getBooleanDetails}
   */
  flagKey: string;
  /**
   * The default value for the feature flag.
   * @see {@link Client#getBooleanDetails}
   */
  defaultValue: T;
  /**
   * The {@link EvaluationContext} for evaluating the feature flag.
   * @see {@link OpenFeature#getClient}
   */
  context?: EvaluationContext;
}

/**
 * Route handler parameter decorator.
 *
 * Gets the {@link EvaluationDetails} for given feature flag from a domain scoped or the default OpenFeature
 * client and populates the annotated parameter with the {@link EvaluationDetails} wrapped in an {@link Observable}.
 *
 * For example:
 * ```typescript
 * @Get('/')
 * public async handleBooleanRequest(
 *     @BooleanFeatureFlag({ flagKey: 'flagName', defaultValue: false })
 *     feature: Observable<EvaluationDetails<boolean>>,
 * )
 * ```
 * @param {FeatureProps<boolean>} options The options for injecting the feature flag.
 * @returns {ParameterDecorator}
 */
export const BooleanFeatureFlag = createParamDecorator(
  ({ domain, flagKey, defaultValue, context }: FeatureProps<boolean>): Observable<EvaluationDetails<boolean>> => {
    const client = getClientForEvaluation(domain, context);
    return from(client.getBooleanDetails(flagKey, defaultValue));
  },
);

/**
 * Route handler parameter decorator.
 *
 * Gets the {@link EvaluationDetails} for given feature flag from a domain scoped or the default OpenFeature
 * client and populates the annotated parameter with the {@link EvaluationDetails} wrapped in an {@link Observable}.
 *
 * For example:
 * ```typescript
 * @Get('/')
 * public async handleStringRequest(
 *     @StringFeatureFlag({ flagKey: 'flagName', defaultValue: "default" })
 *     feature: Observable<EvaluationDetails<string>>,
 * )
 * ```
 * @param {FeatureProps<string>} options The options for injecting the feature flag.
 * @returns {ParameterDecorator}
 */
export const StringFeatureFlag = createParamDecorator(
  ({ domain, flagKey, defaultValue, context }: FeatureProps<string>): Observable<EvaluationDetails<string>> => {
    const client = getClientForEvaluation(domain, context);
    return from(client.getStringDetails(flagKey, defaultValue));
  },
);

/**
 * Route handler parameter decorator.
 *
 * Gets the {@link EvaluationDetails} for given feature flag from a domain scoped or the default OpenFeature
 * client and populates the annotated parameter with the {@link EvaluationDetails} wrapped in an {@link Observable}.
 *
 * For example:
 * ```typescript
 * @Get('/')
 * public async handleNumberRequest(
 *     @NumberFeatureFlag({ flagKey: 'flagName', defaultValue: 0 })
 *     feature: Observable<EvaluationDetails<number>>,
 * )
 * ```
 * @param {FeatureProps<number>} options The options for injecting the feature flag.
 * @returns {ParameterDecorator}
 */
export const NumberFeatureFlag = createParamDecorator(
  ({ domain, flagKey, defaultValue, context }: FeatureProps<number>): Observable<EvaluationDetails<number>> => {
    const client = getClientForEvaluation(domain, context);
    return from(client.getNumberDetails(flagKey, defaultValue));
  },
);

/**
 * Route handler parameter decorator.
 *
 * Gets the {@link EvaluationDetails} for given feature flag from a domain scoped or the default OpenFeature
 * client and populates the annotated parameter with the {@link EvaluationDetails} wrapped in an {@link Observable}.
 *
 * For example:
 * ```typescript
 * @Get('/')
 * public async handleObjectRequest(
 *     @ObjectFeatureFlag({ flagKey: 'flagName', defaultValue: {} })
 *     feature: Observable<EvaluationDetails<JsonValue>>,
 * )
 * ```
 * @param {FeatureProps<JsonValue>} options The options for injecting the feature flag.
 * @returns {ParameterDecorator}
 */
export const ObjectFeatureFlag = createParamDecorator(
  ({ domain, flagKey, defaultValue, context }: FeatureProps<JsonValue>): Observable<EvaluationDetails<JsonValue>> => {
    const client = getClientForEvaluation(domain, context);
    return from(client.getObjectDetails(flagKey, defaultValue));
  },
);
