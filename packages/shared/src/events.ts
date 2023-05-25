import { Logger, ManageLogger } from './types';
import EventEmitter from 'events';

export type EventMetadata = {
  [key: string]: string | boolean | number;
};

export type EventDetails = {
  clientName?: string;
  message?: string;
  flagsChanged?: string[];
  metadata?: EventMetadata;
};

export type EventHandler = (eventDetails?: EventDetails) => Promise<unknown>;

export interface Eventing {
  /**
   * Adds a handler for the given provider event type.
   * The handlers are called in the order they have been added.
   * @param {ProviderEvents} eventType The provider event type to listen to
   * @param {EventHandler} handler The handler to run on occurrence of the event type
   */
  addHandler(eventType: ProviderEvents, handler: EventHandler): void;

  /**
   * Removes a handler for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to remove the listener for
   * @param {EventHandler} handler The handler to remove for the provider event type
   */
  removeHandler(eventType: ProviderEvents, handler: EventHandler): void;

  /**
   * Gets the current handlers for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to get the current handlers for
   * @returns {EventHandler[]} The handlers currently attached to the given provider event type
   */
  getHandlers(eventType: ProviderEvents): EventHandler[];
}

export enum ProviderEvents {
  /**
   * The provider is ready to evaluate flags.
   */
  Ready = 'PROVIDER_READY',

  /**
   * The provider is in an error state.
   */
  Error = 'PROVIDER_ERROR',

  /**
   * The flag configuration in the source-of-truth has changed.
   */
  ConfigurationChanged = 'PROVIDER_CONFIGURATION_CHANGED',

  /**
   * The provider's cached state is not longer valid and may not be up-to-date with the source of truth.
   */
  Stale = 'PROVIDER_STALE',
}

export class OpenFeatureEventEmitter implements ManageLogger<OpenFeatureEventEmitter> {
  private _eventLogger?: Logger;
  private eventEmitter = new EventEmitter({ captureRejections: true });

  constructor(private readonly globalLogger?: () => Logger) {
    this.eventEmitter.on('error', (err) => {
      this._logger?.error('Error running event handler:', err);
    });
  }

  emit(eventType: ProviderEvents, context?: EventDetails): void {
    this.eventEmitter.emit(eventType, context);
  }

  addHandler(eventType: ProviderEvents, handler: EventHandler): void {
    this.eventEmitter.on(eventType, handler);
  }

  removeHandler(eventType: ProviderEvents, handler: EventHandler): void {
    this.eventEmitter.removeListener(eventType, handler);
  }

  removeAllHandlers(eventType?: ProviderEvents): void {
    // If giving undefined, the listeners are not removed, so we have to check explicitly
    if (eventType) {
      this.eventEmitter.removeAllListeners(eventType);
    } else {
      this.eventEmitter.removeAllListeners();
    }
  }

  getHandlers(eventType: ProviderEvents): EventHandler[] {
    return this.eventEmitter.listeners(eventType) as EventHandler[];
  }

  setLogger(logger: Logger): this {
    this._eventLogger = logger;
    return this;
  }

  private get _logger() {
    return this._eventLogger || this.globalLogger?.();
  }
}
