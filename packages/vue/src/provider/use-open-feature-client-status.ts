import type { ProviderStatus } from '@openfeature/web-sdk';
import { ProviderEvents } from '@openfeature/web-sdk';
import type { ShallowRef } from 'vue';
import { shallowRef, watch } from 'vue';
import { useClientRef } from './use-open-feature-client';

export function useOpenFeatureClientStatus(): ShallowRef<ProviderStatus> {
  const clientRef = useClientRef();
  const status = shallowRef<ProviderStatus>(clientRef.value.providerStatus);

  watch(
    clientRef,
    (client, _previousClient, onCleanup) => {
      const controller = new AbortController();
      const updateStatus = () => {
        status.value = client.providerStatus;
      };

      updateStatus();
      Object.values(ProviderEvents).forEach((event) => {
        client.addHandler(event, updateStatus, { signal: controller.signal });
      });

      onCleanup(() => controller.abort());
    },
    { immediate: true },
  );

  return status;
}
