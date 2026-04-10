import type { ProviderMetadata } from '../provider/provider';

export type ClientSdk = 'web' | 'server';
export type ClientFramework = 'react' | 'angular' | 'nest';

export interface ClientMetadataOptions {
  readonly version?: string;
  readonly framework?: ClientFramework;
}

export interface ClientMetadata {
  /**
   * @deprecated alias of "domain", use domain instead
   */
  readonly name?: string;
  readonly domain?: string;
  readonly version?: string;
  readonly sdk?: ClientSdk;
  readonly framework?: ClientFramework;
  readonly providerMetadata: ProviderMetadata;
}

export interface MetadataClient {
  readonly metadata: ClientMetadata;
}
