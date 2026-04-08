import type { ProviderMetadata } from '../provider/provider';

export interface ClientMetadata {
  /**
   * @deprecated alias of "domain", use domain instead
   */
  readonly name?: string;
  readonly domain?: string;
  readonly version?: string;
  readonly sdk?: 'web' | 'server';
  readonly framework?: 'react' | 'angular' | 'nest';
  readonly providerMetadata: ProviderMetadata;
}

export interface MetadataClient {
  readonly metadata: ClientMetadata;
}
