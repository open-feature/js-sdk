import type { ProviderStatus } from '@openfeature/web-sdk';
import { ProviderEvents } from '@openfeature/web-sdk';
import type { ShallowRef } from 'vue';
import { onScopeDispose, shallowRef, watch } from 'vue';
import { useClientRef } from './use-open-feature-client';

export function useOpenFeatureClientStatus(): ShallowRef<ProviderStatus> {
  const clientRef = useClientRef();
  const status = shallowRef<ProviderStatus>(clientRef.value.providerStatus);
  let activeController: AbortController | undefined;

  onScopeDispose(() => activeController?.abort());

  watch(
    clientRef,
    (client, _previousClient, onCleanup) => {
      const controller = new AbortController();
      activeController = controller;
      const updateStatus = () => {
        status.value = client.providerStatus;
      };

      updateStatus();
      Object.values(ProviderEvents).forEach((event) => {
        client.addHandler(event, updateStatus, { signal: controller.signal });
      });

      onCleanup(() => {
        controller.abort();
        if (activeController === controller) {
          activeController = undefined;
        }
      });
    },
    { immediate: true },
  );

  return status;
}
