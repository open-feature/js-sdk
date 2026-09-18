import type { NormalizedOptions, SvelteFlagEvaluationOptions } from '../options';

/**
 * Default options.
 * @internal
 */
export const DEFAULT_OPTIONS: Required<NormalizedOptions> = {
  updateOnContextChanged: true,
  updateOnConfigurationChanged: true,
};

/**
 * Returns only the update flags that are explicitly set, so the result can be spread over other option layers.
 * @internal
 * @param {SvelteFlagEvaluationOptions} options options to normalize
 * @returns {NormalizedOptions} normalized options
 */
export const normalizeOptions: (options?: SvelteFlagEvaluationOptions) => NormalizedOptions = (
  options: SvelteFlagEvaluationOptions = {},
) => {
  const { updateOnContextChanged, updateOnConfigurationChanged } = options;

  return {
    ...(typeof updateOnContextChanged === 'boolean' && { updateOnContextChanged }),
    ...(typeof updateOnConfigurationChanged === 'boolean' && { updateOnConfigurationChanged }),
  };
};
