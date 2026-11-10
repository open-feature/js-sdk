import { ProviderStatus } from '@openfeature/web-sdk';
import type { ReactiveValue } from '../reactive';
import { useOpenFeatureClientStatus } from './use-open-feature-client-status';

/**
 * Utility indicating whether the provider is {@link ProviderStatus.READY}, without evaluating any flags.
 * Useful for showing loaders until the provider is ready, for example with `{#if ready.current}`.
 *
 * NOTE: `current` is true only when the provider status is {@link ProviderStatus.READY}.
 * For other statuses (ERROR, STALE, FATAL, RECONCILING), use {@link useOpenFeatureClientStatus}.
 * @returns {ReactiveValue<boolean>} reactive boolean indicating if the provider is {@link ProviderStatus.READY}
 */
export function useWhenProviderReady(): ReactiveValue<boolean> {
  const status = useOpenFeatureClientStatus();

  return {
    get current() {
      return status.current === ProviderStatus.READY;
    },
  };
}
