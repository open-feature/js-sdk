import { ProviderStatus } from '@openfeature/web-sdk';
import { useOpenFeatureClient } from './use-open-feature-client';
import { useOpenFeatureClientStatus } from './use-open-feature-client-status';
import type { ReactFlagEvaluationOptions } from '../options';
import { DEFAULT_OPTIONS, useProviderOptions, normalizeOptions, suspendUntilInitialized } from '../internal';
import { useOpenFeatureProvider } from './use-open-feature-provider';

type Options = Pick<ReactFlagEvaluationOptions, 'suspendUntilReady'>;

/**
 * Utility hook that triggers suspense until the provider is {@link ProviderStatus.READY}, without evaluating any flags.
 * Especially useful for React v16/17 "Legacy Suspense", in which siblings to suspending components are
 * initially mounted and then hidden (see: https://github.com/reactwg/react-18/discussions/7).
 *
 * NOTE: This hook returns true only when the provider status is {@link ProviderStatus.READY}.
 * For other statuses (ERROR, STALE, FATAL, RECONCILING), use {@link useOpenFeatureClientStatus}.
 * @param {Options} options options for suspense
 * @returns {boolean} boolean indicating if provider is {@link ProviderStatus.READY}, useful if suspense is disabled and you want to handle loaders on your own
 */
export function useWhenProviderReady(options?: Options): boolean {
  // highest priority > evaluation hook options > provider options > default options > lowest priority
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...useProviderOptions(), ...normalizeOptions(options) };
  const client = useOpenFeatureClient();
  const status = useOpenFeatureClientStatus();
  const provider = useOpenFeatureProvider();

  if (defaultedOptions.suspendUntilReady && status === ProviderStatus.NOT_READY) {
    suspendUntilInitialized(provider, client);
  }

  return status === ProviderStatus.READY;
}
