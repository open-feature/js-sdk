import type { ClientMetadata, EvaluationLifeCycle, Eventing, ManageLogger } from '@openfeature/core';
import type { Features } from '../evaluation';
import type { ProviderStatus } from '../provider';
import type { ProviderEvents } from '../events';
import type { Tracking } from '../tracking';
import type { OpenFeatureAPI } from '../open-feature';

export interface ClientMetadataWithSDK extends ClientMetadata {
  readonly sdk?: OpenFeatureAPI;
}

export interface Client
  extends EvaluationLifeCycle<Client>, Features, ManageLogger<Client>, Eventing<ProviderEvents>, Tracking {
  readonly metadata: ClientMetadataWithSDK;
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
