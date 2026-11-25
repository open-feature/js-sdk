import type { Client } from '@openfeature/web-sdk';
import { OpenFeature, ProviderEvents, ProviderStatus, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { flushPromises } from '@vue/test-utils';
import { nextTick, ref } from 'vue';
import { useOpenFeatureClientStatus, useOpenFeatureProvider } from '../src';
import { DelayedProvider, mountComposableInProvider } from './utils';

const FLAG_CONFIG = {
  enabled: {
    disabled: false,
    variants: { on: true },
    defaultVariant: 'on',
  },
} as const;

describe('provider composables', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  it('returns the provider bound to the client domain', async () => {
    const domain = 'provider-composable';
    const provider = new TypedInMemoryProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);

    const { result, wrapper } = mountComposableInProvider(() => useOpenFeatureProvider(), { domain });

    expect(result).toBe(provider);
    wrapper.unmount();
  });

  it('tracks provider readiness', async () => {
    const domain = 'status-ready';
    const delay = 10;
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, delay));

    const { result, wrapper } = mountComposableInProvider(() => useOpenFeatureClientStatus(), { domain });

    expect(result.value).toBe(ProviderStatus.NOT_READY);
    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    await flushPromises();

    expect(result.value).toBe(ProviderStatus.READY);
    wrapper.unmount();
  });

  it('tracks stale, error, and ready events', async () => {
    const domain = 'status-events';
    const provider = new TypedInMemoryProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);
    const { result, wrapper } = mountComposableInProvider(() => useOpenFeatureClientStatus(), { domain });

    provider.events?.emit(ProviderEvents.Stale, { providerName: provider.metadata.name });
    await nextTick();
    expect(result.value).toBe(ProviderStatus.STALE);

    provider.events?.emit(ProviderEvents.Error, { providerName: provider.metadata.name, message: 'test error' });
    await nextTick();
    expect(result.value).toBe(ProviderStatus.ERROR);

    provider.events?.emit(ProviderEvents.Ready, { providerName: provider.metadata.name });
    await nextTick();
    expect(result.value).toBe(ProviderStatus.READY);
    wrapper.unmount();
  });

  it('tracks context reconciliation', async () => {
    const domain = 'status-reconciling';
    const delay = 10;
    const provider = new DelayedProvider(FLAG_CONFIG, delay);
    await OpenFeature.setProviderAndWait(domain, provider);
    const { result, wrapper } = mountComposableInProvider(() => useOpenFeatureClientStatus(), { domain });

    const contextChange = OpenFeature.setContext(domain, { user: 'test-user' });
    await nextTick();
    expect(result.value).toBe(ProviderStatus.RECONCILING);

    await contextChange;
    await nextTick();
    expect(result.value).toBe(ProviderStatus.READY);
    wrapper.unmount();
  });

  it('removes event handlers when the component is disposed', async () => {
    const domain = 'status-cleanup';
    const provider = new TypedInMemoryProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);
    const client = OpenFeature.getClient(domain);
    const handlerCounts = Object.values(ProviderEvents).map((event) => client.getHandlers(event).length);
    const { wrapper } = mountComposableInProvider(() => useOpenFeatureClientStatus(), { domain });

    Object.values(ProviderEvents).forEach((event, index) => {
      expect(client.getHandlers(event).length).toBeGreaterThan(handlerCounts[index]);
    });

    wrapper.unmount();

    Object.values(ProviderEvents).forEach((event, index) => {
      expect(client.getHandlers(event).length).toBe(handlerCounts[index]);
    });
  });

  it('moves handlers to a new client when the provider domain changes', async () => {
    const firstDomain = 'status-first-domain';
    const secondDomain = 'status-second-domain';
    const firstProvider = new TypedInMemoryProvider(FLAG_CONFIG);
    const secondProvider = new TypedInMemoryProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(firstDomain, firstProvider);
    await OpenFeature.setProviderAndWait(secondDomain, secondProvider);
    const firstClient: Client = OpenFeature.getClient(firstDomain);
    const secondClient: Client = OpenFeature.getClient(secondDomain);
    const firstCounts = Object.values(ProviderEvents).map((event) => firstClient.getHandlers(event).length);
    const secondCounts = Object.values(ProviderEvents).map((event) => secondClient.getHandlers(event).length);
    const providerProps = ref({ domain: firstDomain });
    let status!: ReturnType<typeof useOpenFeatureClientStatus>;
    const component = mountComposableInProvider(() => {
      status = useOpenFeatureClientStatus();
      return status;
    }, providerProps);

    providerProps.value = { domain: secondDomain };
    await nextTick();

    expect(status.value).toBe(ProviderStatus.READY);
    Object.values(ProviderEvents).forEach((event, index) => {
      expect(firstClient.getHandlers(event).length).toBe(firstCounts[index]);
      expect(secondClient.getHandlers(event).length).toBeGreaterThan(secondCounts[index]);
    });
    component.wrapper.unmount();
  });
});
