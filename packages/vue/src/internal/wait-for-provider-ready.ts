import type { Client } from '@openfeature/web-sdk';
import { NOOP_PROVIDER, OpenFeature, ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';

export function shouldWaitForProvider(client: Client): boolean {
  const status = client.providerStatus;
  const provider = OpenFeature.getProvider(client.metadata.domain);

  return provider !== NOOP_PROVIDER && (status === ProviderStatus.NOT_READY || status === ProviderStatus.RECONCILING);
}

export function waitForProviderReady<T>(
  client: Client,
  evaluate: () => T,
  fallback: (message?: string) => T,
  registerCleanup: (cleanup: () => void) => void,
): Promise<T> {
  if (!shouldWaitForProvider(client)) {
    return Promise.resolve(evaluate());
  }

  return new Promise<T>((resolve) => {
    let settled = false;
    const controller = new AbortController();
    const finish = (value: T) => {
      if (settled) {
        return;
      }

      settled = true;
      controller.abort();
      resolve(value);
    };
    const settleReady = () => finish(evaluate());
    const settleError = (eventDetails?: { message?: string }) => finish(fallback(eventDetails?.message));

    registerCleanup(() => {
      if (settled) {
        return;
      }

      settled = true;
      controller.abort();
      resolve(fallback());
    });

    client.addHandler(ProviderEvents.Error, settleError, { signal: controller.signal });
    if (settled) {
      return;
    }

    client.addHandler(ProviderEvents.Ready, settleReady, { signal: controller.signal });
    if (settled) {
      return;
    }

    client.addHandler(ProviderEvents.ContextChanged, settleReady, { signal: controller.signal });
  });
}
