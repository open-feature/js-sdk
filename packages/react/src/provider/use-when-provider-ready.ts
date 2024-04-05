import { ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
import { useEffect, useState } from 'react';
import { suspend } from '../common/suspend';
import { useOpenFeatureClient } from './use-open-feature-client';

/**
 * Utility hook that triggers suspense until the provider is ready, without evaluating any flags.
 * Especially useful for React v16/17 "Legacy Suspense", in which siblings to suspending components are
 * initially mounted and then hidden (see: https://github.com/reactwg/react-18/discussions/7).
 */
export function useWhenProviderReady(): void {
  const [, updateState] = useState<object | undefined>();
  const client = useOpenFeatureClient();

  useEffect(() => {
    if (client.providerStatus === ProviderStatus.NOT_READY) {
      suspend(client, updateState, ProviderEvents.Ready);
    }
  }, []);
}
