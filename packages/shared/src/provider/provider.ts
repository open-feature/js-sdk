import { OpenFeatureEventEmitter } from '../events';
import { Metadata } from '../types';
import { EvaluationContext } from '../evaluation';
import { Category } from '../types/category';

/**
 * The state of the provider.
 */
export enum ProviderStatus {
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
}

/**
 * Static data about the provider.
 */
export interface ProviderMetadata extends Metadata {
  readonly name: string;
}

export interface CommonProvider {
  readonly metadata: ProviderMetadata;

  /**
   * The category represents the intended use of the provider.
   *
  */
  readonly category?: Category;

  /**
   * Returns a representation of the current readiness of the provider.
   * If the provider needs to be initialized, it should return {@link ProviderStatus.READY}.
   * If the provider is in an error state, it should return {@link ProviderStatus.ERROR}.
   * If the provider is functioning normally, it should return {@link ProviderStatus.NOT_READY}.
   * 
   * _Providers which do not implement this method are assumed to be ready immediately._
   */
  readonly status?: ProviderStatus;

  /**
   * An event emitter for ProviderEvents.
   * @see ProviderEvents
   */
  events?: OpenFeatureEventEmitter;

  /**
   * A function used to shut down the provider.
   * Called when this provider is replaced with a new one, or when the OpenFeature is shut down.
   */
  onClose?(): Promise<void>;

  /**
   * A function used to setup the provider.
   * Called by the SDK after the provider is set if the provider's status is {@link ProviderStatus.NOT_READY}.
   * When the returned promise resolves, the SDK fires the ProviderEvents.Ready event.
   * If the returned promise rejects, the SDK fires the ProviderEvents.Error event.
   * Use this function to perform any context-dependent setup within the provider.
   * @param context
   */
  initialize?(context?: EvaluationContext): Promise<void>;
}