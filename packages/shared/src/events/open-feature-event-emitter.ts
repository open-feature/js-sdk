import { Logger, ManageLogger, SafeLogger } from '../logger';
import EventEmitter from 'events';
import { ProviderEvents } from './events';
import { EventDetails, EventHandler } from './eventing';

export class OpenFeatureEventEmitter implements ManageLogger<OpenFeatureEventEmitter> {
  private readonly _handlers = new WeakMap<EventHandler, EventHandler>();
  private readonly eventEmitter = new EventEmitter({ captureRejections: true });
  private _eventLogger?: Logger;

  constructor(private readonly globalLogger?: () => Logger) {
    this.eventEmitter.on('error', (err) => {
      this._logger?.error('Error running event handler:', err);
    });
  }

  emit(eventType: ProviderEvents, context?: EventDetails): void {
    this.eventEmitter.emit(eventType, context);
  }

  addHandler(eventType: ProviderEvents, handler: EventHandler): void {
    // The handlers have to be wrapped with an async function because if a synchronous functions throws an error,
    // the other handlers will not run.
    const asyncHandler = async (context?: EventDetails) => {
      await handler(context);
    };
    // The async handler has to be written to the map, because we need to get the wrapper function when deleting a listener
    this._handlers.set(handler, asyncHandler);
    this.eventEmitter.on(eventType, asyncHandler);
  }

  removeHandler(eventType: ProviderEvents, handler: EventHandler): void {
    // Get the wrapper function for this handler, to delete it from the event emitter
    const asyncHandler = this._handlers.get(handler);

    if (!asyncHandler) {
      return;
    }

    this.eventEmitter.removeListener(eventType, asyncHandler);
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
    this._eventLogger = new SafeLogger(logger);
    return this;
  }

  private get _logger() {
    return this._eventLogger || this.globalLogger?.();
  }
}
