import { Logger, ManageLogger, SafeLogger } from '../logger';
import { EventContext, EventDetails, EventHandler } from './eventing';
import { ProviderEvents } from './events';

export abstract class GenericEventEmitter<AdditionalContext extends Record<string, unknown> = Record<string, unknown>>
  implements ManageLogger<GenericEventEmitter<AdditionalContext>>
{
  protected abstract readonly eventEmitter: NodeJS.EventEmitter;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly _handlers = new WeakMap<EventHandler<any>, EventHandler<any>>();
  private _eventLogger?: Logger;

  constructor(private readonly globalLogger?: () => Logger) {}

  emit<T extends ProviderEvents>(eventType: T, context?: EventContext<T, AdditionalContext>): void {
    this.eventEmitter.emit(eventType, context);
  }

  addHandler<T extends ProviderEvents>(eventType: T, handler: EventHandler<T>): void {
    // The handlers have to be wrapped with an async function because if a synchronous functions throws an error,
    // the other handlers will not run.
    const asyncHandler = async (details?: EventDetails<T>) => {
      await handler(details);    
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

  protected get _logger() {
    return this._eventLogger ?? this.globalLogger?.();
  }
}