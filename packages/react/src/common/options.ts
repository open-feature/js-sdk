import { FlagEvaluationOptions } from '@openfeature/web-sdk';

export type ReactFlagEvaluationOptions = ({
  /**
   * Enable or disable all suspense functionality.
   * Cannot be used in conjunction with `suspendUntilReady` and `suspendWhileReconciling` options.
   */
  suspend?: boolean;
  suspendUntilReady?: never;
  suspendWhileReconciling?: never;
} | {
  /**
   * Suspend flag evaluations while the provider is not ready.
   * Set to false if you don't want to show suspense fallbacks until the provider is initialized.
   * Defaults to true.
   * Cannot be used in conjunction with `suspend` option.
   */
  suspendUntilReady?: boolean;
  /**
   * Suspend flag evaluations while the provider's context is being reconciled.
   * Set to true if you want to show suspense fallbacks while flags are re-evaluated after context changes.
   * Defaults to true.
   * Cannot be used in conjunction with `suspend` option.
   */
  suspendWhileReconciling?: boolean;
  suspend?: never;
}) & {
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

export type NormalizedOptions = Omit<ReactFlagEvaluationOptions, 'suspend'>;

/**
 * Default options.
 * DO NOT EXPORT PUBLICLY
 * @internal
 */
export const DEFAULT_OPTIONS: ReactFlagEvaluationOptions = {
  updateOnContextChanged: true,
  updateOnConfigurationChanged: true,
  suspendUntilReady: true,
  suspendWhileReconciling: true,
};

/**
 * Returns normalization options (all `undefined` fields removed, and `suspend` decomposed to `suspendUntilReady` and `suspendWhileReconciling`).
 * DO NOT EXPORT PUBLICLY
 * @internal
 * @param options options to normalize
 * @returns {NormalizedOptions} normalized options
 */
export const normalizeOptions: (options?: ReactFlagEvaluationOptions) => NormalizedOptions = (options?: ReactFlagEvaluationOptions) => {
  const defaultOptionsIfMissing = !options ? {} : options;
  // fall-back the suspense options
  const suspendUntilReady = 'suspendUntilReady' in defaultOptionsIfMissing ? defaultOptionsIfMissing.suspendUntilReady : defaultOptionsIfMissing.suspend;
  const suspendWhileReconciling = 'suspendWhileReconciling' in defaultOptionsIfMissing ? defaultOptionsIfMissing.suspendWhileReconciling : defaultOptionsIfMissing.suspend;
  return {
    updateOnContextChanged: defaultOptionsIfMissing.updateOnContextChanged,
    updateOnConfigurationChanged: defaultOptionsIfMissing.updateOnConfigurationChanged,
    // only return these if properly set (no undefined to allow overriding with spread)
    ...(typeof suspendUntilReady === 'boolean' && {suspendUntilReady}),
    ...(typeof suspendWhileReconciling === 'boolean' && {suspendWhileReconciling}),
  }
};
