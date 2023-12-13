import { ClientProviderEvents } from '@openfeature/core';

export { ClientProviderEvents as ProviderEvents};
export type ProviderEmittableEvents = Exclude<ClientProviderEvents, ClientProviderEvents.ContextChanged>;