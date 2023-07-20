import { ProviderEvents } from './events';

export type EventMetadata = {
  [key: string]: string | boolean | number;
};

export type CommonEventDetails = {
  clientName?: string;
};

type CommonEventProps = {
  message?: string;
  metadata?: EventMetadata;
};

export type ReadyEvent = CommonEventProps;
export type ErrorEvent = CommonEventProps;
export type StaleEvent = CommonEventProps;
export type ConfigChangeEvent = CommonEventProps & { flagsChanged?: string[] };

type EventMap = {
  [ProviderEvents.Ready]: ReadyEvent;
  [ProviderEvents.Error]: ErrorEvent;
  [ProviderEvents.Stale]: StaleEvent;
  [ProviderEvents.ConfigurationChanged]: ConfigChangeEvent;
};

export type EventContext<
  T extends ProviderEvents,
  U extends Record<string, unknown> = Record<string, unknown>
> = EventMap[T] & U;

export type EventDetails<T extends ProviderEvents> = EventContext<T> & CommonEventDetails;
export type EventHandler<T extends ProviderEvents> = (eventDetails?: EventDetails<T>) => Promise<unknown> | unknown;

export interface Eventing {
  /**
   * Adds a handler for the given provider event type.
   * The handlers are called in the order they have been added.
   * @param {ProviderEvents} eventType The provider event type to listen to
   * @param {EventHandler} handler The handler to run on occurrence of the event type
   */
  addHandler<T extends ProviderEvents>(eventType: T, handler: EventHandler<T>): void;

  /**
   * Removes a handler for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to remove the listener for
   * @param {EventHandler} handler The handler to remove for the provider event type
   */
  removeHandler<T extends ProviderEvents>(eventType: T, handler: EventHandler<T>): void;

  /**
   * Gets the current handlers for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to get the current handlers for
   * @returns {EventHandler[]} The handlers currently attached to the given provider event type
   */
  getHandlers<T extends ProviderEvents>(eventType: T): EventHandler<T>[];
}
