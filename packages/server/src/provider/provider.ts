import type {
  CommonProvider,
  EvaluationContext,
  JsonValue,
  Logger,
  TrackingEventDetails,
  ResolutionDetails} from '@openfeature/core';
import {
  ServerProviderStatus,
} from '@openfeature/core';
import type { Hook } from '../hooks';

export { ServerProviderStatus as ProviderStatus };

/**
 * Interface that providers must implement to resolve flag values for their particular
 * backend or vendor.
 *
 * Implementation for resolving all the required flag types must be defined.
 */
export interface Provider extends CommonProvider<ServerProviderStatus> {
  /**
   * A provider hook exposes a mechanism for provider authors to register hooks
   * to tap into various stages of the flag evaluation lifecycle. These hooks can
   * be used to perform side effects and mutate the context for purposes of the
   * provider. Provider hooks are not configured or controlled by the application author.
   */
  readonly hooks?: Hook[];

  /**
   * Resolve a boolean flag and its evaluation details.
   */
  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<boolean>>;

  /**
   * Resolve a string flag and its evaluation details.
   */
  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<string>>;

  /**
   * Resolve a numeric flag and its evaluation details.
   */
  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<number>>;

  /**
   * Resolve and parse an object flag and its evaluation details.
   */
  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger,
  ): Promise<ResolutionDetails<T>>;

  /**
   * Track a user action or application state, usually representing a business objective or outcome.
   * @param trackingEventName
   * @param context
   * @param trackingEventDetails
   */
  track?(trackingEventName: string, context?: EvaluationContext, trackingEventDetails?: TrackingEventDetails): void;
}
