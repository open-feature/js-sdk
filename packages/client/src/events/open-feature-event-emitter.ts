import { GenericEventEmitter } from '@openfeature/core';
import { EventEmitter } from 'eventemitter3';
import { ProviderEmittableEvents } from './events';

/**
 * The OpenFeatureEventEmitter can be used by provider developers to emit
 * events at various parts of the provider lifecycle.
 *
 * NOTE: Ready and error events are automatically emitted by the SDK based on
 * the result of the initialize method.
 */
export class OpenFeatureEventEmitter extends GenericEventEmitter<ProviderEmittableEvents> {
  protected readonly eventEmitter = new EventEmitter();

  constructor() {
    super();
  }
}
