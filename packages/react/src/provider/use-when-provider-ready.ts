import { ProviderStatus } from '@openfeature/web-sdk';
import type { ReactFlagEvaluationOptions} from '../common/options';
import { DEFAULT_OPTIONS, normalizeOptions } from '../common/options';
import { useProviderOptions } from './context';
import { useOpenFeatureClient } from './use-open-feature-client';
import { useOpenFeatureClientStatus } from './use-open-feature-client-status';
import { suspendUntilReady } from '../common/suspense';

type Options = Pick<ReactFlagEvaluationOptions, 'suspendUntilReady'>;

/**
 * Utility hook that triggers suspense until the provider is {@link ProviderStatus.READY}, without evaluating any flags.
 * Especially useful for React v16/17 "Legacy Suspense", in which siblings to suspending components are
 * initially mounted and then hidden (see: https://github.com/reactwg/react-18/discussions/7).
 * @param {Options} options options for suspense
 * @returns {boolean} boolean indicating if provider is {@link ProviderStatus.READY}, useful if suspense is disabled and you want to handle loaders on your own
 */
export function useWhenProviderReady(options?: Options): boolean {
  const client = useOpenFeatureClient();
  const status = useOpenFeatureClientStatus();
  // highest priority > evaluation hook options > provider options > default options > lowest priority
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...useProviderOptions(), ...normalizeOptions(options) };

  // suspense
  if (defaultedOptions.suspendUntilReady && status === ProviderStatus.NOT_READY) {
    suspendUntilReady(client);
  }

  return status === ProviderStatus.READY;
}
