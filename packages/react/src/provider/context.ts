import React from 'react';
import { ReactFlagEvaluationOptions, getDefaultedOptions } from '../common/options';
import { Client } from '@openfeature/web-sdk';

// DO NOT EXPORT PUBLICLY
export const Context = React.createContext<{ client: Client; options: ReactFlagEvaluationOptions } | undefined>(undefined);

/**
 * Get a copy of the effective options used for this OpenFeatureProvider.
 * DO NOT EXPORT PUBLICLY
 * @returns {ReactFlagEvaluationOptions} options the defaulted options
 */
export function useProviderOptions() {
  const { options } = React.useContext(Context) || {};
  return getDefaultedOptions(options);
}
