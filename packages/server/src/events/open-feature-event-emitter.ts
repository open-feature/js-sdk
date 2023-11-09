import { GenericEventEmitter } from '@openfeature/core';
import EventEmitter from 'events';

/**
 * The OpenFeatureEventEmitter can be used by provider developers to emit
 * events at various parts of the provider lifecycle.
 * 
 * NOTE: Ready and error events are automatically emitted by the SDK based on
 * the result of the initialize method.
 */
export class OpenFeatureEventEmitter extends GenericEventEmitter {
  protected readonly eventEmitter = new EventEmitter({ captureRejections: true });

   constructor() {
      super();
      this.eventEmitter.on('error', (err) => {
        this._logger?.error('Error running event handler:', err);
      });
    }
};