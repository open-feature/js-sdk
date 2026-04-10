import type { Client } from '@openfeature/server-sdk';

type FrameworkMetadataClient = Client & {
  setFrameworkMetadata?: (framework: 'nest') => Client;
};

/**
 * Marks an SDK-owned server client as Nest-backed while preserving instance identity.
 * @param {Client} client client instance to update
 * @returns {Client} the same client instance
 */
export function setNestFrameworkMetadata(client: Client): Client {
  (client as FrameworkMetadataClient).setFrameworkMetadata?.('nest');
  return client;
}
