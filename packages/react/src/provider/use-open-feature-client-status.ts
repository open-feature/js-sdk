import { useEffect, useState } from 'react';
import { useOpenFeatureClient } from './use-open-feature-client';
import { ProviderStatus } from '@openfeature/web-sdk';
import { ProviderEvents } from '@openfeature/web-sdk';
import type { ReactFlagEvaluationOptions } from '../common';
import { DEFAULT_OPTIONS, useProviderOptions, normalizeOptions, suspendUntilReady } from '../common';

type Options = Pick<ReactFlagEvaluationOptions, 'suspendUntilReady'>

/**
 * Get the {@link ProviderStatus} for the OpenFeatureClient.
 * @param options
 * @returns {ProviderStatus} status of the client for this scope
 */
export function useOpenFeatureClientStatus(options?: Options) {
  const client = useOpenFeatureClient();
  const [status, setStatus] = useState<typeof ProviderStatus>(client.providerStatus);

  useEffect(() => {
    const updateStatus = () => setStatus(client.providerStatus);
    client.addHandler(ProviderEvents.ConfigurationChanged, updateStatus);
    client.addHandler(ProviderEvents.ContextChanged, updateStatus);
    client.addHandler(ProviderEvents.Error, updateStatus);
    client.addHandler(ProviderEvents.Ready, updateStatus);
    client.addHandler(ProviderEvents.Stale, updateStatus);
    client.addHandler(ProviderEvents.Reconciling, updateStatus);
    return () => {
      client.removeHandler(ProviderEvents.ConfigurationChanged, updateStatus);
      client.removeHandler(ProviderEvents.ContextChanged, updateStatus);
      client.removeHandler(ProviderEvents.Error, updateStatus);
      client.removeHandler(ProviderEvents.Ready, updateStatus);
      client.removeHandler(ProviderEvents.Stale, updateStatus);
      client.removeHandler(ProviderEvents.Reconciling, updateStatus);
    };
  }, [client]);


  return status;
}
