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
  /**
   * Identifies the OpenFeature framework SDK the client was obtained through.
   *
   * This field is only populated when the client is accessed through the
   * corresponding framework wrapper (e.g. `<OpenFeatureProvider>` for React,
   * `FeatureFlagService` / the `*FeatureFlag` directives for Angular, or
   * Nest's `@OpenFeatureClient()` injection). Clients obtained by calling
   * `OpenFeature.getClient(...)` directly from `@openfeature/web-sdk` or
   * `@openfeature/server-sdk` will leave `framework` undefined, even when
   * used inside a framework application.
   */
  readonly framework?: 'react' | 'angular' | 'nest';
  readonly providerMetadata: ProviderMetadata;
}

export interface MetadataClient {
  readonly metadata: ClientMetadata;
}
