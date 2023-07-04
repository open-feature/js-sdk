import { ProviderEvents } from './events';

export type EventMetadata = {
  [key: string]: string | boolean | number;
};

export type EventDetails = {
  clientName?: string;
  message?: string;
  flagsChanged?: string[];
  metadata?: EventMetadata;
};

export type EventHandler = (eventDetails?: EventDetails) => Promise<unknown> | unknown;

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
