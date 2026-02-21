/**
 * Don't export types from this file publicly.
 * It might cause confusion since these types are not a part of the general API,
 * but just for the in-memory provider.
 */
import type { EvaluationContext, JsonValue } from '@openfeature/core';

// TODO: Remove once TypeScript updated to 5.4+
type NoInfer<T> = [T][T extends unknown ? 0 : never];

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

export type FlagConfiguration<T extends Record<string, FlagVariants<string>> = Record<string, FlagVariants<string>>> = {
  [K in keyof T]: Omit<Flag<keyof T[K] & string>, 'variants'> & { variants: T[K] };
};

const defineFlag = <T extends string>(flag: Flag<T>): Flag<T> => flag;

defineFlag({
  variants: {
    a: true,
    b: false,
  },
  defaultVariant: 'a',
  disabled: false,
  contextEvaluator: (_ctx) => 'b',
});

defineFlag({
  variants: {
    c: true,
    d: false,
  },
  // @ts-expect-error defaultVariant is not a valid variant key
  defaultVariant: 'e',
  disabled: false,
  // @ts-expect-error contextEvaluator returns a non-valid variant key
  contextEvaluator: (_ctx) => 'f',
});

const defineConfig = <T extends Record<string, FlagVariants<string>>>(
  config: FlagConfiguration<T>,
): FlagConfiguration<T> => config;

defineConfig({
  'valid-flag': {
    variants: {
      a: true,
      b: false,
    },
    defaultVariant: 'a',
    disabled: false,
    contextEvaluator: (_ctx) => 'b',
  },
  'invalid-flag': {
    variants: {
      c: true,
      d: false,
    },
    // @ts-expect-error defaultVariant is not a valid variant key
    defaultVariant: 'e',
    disabled: false,
    // @ts-expect-error contextEvaluator returns a non-valid variant key
    contextEvaluator: (_ctx) => 'f',
  },
});
