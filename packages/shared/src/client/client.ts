import { Metadata } from '../types';
import { ProviderMetadata } from '../provider/provider';

export interface ClientMetadata extends Metadata {
  /**
   * @deprecated alias of "domain", use domain instead
   */
  readonly name?: string;
  readonly domain?: string;
  readonly version?: string;
  readonly providerMetadata: ProviderMetadata;
}
