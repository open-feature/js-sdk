import { Client, ProviderEvents } from '@openfeature/web-sdk';

/**
 * Suspends until the client is ready to evaluate feature flags.
 * DO NOT EXPORT PUBLICLY
 * @param client
 */
export function suspendUntilReady(client: Client): Promise<void> {
  let resolve: (value: unknown) => void;
  let reject: () => void;
  throw new Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
    client.addHandler(ProviderEvents.Ready, resolve);
    client.addHandler(ProviderEvents.Error, reject);
  }).finally(() => {
    client.removeHandler(ProviderEvents.Ready, resolve);
    client.removeHandler(ProviderEvents.Ready, reject);
  });
}
