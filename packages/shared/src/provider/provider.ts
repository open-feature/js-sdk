import { OpenFeatureEventEmitter } from '../events';
import { Metadata } from '../types';
import { EvaluationContext } from '../evaluation';

export enum ProviderStatus {
  NOT_READY = 'NOT_READY',
  READY = 'READY',
  ERROR = 'ERROR',
}

export interface ProviderMetadata extends Metadata {
  readonly name: string;
}

export interface CommonProvider {
  readonly metadata: ProviderMetadata;
  readonly status?: ProviderStatus;

  /**
   * An event emitter for ProviderEvents.
   * @see ProviderEvents
   */
  events?: OpenFeatureEventEmitter;

  onClose?(): Promise<void>;

  /**
   * A handler function used to setup the provider.
   * Called by the SDK after the provider is set.
   * When the returned promise resolves, the SDK fires the ProviderEvents.Ready event.
   * If the returned promise rejects, the SDK fires the ProviderEvents.Error event.
   * Use this function to perform any context-dependent setup within the provider.
   * @param context
   */
  initialize?(context?: EvaluationContext): Promise<void>;
}
