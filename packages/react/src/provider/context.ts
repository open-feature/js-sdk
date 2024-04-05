import React from 'react';
import { ReactFlagEvaluationOptions, getDefaultedOptions } from '../common/options';
import { Client } from '@openfeature/web-sdk';

/**
 * The underlying React context.
 * DO NOT EXPORT PUBLICLY
 * @internal
 */
export const Context = React.createContext<{ client: Client; options: ReactFlagEvaluationOptions } | undefined>(undefined);

/**
 * Get a copy of the effective options used for this OpenFeatureProvider.
 * DO NOT EXPORT PUBLICLY
 * @internal
 * @returns {ReactFlagEvaluationOptions} options the defaulted options
 */
export function useProviderOptions() {
  const { options } = React.useContext(Context) || {};
  return getDefaultedOptions(options);
}
