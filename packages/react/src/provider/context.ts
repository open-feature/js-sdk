import { Client } from '@openfeature/web-sdk';
import React from 'react';
import { NormalizedOptions, ReactFlagEvaluationOptions, normalizeOptions } from '../common/options';

/**
 * The underlying React context.
 * DO NOT EXPORT PUBLICLY
 * @internal
 */
export const Context = React.createContext<{ client: Client; options: ReactFlagEvaluationOptions } | undefined>(undefined);

/**
 * Get a normalized copy of the options used for this OpenFeatureProvider, see {@link normalizeOptions}.
 * DO NOT EXPORT PUBLICLY
 * @internal
 * @returns {NormalizedOptions} normalized options the defaulted options, not defaulted or normalized.
 */
export function useProviderOptions(): NormalizedOptions {
  const { options } = React.useContext(Context) || {};
  return normalizeOptions(options);
}
