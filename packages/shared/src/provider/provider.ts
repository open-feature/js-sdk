import type { EvaluationContext } from '../evaluation';
import type { AnyProviderEvent, ProviderEventEmitter } from '../events';
import type { TrackingEventDetails } from '../tracking';
import type { Metadata, Paradigm } from '../types';

// TODO: with TypeScript 5+, we can use computed string properties,
// so we can extract all of these into a shared set of string consts and use that in both enums
// for now we have duplicated them.

/**
 * The state of the provider.
 * Note that the provider's state is handled by the SDK.
 */
export enum ServerProviderStatus {
  /**
   * The provider has not been initialized and cannot yet evaluate flags.
   */
  NOT_READY = 'NOT_READY',

  /**
   * The provider is ready to resolve flags.
   */
  READY = 'READY',

  /**
   * The provider is in an error state and unable to evaluate flags.
   */
  ERROR = 'ERROR',

  /**
   * The provider's cached state is no longer valid and may not be up-to-date with the source of truth.
   */
  STALE = 'STALE',

  /**
   * The provider has entered an irrecoverable error state.
   */
  FATAL = 'FATAL',
}

/**
 * The state of the provider.
 * Note that the provider's state is handled by the SDK.
 */
export enum ClientProviderStatus {
  /**
   * The provider has not been initialized and cannot yet evaluate flags.
   */
  NOT_READY = 'NOT_READY',

  /**
   * The provider is ready to resolve flags.
   */
  READY = 'READY',

  /**
   * The provider is in an error state and unable to evaluate flags.
   */
  ERROR = 'ERROR',

  /**
   * The provider's cached state is no longer valid and may not be up-to-date with the source of truth.
   */
  STALE = 'STALE',

  /**
   * The provider has entered an irrecoverable error state.
   */
  FATAL = 'FATAL',

  /**
   * The provider is reconciling its state with a context change.
   */
  RECONCILING = 'RECONCILING',
}

/**
 * A type representing any possible ProviderStatus (server or client side).
 * In most cases, you probably want to import `ProviderStatus` from the respective SDK.
 */
export { ClientProviderStatus as AllProviderStatus };

/**
 * Static data about the provider.
 */
export interface ProviderMetadata extends Readonly<Metadata> {
  readonly name: string;
}

export interface CommonProvider<S extends ClientProviderStatus | ServerProviderStatus> {
  readonly metadata: ProviderMetadata;

  /**
   * Represents where the provider is intended to be run. If defined,
   * the SDK will enforce that the defined paradigm at runtime.
   */
  readonly runsOn?: Paradigm;

  // TODO: in the future we could make this a never to force provider to remove it.
  /**
   * @deprecated the SDK now maintains the provider's state; there's no need for providers to implement this field.
   * Returns a representation of the current readiness of the provider.
   *
   * _Providers which do not implement this method are assumed to be ready immediately._
   */
  readonly status?: S;

  /**
   * An event emitter for ProviderEvents.
   * @see ProviderEvents
   */
  events?: ProviderEventEmitter<AnyProviderEvent>;

  /**
   * A function used to shut down the provider.
   * Called when this provider is replaced with a new one, or when the OpenFeature is shut down.
   */
  onClose?(): Promise<void>;

  /**
   * A function used to setup the provider.
   * Called by the SDK after the provider is set if the provider's status is NOT_READY.
   * When the returned promise resolves, the SDK fires the ProviderEvents.Ready event.
   * If the returned promise rejects, the SDK fires the ProviderEvents.Error event.
   * Use this function to perform any context-dependent setup within the provider.
   * @param context
   */
  initialize?(context?: EvaluationContext): Promise<void>;

  /**
   * Track a user action or application state, usually representing a business objective or outcome.
   * @param trackingEventName
   * @param context
   * @param trackingEventDetails
   */
  track?(trackingEventName: string, context?: EvaluationContext, trackingEventDetails?: TrackingEventDetails): void;
}
