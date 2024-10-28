import type {
  CommonProvider,
  EvaluationContext,
  JsonValue,
  Logger,
  ResolutionDetails,
} from '@openfeature/core';
import { ClientProviderStatus } from '@openfeature/core';
import type { Hook } from '../hooks';

export { ClientProviderStatus as ProviderStatus };

/**
 * Interface that providers must implement to resolve flag values for their particular
 * backend or vendor.
 *
 * Implementation for resolving all the required flag types must be defined.
 */
export interface Provider extends CommonProvider<ClientProviderStatus> {
  /**
   * A provider hook exposes a mechanism for provider authors to register hooks
   * to tap into various stages of the flag evaluation lifecycle. These hooks can
   * be used to perform side effects and mutate the context for purposes of the
   * provider. Provider hooks are not configured or controlled by the application author.
   */
  readonly hooks?: Hook[];

  /**
   * A handler function to reconcile changes made to the static context.
   * Called by the SDK when the context is changed.
   *
   * Returning a promise will put the provider in the RECONCILING state and
   * emit the ProviderEvents.Reconciling event.
   *
   * Return void will avoid putting the provider in the RECONCILING state and
   * **not** emit the ProviderEvents.Reconciling event.
   * @param oldContext
   * @param newContext
   */
  onContextChange?(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void> | void;

  /**
   * Resolve a boolean flag and its evaluation details.
   */
  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<boolean>;

  /**
   * Resolve a string flag and its evaluation details.
   */
  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<string>;

  /**
   * Resolve a numeric flag and its evaluation details.
   */
  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<number>;

  /**
   * Resolve and parse an object flag and its evaluation details.
   */
  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger,
  ): ResolutionDetails<T>;
}
