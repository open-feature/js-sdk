import { EvaluationContext, JsonValue } from "@openfeature/js-sdk";

type Variants<T> = Record<string, T>;

export type Flag = {
  variants: Variants<boolean> | Variants<string> | Variants <number> | Variants<JsonValue>;
  defaultVariant: string;
  disabled: boolean;
  contextEvaluator?: (ctx: EvaluationContext) => string;
} ;

export type FlagConfiguration = Record<string, Flag>;
