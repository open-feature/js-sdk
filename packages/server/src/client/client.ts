import { ClientMetadata, EvaluationLifeCycle, Eventing, ManageContext, ManageLogger } from '@openfeature/core';
import { Features } from '../evaluation';

export interface Client
  extends EvaluationLifeCycle<Client>,
    Features,
    ManageContext<Client>,
    ManageLogger<Client>,
    Eventing {
  readonly metadata: ClientMetadata;
}
