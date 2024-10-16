import type { EvaluationContext } from '@openfeature/core';
import type { ExecutionContext} from '@nestjs/common';
import { Inject } from '@nestjs/common';

/**
 * A factory function for creating an OpenFeature {@link EvaluationContext} from Nest {@link ExecutionContext}.
 * This can be used e.g. to get header info from an HTTP request or information from a gRPC call.
 *
 * Example getting an HTTP header value:
 * ```typescript
 * async function(context: ExecutionContext) {
 *   const request = await context.switchToHttp().getRequest();
 *
 *   const userId = request.header('x-user-id');
 *
 *   if (userId) {
 *     return {
 *       targetingKey: userId,
 *     };
 *   }
 *
 *   return undefined;
 * }
 * ```
 * @param {ExecutionContext} request The {@link ExecutionContext} to get the information from.
 * @returns {(Promise<EvaluationContext | undefined> | EvaluationContext | undefined)} The {@link EvaluationContext} new.
 */
export type ContextFactory = (
  request: ExecutionContext,
) => Promise<EvaluationContext | undefined> | EvaluationContext | undefined;

/**
 * InjectionToken for a {@link ContextFactory}.
 * @see {@link Inject}
 */
export const ContextFactoryToken = Symbol('CONTEXT_FACTORY');
