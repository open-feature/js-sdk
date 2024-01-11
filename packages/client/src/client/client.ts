import { ClientMetadata, EvaluationLifeCycle, Eventing, ManageLogger, ProviderStatus } from '@openfeature/core';
import { Features } from '../evaluation';

export interface Client extends EvaluationLifeCycle<Client>, Features, ManageLogger<Client>, Eventing {
  readonly metadata: ClientMetadata;
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
