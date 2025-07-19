import type { BaseHook, EvaluationContext, FlagValue } from '@openfeature/core';

export type Hook<TData = Record<string, unknown>> = BaseHook<
  FlagValue,
  TData,
  Promise<EvaluationContext | void> | EvaluationContext | void,
  Promise<void> | void
>;
