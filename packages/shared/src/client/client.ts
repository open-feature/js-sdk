import type { ProviderMetadata } from '../provider/provider';
import type { Paradigm } from '../types/paradigm';

export type ClientSdk = 'js-web' | 'js-server';
export type ClientFramework = 'react' | 'angular' | 'nest';

export interface ClientMetadata {
  /**
   * @deprecated alias of "domain", use domain instead
   */
  readonly name?: string;
  readonly domain?: string;
  readonly version?: string;
  readonly sdk?: ClientSdk;
  readonly paradigm?: Paradigm;
  readonly framework?: ClientFramework;
  readonly providerMetadata: ProviderMetadata;
}

export interface MetadataClient {
  readonly metadata: ClientMetadata;
}
