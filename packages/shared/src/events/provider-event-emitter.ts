import type { ManageLogger } from '../logger';
import type { EventContext, EventHandler } from './eventing';
import type { AnyProviderEvent } from './events';

/**
 * Event emitter to be optionally implemented by providers.
 * Implemented by @see OpenFeatureEventEmitter.
 */
export interface ProviderEventEmitter<
  E extends AnyProviderEvent,
  AdditionalContext extends Record<string, unknown> = Record<string, unknown>,
> extends ManageLogger<ProviderEventEmitter<E, AdditionalContext>> {
  // here we use E, to restrict the events a provider can manually emit (PROVIDER_CONTEXT_CHANGED is emitted by the SDK)
  emit(eventType: E, context?: EventContext): void;

  addHandler(eventType: AnyProviderEvent, handler: EventHandler): void;

  removeHandler(eventType: AnyProviderEvent, handler: EventHandler): void;

  removeAllHandlers(eventType?: AnyProviderEvent): void;

  getHandlers(eventType: AnyProviderEvent): EventHandler[];
}
