import type { EvaluationLifeCycle, Eventing, ManageContext, ManageLogger, MetadataClient } from '@openfeature/core';
import type { Features } from '../evaluation';
import type { ProviderStatus } from '../provider';
import type { ProviderEvents } from '../events';
import type { Tracking } from '../tracking';

export interface Client
  extends
    EvaluationLifeCycle<Client>,
    Features,
    ManageContext<Client>,
    ManageLogger<Client>,
    Tracking,
    Eventing<ProviderEvents>,
    MetadataClient {
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
