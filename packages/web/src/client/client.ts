import { ClientMetadata, EvaluationLifeCycle, Eventing, ManageLogger } from '@openfeature/core';
import { Features } from '../evaluation';
import { ProviderStatus } from '../provider';
import { ProviderEvents } from '../events';
import { Tracking } from '../tracking';

export interface Client
  extends EvaluationLifeCycle<Client>,
    Features,
    ManageLogger<Client>,
    Eventing<ProviderEvents>,
    Tracking {
  readonly metadata: ClientMetadata;
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
