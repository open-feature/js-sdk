/**
 * Don't export types from this file publicly.
 * It might cause confusion since these types are not a part of the general API,
 * but just for the in-memory provider.
 */
import type { EvaluationContext, JsonValue } from '@openfeature/core';

// TODO: Remove once TypeScript updated to 5.4+
type NoInfer<T> = [T][T extends unknown ? 0 : never];

// Flattens intersection types for better IDE display
// eslint-disable-next-line @typescript-eslint/ban-types
type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type FlagVariants<T extends string> =
  | Record<T, boolean>
  | Record<T, string>
  | Record<T, number>
  | Record<T, JsonValue>;

/**
 * A Feature Flag definition, containing it's specification
 */
export type Flag<T extends string = string> = {
  /**
   * An object containing all possible flags mappings (variant -> flag value)
   */
  variants: FlagVariants<T>;
  /**
   * The variant it will resolve to in STATIC evaluation
   */
  defaultVariant: NoInfer<T>;
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
  contextEvaluator?: (ctx: EvaluationContext) => NoInfer<T>;
};

/**
 * The configuration object for the InMemoryProvider, containing all flags and their specifications.
 *
 * The generic ensures that the keys of the `variants` object in each flag specification are consistent with the `defaultVariant` and the return type of `contextEvaluator`.
 */
export type FlagConfiguration<T extends Record<string, FlagVariants<string>> = Record<string, FlagVariants<string>>> = {
  [K in keyof T]: Simplify<{ variants: T[K] } & Omit<Flag<keyof T[K] & string>, 'variants'>>;
};
