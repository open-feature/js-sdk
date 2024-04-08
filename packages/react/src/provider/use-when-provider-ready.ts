import { ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
import { useEffect, useState } from 'react';
import { DEFAULT_OPTIONS, ReactFlagEvaluationOptions, normalizeOptions } from '../common/options';
import { suspend } from '../common/suspend';
import { useProviderOptions } from './context';
import { useOpenFeatureClient } from './use-open-feature-client';

type Options = Pick<ReactFlagEvaluationOptions, 'suspendUntilReady'>;

/**
 * Utility hook that triggers suspense until the provider is {@link ProviderStatus.READY}, without evaluating any flags.
 * Especially useful for React v16/17 "Legacy Suspense", in which siblings to suspending components are
 * initially mounted and then hidden (see: https://github.com/reactwg/react-18/discussions/7).
 * @param {Options} options options for suspense
 * @returns {boolean} boolean indicating if provider is {@link ProviderStatus.READY}, useful if suspense is disabled and you want to handle loaders on your own
 */
export function useWhenProviderReady(options?: Options): boolean {
  const [, updateState] = useState<object | undefined>();
  const client = useOpenFeatureClient();
  // highest priority > evaluation hook options > provider options > default options > lowest priority
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...useProviderOptions(), ...normalizeOptions(options)};

  useEffect(() => {
    if (defaultedOptions.suspendUntilReady && client.providerStatus === ProviderStatus.NOT_READY) {
      suspend(client, updateState, ProviderEvents.Ready);
    }
  }, []);

  return client.providerStatus === ProviderStatus.READY;
}
