import {
  ClientMetadata,
  EvaluationLifeCycle,
  Eventing,
  ManageContext,
  ManageLogger,
} from '@openfeature/core';
import { Features } from '../evaluation';
import { ProviderStatus } from '../provider';
import { ProviderEvents } from '../events';
import { Tracking } from '../tracking';

export interface Client
  extends EvaluationLifeCycle<Client>,
    Features,
    ManageContext<Client>,
    ManageLogger<Client>,
    Tracking,
    Eventing<ProviderEvents> {
  readonly metadata: ClientMetadata;
  /**
   * Returns the status of the associated provider.
   */
  readonly providerStatus: ProviderStatus;
}
