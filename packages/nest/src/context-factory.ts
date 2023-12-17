import { EvaluationContext } from '@openfeature/core';
import { ExecutionContext } from '@nestjs/common';

export type ContextFactory = (
  request: ExecutionContext,
) => Promise<EvaluationContext | undefined> | EvaluationContext | undefined;

export const ContextFactoryToken = Symbol('CONTEXT_FACTORY');
