import { createSubscriber } from 'svelte/reactivity';
import type { ProviderStatus } from '@openfeature/web-sdk';
import { ProviderEvents } from '@openfeature/web-sdk';
import type { ReactiveValue } from '../reactive';
import { useOpenFeatureClient } from './use-open-feature-client';

const STATUS_EVENTS = [
  ProviderEvents.Ready,
  ProviderEvents.Error,
  ProviderEvents.Stale,
  ProviderEvents.Reconciling,
  ProviderEvents.ContextChanged,
  ProviderEvents.ConfigurationChanged,
] as const;

/**
 * Get the {@link ProviderStatus} for the OpenFeature client of the enclosing scope.
 * `current` reacts to changes in provider status when read in a template, `$derived` or `$effect`.
 * @returns {ReactiveValue<ProviderStatus>} reactive status of the client for this scope
 */
export function useOpenFeatureClientStatus(): ReactiveValue<ProviderStatus> {
  const client = useOpenFeatureClient();

  const subscribe = createSubscriber((update) => {
    const controller = new AbortController();
    // not every event changes the status, so only notify effects when it did
    let last = client.providerStatus;
    const onEvent = () => {
      if (client.providerStatus !== last) {
        last = client.providerStatus;
        update();
      }
    };
    for (const event of STATUS_EVENTS) {
      client.addHandler(event, onEvent, { signal: controller.signal });
    }
    return () => controller.abort();
  });

  return {
    get current() {
      subscribe();
      return client.providerStatus;
    },
  };
}
