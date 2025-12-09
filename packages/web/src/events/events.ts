import { ClientProviderEvents } from '@openfeature/core';

export { ClientProviderEvents as ProviderEvents };

/**
 * A subset of events that can be directly emitted by providers.
 */
export type ProviderEmittableEvents = Exclude<ClientProviderEvents, ClientProviderEvents.ContextChanged>;
