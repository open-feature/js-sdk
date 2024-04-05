import { FlagEvaluationOptions } from '@openfeature/web-sdk';

export type ReactFlagEvaluationOptions = {
  /**
   * Suspend flag evaluations while the provider is not ready.
   * Set to false if you don't want to show suspense fallbacks until the provider is initialized.
   * Defaults to true.
   */
  suspendUntilReady?: boolean;
  /**
   * Suspend flag evaluations while the provider's context is being reconciled.
   * Set to true if you want to show suspense fallbacks while flags are re-evaluated after context changes.
   * Defaults to false.
   */
  suspendWhileReconciling?: boolean;
  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  updateOnConfigurationChanged?: boolean;
  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  updateOnContextChanged?: boolean;
} & FlagEvaluationOptions;

export const DEFAULT_OPTIONS: ReactFlagEvaluationOptions = {
  updateOnContextChanged: true,
  updateOnConfigurationChanged: true,
  suspendUntilReady: true,
  suspendWhileReconciling: true,
};

export const getDefaultedOptions = (options?: ReactFlagEvaluationOptions) => ({ ...DEFAULT_OPTIONS, ...options });