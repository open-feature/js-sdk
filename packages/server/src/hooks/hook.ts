import { BaseHook, EvaluationContext, FlagValue } from '@openfeature/core';

export type Hook = BaseHook<
  FlagValue,
  Promise<EvaluationContext | Promise<void>> | EvaluationContext | void,
  Promise<void> | void
>;
