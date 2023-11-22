import { Logger, ManageLogger, SafeLogger } from '../logger';
import { EventContext, EventDetails, EventHandler } from './eventing';
import { ProviderEvents } from './events';

/**
 * The GenericEventEmitter should only be used within the SDK. It supports additional properties that can be included
 * in the event details.
 */
export abstract class GenericEventEmitter<AdditionalContext extends Record<string, unknown> = Record<string, unknown>>
  implements ManageLogger<GenericEventEmitter<AdditionalContext>>
{
  protected abstract readonly eventEmitter: PlatformEventEmitter;

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

/**
 * This is an un-exported type that corresponds to NodeJS.EventEmitter.
 * We can't use that type here, because this module is used in both the browser, and the server.
 * In the server, node (or whatever server runtime) provider an implementation for this.
 * In the browser, we bundle in the popular 'events' package, which is a polyfill of NodeJS.EventEmitter.
 */
interface PlatformEventEmitter {
  addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  on(eventName: string | symbol, listener: (...args: any[]) => void): this;
  once(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  off(eventName: string | symbol, listener: (...args: any[]) => void): this;
  removeAllListeners(event?: string | symbol): this;
  setMaxListeners(n: number): this;
  getMaxListeners(): number;
  listeners(eventName: string | symbol): Function[];
  rawListeners(eventName: string | symbol): Function[];
  emit(eventName: string | symbol, ...args: any[]): boolean;
  listenerCount(eventName: string | symbol, listener?: Function): number;
  prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
  eventNames(): Array<string | symbol>;
}