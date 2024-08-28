/**
 * Don't export types from this file publicly.
 * It might cause confusion since these types are not a part of the general API,
 * but just for the in-memory provider.
 */
import { EvaluationContext, JsonValue } from '@openfeature/core';

type Variants<T> = Record<string, T>;

/**
 * A Feature Flag definition, containing it's specification
 */
export type Flag = {
  /**
   * An object containing all possible flags mappings (variant -> flag value)
   */
  variants: Variants<boolean> | Variants<string> | Variants<number> | Variants<JsonValue>;
  /**
   * The variant it will resolve to in STATIC evaluation
   */
  defaultVariant: string;
  /**
   * Determines if flag evaluation is enabled or not for this flag.
   * If false, falls back to the default value provided to the client
   */
  disabled: boolean;
  /**
   * Function used in order to evaluate a flag to a specific value given the provided context.
   * It should return a variant key.
   * If it does not return a valid variant it falls back to the default value provided to the client
   * @param EvaluationContext
   */
  contextEvaluator?: (ctx: EvaluationContext) => string;
};

export type FlagConfiguration = Record<string, Flag>;
