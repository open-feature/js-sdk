import type { PrimitiveValue } from '../types';

export type EvaluationContextValue =
  | PrimitiveValue
  | Date
  | { [key: string]: EvaluationContextValue }
  | EvaluationContextValue[];

/**
 * A container for arbitrary contextual data that can be used as a basis for dynamic evaluation
 */
export type EvaluationContext = {
  /**
   * A string uniquely identifying the subject (end-user, or client service) of a flag evaluation.
   * Providers may require this field for fractional flag evaluation, rules, or overrides targeting specific users.
   * Such providers may behave unpredictably if a targeting key is not specified at flag resolution.
   */
  targetingKey?: string;
} & Record<string, EvaluationContextValue>;

export interface ManageContext<T> {
  /**
   * Access the evaluation context set on the receiver.
   * @returns {EvaluationContext} Evaluation context
   */
  getContext(): EvaluationContext;

  /**
   * Sets evaluation context that will be used during flag evaluations
   * on this receiver.
   * @template T The type of the receiver
   * @param {EvaluationContext} context Evaluation context
   * @returns {T} The receiver (this object)
   */
  setContext(context: EvaluationContext): T;
}
