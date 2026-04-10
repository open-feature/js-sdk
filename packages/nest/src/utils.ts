import type { Client, EvaluationContext } from '@openfeature/server-sdk';
import { OpenFeature } from '@openfeature/server-sdk';

/**
 * Returns a domain scoped or the default OpenFeature client with the given context.
 * @param {string} domain The domain of the OpenFeature client.
 * @param {EvaluationContext} context The evaluation context of the client.
 * @returns {Client} The OpenFeature client.
 */
export function getClientForEvaluation(domain?: string, context?: EvaluationContext) {
  return OpenFeature.getClient(domain, { framework: 'nest' }, context);
}
