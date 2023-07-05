import { Metadata } from '../types';
import { ProviderMetadata } from '../provider/provider';

export interface ClientMetadata extends Metadata {
  readonly version?: string;
  readonly name?: string;
  readonly providerMetadata: ProviderMetadata;
}
