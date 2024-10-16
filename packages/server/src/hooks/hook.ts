import type { BaseHook, EvaluationContext, FlagValue } from '@openfeature/core';

export type Hook = BaseHook<
  FlagValue,
  Promise<EvaluationContext | void> | EvaluationContext | void,
  Promise<void> | void
>;
