import type { FlagEvaluationOptions } from '@openfeature/web-sdk';

export type ReactFlagEvaluationOptions = ({
  /**
   * Enable or disable all suspense functionality.
   * Cannot be used in conjunction with `suspendUntilReady` and `suspendWhileReconciling` options.
   * @experimental Suspense is an experimental feature subject to change in future versions.
   */
  suspend?: boolean;
  suspendUntilReady?: never;
  suspendWhileReconciling?: never;
} | {
  /**
   * Suspend flag evaluations while the provider is not ready.
   * Set to false if you don't want to show suspense fallbacks until the provider is initialized.
   * Defaults to false.
   * Cannot be used in conjunction with `suspend` option.
   * @experimental Suspense is an experimental feature subject to change in future versions.
   */
  suspendUntilReady?: boolean;
  /**
   * Suspend flag evaluations while the provider's context is being reconciled.
   * Set to true if you want to show suspense fallbacks while flags are re-evaluated after context changes.
   * Defaults to false.
   * Cannot be used in conjunction with `suspend` option.
   * @experimental Suspense is an experimental feature subject to change in future versions.
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
  suspendUntilReady: false,
  suspendWhileReconciling: false,
};

/**
 * Returns normalization options (all `undefined` fields removed, and `suspend` decomposed to `suspendUntilReady` and `suspendWhileReconciling`).
 * DO NOT EXPORT PUBLICLY
 * @internal
 * @param {ReactFlagEvaluationOptions} options  options to normalize
 * @returns {NormalizedOptions} normalized options
 */
export const normalizeOptions: (options?: ReactFlagEvaluationOptions) => NormalizedOptions = (options: ReactFlagEvaluationOptions = {}) => {
  const updateOnContextChanged = options.updateOnContextChanged;
  const updateOnConfigurationChanged = options.updateOnConfigurationChanged;

  // fall-back the suspense options to the catch-all `suspend` property 
  const suspendUntilReady = 'suspendUntilReady' in options ? options.suspendUntilReady : options.suspend;
  const suspendWhileReconciling = 'suspendWhileReconciling' in options ? options.suspendWhileReconciling : options.suspend;

  return {
    // only return these if properly set (no undefined to allow overriding with spread)
    ...(typeof suspendUntilReady === 'boolean' && {suspendUntilReady}),
    ...(typeof suspendWhileReconciling === 'boolean' && {suspendWhileReconciling}),
    ...(typeof updateOnContextChanged === 'boolean' && {updateOnContextChanged}),
    ...(typeof updateOnConfigurationChanged === 'boolean' && {updateOnConfigurationChanged}),
  };
};
