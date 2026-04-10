import type { Client, EvaluationContext } from '@openfeature/server-sdk';
import { OpenFeature } from '@openfeature/server-sdk';

type FrameworkMetadataClient = Client & {
  setFrameworkMetadata?: (framework: 'nest') => Client;
};

/**
 * Returns a domain scoped or the default OpenFeature client with the given context.
 * @param {string} domain The domain of the OpenFeature client.
 * @param {EvaluationContext} context The evaluation context of the client.
 * @returns {Client} The OpenFeature client.
 */
export function getClientForEvaluation(domain?: string, context?: EvaluationContext) {
  return setNestFrameworkMetadata(domain ? OpenFeature.getClient(domain, context) : OpenFeature.getClient(context));
}

function setNestFrameworkMetadata(client: Client): Client {
  (client as FrameworkMetadataClient).setFrameworkMetadata?.('nest');
  return client;
}
