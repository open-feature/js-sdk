import { CommonEventDetails, GenericEventEmitter } from '@openfeature/core';

/**
 * The InternalEventEmitter is not exported publicly and should only be used within the SDK. It extends the
 * OpenFeatureEventEmitter to include additional properties that can be included
 * in the event details.
 */
export abstract class InternalEventEmitter extends GenericEventEmitter<CommonEventDetails> {};