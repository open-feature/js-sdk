import type { ClientFramework, FrameworkMetadataClient, MetadataClient } from './client';

/**
 * Applies framework metadata to clients that support runtime metadata updates.
 * @internal
 * @template T
 * @param {T} client client to update
 * @param {ClientFramework} framework framework metadata to expose
 * @returns {T} the same client instance
 */
export function setFrameworkMetadata<T extends MetadataClient>(client: T, framework: ClientFramework): T {
  if (isFrameworkMetadataClient(client)) {
    client.setFrameworkMetadata(framework);
  }

  return client;
}

function isFrameworkMetadataClient(client: MetadataClient): client is FrameworkMetadataClient {
  return typeof (client as FrameworkMetadataClient).setFrameworkMetadata === 'function';
}
