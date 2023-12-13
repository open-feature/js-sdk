import { AllProviderEvents, AnyProviderEvent } from './events';

export type EventMetadata = {
  [key: string]: string | boolean | number;
};

export type CommonEventDetails = {
  providerName: string;
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
  [AllProviderEvents.Ready]: ReadyEvent;
  [AllProviderEvents.Error]: ErrorEvent;
  [AllProviderEvents.Stale]: StaleEvent;
  [AllProviderEvents.ContextChanged]: CommonEventProps;
  [AllProviderEvents.ConfigurationChanged]: ConfigChangeEvent;
};

export type EventContext<  U extends Record<string, unknown> = Record<string, unknown>
> = EventMap[AllProviderEvents] & U;

export type EventDetails = EventContext & CommonEventDetails;
export type EventHandler = (eventDetails?: EventDetails) => Promise<unknown> | unknown;

export interface Eventing {
  /**
   * Adds a handler for the given provider event type.
   * The handlers are called in the order they have been added.
   * @param {ProviderEvents} eventType The provider event type to listen to
   * @param {EventHandler} handler The handler to run on occurrence of the event type
   */
  addHandler(eventType: AnyProviderEvent, handler: EventHandler): void;

  /**
   * Removes a handler for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to remove the listener for
   * @param {EventHandler} handler The handler to remove for the provider event type
   */
  removeHandler(eventType: AnyProviderEvent, handler: EventHandler): void;

  /**
   * Gets the current handlers for the given provider event type.
   * @param {ProviderEvents} eventType The provider event type to get the current handlers for
   * @returns {EventHandler[]} The handlers currently attached to the given provider event type
   */
  getHandlers(eventType: AnyProviderEvent): EventHandler[];
}
