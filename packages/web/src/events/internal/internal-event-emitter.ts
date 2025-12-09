import type { CommonEventDetails } from '@openfeature/core';
import { GenericEventEmitter } from '@openfeature/core';
import type { ProviderEvents } from '../events';

/**
 * The InternalEventEmitter is not exported publicly and should only be used within the SDK. It extends the
 * OpenFeatureEventEmitter to include additional properties that can be included
 * in the event details.
 */
export abstract class InternalEventEmitter extends GenericEventEmitter<ProviderEvents, CommonEventDetails> {}
