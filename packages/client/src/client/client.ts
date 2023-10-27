import { ClientMetadata, EvaluationLifeCycle, Eventing, ManageLogger } from '@openfeature/core';
import { Features } from '../evaluation';

export interface Client extends EvaluationLifeCycle<Client>, Features, ManageLogger<Client>, Eventing {
  readonly metadata: ClientMetadata;
}
