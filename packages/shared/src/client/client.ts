import { ProviderMetadata } from '../provider/provider';

export interface ClientMetadata {
  /**
   * @deprecated alias of "domain", use domain instead
   */
  readonly name?: string;
  readonly domain?: string;
  readonly version?: string;
  readonly providerMetadata: ProviderMetadata;
}
