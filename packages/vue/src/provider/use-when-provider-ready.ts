import { ProviderStatus } from '@openfeature/web-sdk';
import { computed, onScopeDispose, watch } from 'vue';
import type { AwaitableRef } from '../internal/awaitable-ref';
import { makeAwaitableRef } from '../internal/make-awaitable-ref';
import { shouldWaitForProvider, waitForProviderReady } from '../internal/wait-for-provider-ready';
import { useClientRef } from './use-open-feature-client';
import { useOpenFeatureClientStatus } from './use-open-feature-client-status';

export function useWhenProviderReady(): AwaitableRef<boolean> {
  const clientRef = useClientRef();
  const status = useOpenFeatureClientStatus();
  const ready = computed(() => status.value === ProviderStatus.READY);
  let cancelReadiness: (() => void) | undefined;
  let readinessGeneration = 0;
  let currentSettled: Promise<boolean> | undefined;

  onScopeDispose(() => {
    readinessGeneration++;
    cancelReadiness?.();
    cancelReadiness = undefined;
  });

  const startReadiness = (client: typeof clientRef.value) => {
    const generation = ++readinessGeneration;
    cancelReadiness?.();
    cancelReadiness = undefined;

    if (!shouldWaitForProvider(client)) {
      currentSettled = undefined;
      return generation;
    }

    currentSettled = waitForProviderReady(
      client,
      () => status.value === ProviderStatus.READY,
      () => false,
      (cleanup) => {
        cancelReadiness = cleanup;
      },
    )
      .catch(() => false)
      .then((value) => {
        if (generation === readinessGeneration) {
          currentSettled = undefined;
        }
        return value;
      });

    return generation;
  };

  watch(
    clientRef,
    (client, _previousClient, onCleanup) => {
      const generation = startReadiness(client);
      onCleanup(() => {
        if (generation === readinessGeneration) {
          readinessGeneration++;
          cancelReadiness?.();
          cancelReadiness = undefined;
        }
      });
    },
    { immediate: true },
  );

  return makeAwaitableRef(ready, () => currentSettled ?? Promise.resolve(ready.value));
}
