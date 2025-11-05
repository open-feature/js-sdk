import type { ClientMetadata, EvaluationLifeCycle, Eventing, ManageLogger } from '@openfeature/core';
import type { Features, ContextChangeSubscriptions } from '../evaluation';
import type { ProviderStatus } from '../provider';
import type { ProviderEvents } from '../events';
import type { Tracking } from '../tracking';

export interface Client
  extends
    EvaluationLifeCycle<Client>,
    Features,
    ContextChangeSubscriptions,
    ManageLogger<Client>,
    Eventing<ProviderEvents>,
    Tracking {
  readonly metadata: ClientMetadata;
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
