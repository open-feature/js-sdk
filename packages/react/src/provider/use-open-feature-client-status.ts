import { useEffect, useState } from 'react';
import { useOpenFeatureClient } from './use-open-feature-client';
import type { ProviderStatus } from '@openfeature/web-sdk';
import { ProviderEvents } from '@openfeature/web-sdk';

/**
 * Get the {@link ProviderStatus} for the OpenFeatureClient.
 * @returns {ProviderStatus} status of the client for this scope
 */
export function useOpenFeatureClientStatus(): ProviderStatus {
  const client = useOpenFeatureClient();
  const [status, setStatus] = useState<ProviderStatus>(client.providerStatus);
  const controller = new AbortController();

  useEffect(() => {
    const updateStatus = () => setStatus(client.providerStatus);
    client.addHandler(ProviderEvents.ConfigurationChanged, updateStatus, { signal: controller.signal });
    client.addHandler(ProviderEvents.ContextChanged, updateStatus, { signal: controller.signal });
    client.addHandler(ProviderEvents.Error, updateStatus, { signal: controller.signal });
    client.addHandler(ProviderEvents.Ready, updateStatus, { signal: controller.signal });
    client.addHandler(ProviderEvents.Stale, updateStatus, { signal: controller.signal });
    client.addHandler(ProviderEvents.Reconciling, updateStatus, { signal: controller.signal });
    return () => {
      controller.abort();
    };
  }, [client]);

  return status;
}
