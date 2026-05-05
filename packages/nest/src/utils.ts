import { withFrameworkMetadata } from '@openfeature/core';
import type { Client, EvaluationContext } from '@openfeature/server-sdk';
import { OpenFeature } from '@openfeature/server-sdk';
import { ExecutionContext } from '@nestjs/common';
import type { GqlExecutionContext as GqlExecutionContextClass, GqlContextType } from '@nestjs/graphql';

let GqlExecutionContext: typeof GqlExecutionContextClass | undefined;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ({ GqlExecutionContext } = require('@nestjs/graphql') as typeof import('@nestjs/graphql'));
} catch {
  // @nestjs/graphql is an optional peer dependency
}

/**
 * Returns a domain scoped or the default OpenFeature client with the given context.
 * @param {string} domain The domain of the OpenFeature client.
 * @param {EvaluationContext} context The evaluation context of the client.
 * @returns {Client} The OpenFeature client.
 */
export function getClientForEvaluation(domain?: string, context?: EvaluationContext) {
  return withFrameworkMetadata(
    domain ? OpenFeature.getClient(domain, context) : OpenFeature.getClient(context),
    'nest',
  );
}

/**
 * @param {ExecutionContext} context NestJS's execution context
 * @returns request object
 */
export const getRequestFromContext = <T = any>(context: ExecutionContext): T | undefined => {
  if (context.getType() === 'http') {
    return context.switchToHttp().getRequest<T>();
  } else if (context.getType<GqlContextType>() === 'graphql') {
    return GqlExecutionContext?.create(context)?.getContext()?.req as T;
  }
};
