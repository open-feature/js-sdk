import type { ReactFlagEvaluationOptions, NormalizedOptions } from '../options';

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
export const normalizeOptions: (options?: ReactFlagEvaluationOptions) => NormalizedOptions = (
  options: ReactFlagEvaluationOptions = {},
) => {
  const updateOnContextChanged = options.updateOnContextChanged;
  const updateOnConfigurationChanged = options.updateOnConfigurationChanged;

  // fall-back the suspense options to the catch-all `suspend` property
  const suspendUntilReady = 'suspendUntilReady' in options ? options.suspendUntilReady : options.suspend;
  const suspendWhileReconciling =
    'suspendWhileReconciling' in options ? options.suspendWhileReconciling : options.suspend;

  return {
    // only return these if properly set (no undefined to allow overriding with spread)
    ...(typeof suspendUntilReady === 'boolean' && { suspendUntilReady }),
    ...(typeof suspendWhileReconciling === 'boolean' && { suspendWhileReconciling }),
    ...(typeof updateOnContextChanged === 'boolean' && { updateOnContextChanged }),
    ...(typeof updateOnConfigurationChanged === 'boolean' && { updateOnConfigurationChanged }),
  };
};
