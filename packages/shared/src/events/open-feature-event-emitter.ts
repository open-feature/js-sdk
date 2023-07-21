import { Logger, ManageLogger, SafeLogger } from '../logger';
import EventEmitter from 'events';
import { ProviderEvents } from './events';
import { EventContext, EventDetails, EventHandler, CommonEventDetails } from './eventing';

abstract class GenericEventEmitter<AdditionalContext extends Record<string, unknown> = Record<string, unknown>>
  implements ManageLogger<GenericEventEmitter<AdditionalContext>>
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _handlers = new WeakMap<EventHandler<any>, EventHandler<any>>();
  private readonly eventEmitter = new EventEmitter({ captureRejections: true });
  private _eventLogger?: Logger;

  constructor(private readonly globalLogger?: () => Logger) {
    this.eventEmitter.on('error', (err) => {
      this._logger?.error('Error running event handler:', err);
    });
  }

  emit<T extends ProviderEvents>(eventType: T, context?: EventContext<T, AdditionalContext>): void {
    this.eventEmitter.emit(eventType, context);
  }

  addHandler<T extends ProviderEvents>(eventType: T, handler: EventHandler<T>): void {
    // The handlers have to be wrapped with an async function because if a synchronous functions throws an error,
    // the other handlers will not run.
    const asyncHandler = async (context?: EventDetails<T>) => {
      await handler(context);
    };
    // The async handler has to be written to the map, because we need to get the wrapper function when deleting a listener
    this._handlers.set(handler, asyncHandler);
    this.eventEmitter.on(eventType, asyncHandler);
  }

  removeHandler<T extends ProviderEvents>(eventType: T, handler: EventHandler<T>): void {
    // Get the wrapper function for this handler, to delete it from the event emitter
    const asyncHandler = this._handlers.get(handler) as EventHandler<T> | undefined;

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

  getHandlers<T extends ProviderEvents>(eventType: T): EventHandler<T>[] {
    return this.eventEmitter.listeners(eventType) as EventHandler<T>[];
  }

  setLogger(logger: Logger): this {
    this._eventLogger = new SafeLogger(logger);
    return this;
  }

  private get _logger() {
    return this._eventLogger ?? this.globalLogger?.();
  }
}

/**
 * The OpenFeatureEventEmitter can be used by provider developers to emit
 * events at various parts of the provider lifecycle.
 * 
 * NOTE: Ready and error events are automatically emitted by the SDK based on
 * the result of the initialize method.
 */
export class OpenFeatureEventEmitter extends GenericEventEmitter {};

/**
 * The InternalEventEmitter should only be used within the SDK. It extends the
 * OpenFeatureEventEmitter to include additional properties that can be included
 * in the event details.
 */
export class InternalEventEmitter extends GenericEventEmitter<CommonEventDetails> {};