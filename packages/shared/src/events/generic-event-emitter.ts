import { Logger, ManageLogger, SafeLogger } from '../logger';
import { EventContext, EventDetails, EventHandler } from './eventing';
import { AllProviderEvents, AnyProviderEvent } from './events';

/**
 * The GenericEventEmitter should only be used within the SDK. It supports additional properties that can be included
 * in the event details.
 */
export abstract class GenericEventEmitter<E extends AnyProviderEvent, AdditionalContext extends Record<string, unknown> = Record<string, unknown>>
  implements ManageLogger<GenericEventEmitter<E, AdditionalContext>>
{
  protected abstract readonly eventEmitter: PlatformEventEmitter;

  private readonly _handlers: { [key in AnyProviderEvent]: WeakMap<EventHandler, EventHandler>} = {
    [AllProviderEvents.ConfigurationChanged]: new WeakMap<EventHandler, EventHandler>(),
    [AllProviderEvents.ContextChanged]: new WeakMap<EventHandler, EventHandler>(),
    [AllProviderEvents.Ready]: new WeakMap<EventHandler, EventHandler>(),
    [AllProviderEvents.Error]: new WeakMap<EventHandler, EventHandler>(),
    [AllProviderEvents.Stale]: new WeakMap<EventHandler, EventHandler>(),
  };
  private _eventLogger?: Logger;

  constructor(private readonly globalLogger?: () => Logger) {}

  // here we use E, to restrict the events a provider can manually emit (PROVIDER_CONTEXT_CHANGED is emitted by the SDK)
  emit(eventType: E, context?: EventContext): void {
    this.eventEmitter.emit(eventType, context);
  }

  addHandler(eventType: AnyProviderEvent, handler: EventHandler): void {
    // The handlers have to be wrapped with an async function because if a synchronous functions throws an error,
    // the other handlers will not run.
    const asyncHandler = async (details?: EventDetails) => {
      await handler(details);    
    };
    // The async handler has to be written to the map, because we need to get the wrapper function when deleting a listener
    this._handlers[eventType].set(handler, asyncHandler);
    this.eventEmitter.on(eventType, asyncHandler);
  }

  removeHandler(eventType: AnyProviderEvent, handler: EventHandler): void {
    // Get the wrapper function for this handler, to delete it from the event emitter
    const asyncHandler = this._handlers[eventType].get(handler) as EventHandler | undefined;

    if (!asyncHandler) {
      this._logger?.debug(`no such handler found: ${handler?.name}`);
      return;
    }

    this.eventEmitter.removeListener(eventType, asyncHandler);
  }

  removeAllHandlers(eventType?: AnyProviderEvent): void {
    // If giving undefined, the listeners are not removed, so we have to check explicitly
    if (eventType) {
      this.eventEmitter.removeAllListeners(eventType);
    } else {
      this.eventEmitter.removeAllListeners();
    }
  }

  getHandlers(eventType: AnyProviderEvent): EventHandler[] {
    return this.eventEmitter.listeners(eventType) as EventHandler[];
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
 * In the server, node (or whatever server runtime) provides an implementation for this.
 * In the browser, we bundle in the popular 'events' package, which is a polyfill of NodeJS.EventEmitter.
 */
/* eslint-disable */
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