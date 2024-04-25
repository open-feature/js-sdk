import { ErrorCode } from '../evaluation';
import { ClientProviderEvents, ServerProviderEvents, AnyProviderEvent } from './events';

export type EventMetadata = {
  [key: string]: string | boolean | number;
};

export type CommonEventDetails = {
  readonly providerName: string;
  /**
   * @deprecated alias of "domain", use domain instead
   */
  readonly clientName?: string;
  readonly domain?: string;
};

type CommonEventProps = {
  readonly message?: string;
  readonly metadata?: EventMetadata;
};

export type ReadyEvent = CommonEventProps;
export type ErrorEvent = CommonEventProps;
export type StaleEvent = CommonEventProps;
export type ReconcilingEvent = CommonEventProps & { readonly errorCode: ErrorCode };
export type ConfigChangeEvent = CommonEventProps & { readonly flagsChanged?: string[] };

type ServerEventMap = {
  [ServerProviderEvents.Ready]: ReadyEvent;
  [ServerProviderEvents.Error]: ErrorEvent;
  [ServerProviderEvents.Stale]: StaleEvent;
  [ServerProviderEvents.ConfigurationChanged]: ConfigChangeEvent;
};

type ClientEventMap = {
  [ClientProviderEvents.Ready]: ReadyEvent;
  [ClientProviderEvents.Error]: ErrorEvent;
  [ClientProviderEvents.Stale]: StaleEvent;
  [ClientProviderEvents.ConfigurationChanged]: ConfigChangeEvent;
  [ClientProviderEvents.Reconciling]: CommonEventProps;
  [ClientProviderEvents.ContextChanged]: CommonEventProps;
};

type ServerNotChangeEvents =
  | ServerProviderEvents.Ready
  | ServerProviderEvents.Error
  | ServerProviderEvents.Stale;
type ClientNotChangeEvents =
  | ClientProviderEvents.Ready
  | ClientProviderEvents.Error
  | ClientProviderEvents.Stale
  | ClientProviderEvents.ContextChanged
  | ClientProviderEvents.Reconciling;
export type NotChangeEvents = ServerNotChangeEvents | ClientNotChangeEvents;

export type EventContext<
  U extends Record<string, unknown> = Record<string, unknown>,
  T extends ServerProviderEvents | ClientProviderEvents = ServerProviderEvents | ClientProviderEvents,
> = (T extends ClientProviderEvents ? ClientEventMap[T] : T extends ServerProviderEvents ? ServerEventMap[T] : never) &
  U;

export type EventDetails<
  T extends ServerProviderEvents | ClientProviderEvents = ServerProviderEvents | ClientProviderEvents,
> = EventContext<Record<string, unknown>, T> & CommonEventDetails;
export type EventHandler<
  T extends ServerProviderEvents | ClientProviderEvents = ServerProviderEvents | ClientProviderEvents,
> = (eventDetails?: EventDetails<T>) => Promise<unknown> | unknown;

export interface Eventing<T extends ServerProviderEvents | ClientProviderEvents> {
  /**
   * Adds a handler for the given provider event type.
   * The handlers are called in the order they have been added.
   * @param eventType The provider event type to listen to
   * @param {EventHandler} handler The handler to run on occurrence of the event type
   */
  addHandler(
    eventType: T extends ClientProviderEvents
      ? ClientProviderEvents.ConfigurationChanged
      : ServerProviderEvents.ConfigurationChanged,
    handler: EventHandler<
      T extends ClientProviderEvents
        ? ClientProviderEvents.ConfigurationChanged
        : ServerProviderEvents.ConfigurationChanged
    >,
  ): void;
  addHandler(
    eventType: T extends ClientProviderEvents ? ClientNotChangeEvents : ServerNotChangeEvents,
    handler: EventHandler<T extends ClientProviderEvents ? ClientNotChangeEvents : ServerNotChangeEvents>,
  ): void;
  addHandler(
    eventType: T extends ClientProviderEvents ? ClientProviderEvents : ServerProviderEvents,
    handler: EventHandler<T extends ClientProviderEvents ? ClientProviderEvents : ServerProviderEvents>,
  ): void;

  /**
   * Removes a handler for the given provider event type.
   * @param {AnyProviderEvent} eventType The provider event type to remove the listener for
   * @param {EventHandler} handler The handler to remove for the provider event type
   */
  removeHandler(eventType: T, handler: EventHandler<T>): void;

  /**
   * Gets the current handlers for the given provider event type.
   * @param {AnyProviderEvent} eventType The provider event type to get the current handlers for
   * @returns {EventHandler[]} The handlers currently attached to the given provider event type
   */
  getHandlers(eventType: T): EventHandler<T>[];
}
