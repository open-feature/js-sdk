import type {
  ClientMetadata,
  EvaluationLifeCycle,
  Eventing,
  ManageContext,
  ManageLogger,
} from '@openfeature/core';
import type { Features } from '../evaluation';
import type { ProviderStatus } from '../provider';
import type { ProviderEvents } from '../events';

export interface Client
  extends EvaluationLifeCycle<Client>,
    Features,
    ManageContext<Client>,
    ManageLogger<Client>,
    Eventing<ProviderEvents> {
  readonly metadata: ClientMetadata;
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
