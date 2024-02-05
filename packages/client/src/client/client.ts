import { ClientMetadata, EvaluationLifeCycle, Eventing, ManageLogger } from '@openfeature/core';
import { Features } from '../evaluation';
import { ProviderStatus } from '../provider';

export interface Client extends EvaluationLifeCycle<Client>, Features, ManageLogger<Client>, Eventing {
  readonly metadata: ClientMetadata;
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
