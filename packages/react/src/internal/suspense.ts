import type { Client, Provider } from '@openfeature/web-sdk';
import { NOOP_PROVIDER, ProviderEvents } from '@openfeature/web-sdk';
import { use } from './use';

/**
 * A weak map is used to store the global suspense status for each provider. It's
 * important for this to be global to avoid rerender loops. Using useRef won't
 * work because the value isn't preserved when a promise is thrown in a component,
 * which is how suspense operates.
 */
const globalProviderSuspenseStatus = new WeakMap<Provider, Promise<unknown>>();

/**
 * Suspends until the client is ready to evaluate feature flags.
 *
 * **DO NOT EXPORT PUBLICLY**
 * @internal
 * @param {Provider} provider the provider to suspend for
 * @param {Client} client the client to check for readiness
 */
export function suspendUntilInitialized(provider: Provider, client: Client) {
  const statusPromiseRef = globalProviderSuspenseStatus.get(provider);
  if (!statusPromiseRef) {
    // Noop provider is never ready, so we resolve immediately
    const statusPromise = provider !== NOOP_PROVIDER ? isProviderReady(client) : Promise.resolve();
    // Storing the promise globally because
    globalProviderSuspenseStatus.set(provider, statusPromise);
    // Use will throw the promise and React will trigger a rerender when it's resolved
    use(statusPromise);
  } else {
    // Reuse the existing promise, use won't rethrow if the promise has settled.
    use(statusPromiseRef);
  }
}

/**
 * Suspends until the provider has finished reconciling.
 *
 * **DO NOT EXPORT PUBLICLY**
 * @internal
 * @param {Client} client the client to check for readiness
 */
export function suspendUntilReconciled(client: Client) {
  use(isProviderReady(client));
}

async function isProviderReady(client: Client) {
  const controller = new AbortController();
  try {
    return await new Promise((resolve, reject) => {
      client.addHandler(ProviderEvents.Ready, resolve, { signal: controller.signal });
      client.addHandler(ProviderEvents.Error, reject, { signal: controller.signal });
    });
  } finally {
    controller.abort();
  }
}
