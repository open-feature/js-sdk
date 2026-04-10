import type { Client } from '@openfeature/web-sdk';

type FrameworkMetadataClient = Client & {
  setFrameworkMetadata?: (framework: 'angular') => Client;
};

/**
 * Marks an SDK-owned web client as Angular-backed while preserving instance identity.
 * @param {Client} client client instance to update
 * @returns {Client} the same client instance
 */
export function setAngularFrameworkMetadata(client: Client): Client {
  (client as FrameworkMetadataClient).setFrameworkMetadata?.('angular');
  return client;
}
