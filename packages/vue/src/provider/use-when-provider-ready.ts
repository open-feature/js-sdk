import { ProviderStatus } from '@openfeature/web-sdk';
import { computed, onScopeDispose } from 'vue';
import type { AwaitableRef } from '../internal/awaitable-ref';
import { makeAwaitableRef } from '../internal/make-awaitable-ref';
import { shouldWaitForProvider, waitForProviderReady } from '../internal/wait-for-provider-ready';
import { useClientRef } from './use-open-feature-client';
import { useOpenFeatureClientStatus } from './use-open-feature-client-status';

export function useWhenProviderReady(): AwaitableRef<boolean> {
  const clientRef = useClientRef();
  const status = useOpenFeatureClientStatus();
  const ready = computed(() => status.value === ProviderStatus.READY);
  const cleanups: Array<() => void> = [];

  onScopeDispose(() => {
    cleanups.splice(0).forEach((cleanup) => cleanup());
  });

  const initialClient = clientRef.value;
  const readiness = shouldWaitForProvider(initialClient)
    ? waitForProviderReady(
        initialClient,
        () => status.value === ProviderStatus.READY,
        () => false,
        (cleanup) => cleanups.push(cleanup),
      )
    : Promise.resolve(status.value === ProviderStatus.READY);
  const settled = readiness.catch(() => false);

  return makeAwaitableRef(ready, settled);
}
