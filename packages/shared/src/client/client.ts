import type { ProviderMetadata } from '../provider/provider';
import type { Paradigm } from '../types/paradigm';

export interface ClientMetadata {
  /**
   * @deprecated alias of "domain", use domain instead
   */
  readonly name?: string;
  readonly domain?: string;
  readonly version?: string;
  readonly sdk?: 'js-web' | 'js-server';
  readonly paradigm?: Paradigm;
  readonly framework?: 'react' | 'angular' | 'nest';
  readonly providerMetadata: ProviderMetadata;
}

export interface MetadataClient {
  readonly metadata: ClientMetadata;
}
