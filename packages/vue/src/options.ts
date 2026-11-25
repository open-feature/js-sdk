import type { FlagEvaluationOptions } from '@openfeature/web-sdk';

export type VueFlagEvaluationOptions = FlagEvaluationOptions & {
  updateOnConfigurationChanged?: boolean;
  updateOnContextChanged?: boolean;
};

export type NormalizedOptions = Required<
  Pick<VueFlagEvaluationOptions, 'updateOnConfigurationChanged' | 'updateOnContextChanged'>
>;

export const DEFAULT_OPTIONS: NormalizedOptions = {
  updateOnConfigurationChanged: true,
  updateOnContextChanged: true,
};

export function normalizeOptions(options: VueFlagEvaluationOptions = {}): Partial<NormalizedOptions> {
  return {
    ...(typeof options.updateOnConfigurationChanged === 'boolean' && {
      updateOnConfigurationChanged: options.updateOnConfigurationChanged,
    }),
    ...(typeof options.updateOnContextChanged === 'boolean' && {
      updateOnContextChanged: options.updateOnContextChanged,
    }),
  };
}
