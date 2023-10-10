/**
 * Don't export types from this file publicly.
 * It might cause confusion since these types are not a part of the general API,
 * but just for the in-memory provider.
 */
import { EvaluationContext, JsonValue } from '@openfeature/shared';

type Variants<T> = Record<string, T>;

export type Flag = {
  variants: Variants<boolean> | Variants<string> | Variants<number> | Variants<JsonValue>;
  defaultVariant: string;
  disabled: boolean;
  contextEvaluator?: (ctx: EvaluationContext) => string;
};

export type FlagConfiguration = Record<string, Flag>;
