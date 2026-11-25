import { OpenFeature, ProviderEvents, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { computed, defineComponent, h, nextTick, ref, Suspense } from 'vue';
import { OpenFeatureProvider, useWhenProviderReady } from '../src';
import { DelayedProvider, mountComposableInProvider } from './utils';

const FLAG_CONFIG = {
  enabled: {
    disabled: false,
    variants: { on: true },
    defaultVariant: 'on',
  },
} as const;

class FailingProvider extends TypedInMemoryProvider {
  async initialize(): Promise<void> {
    throw new Error('provider failed');
  }
}

describe('useWhenProviderReady', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  it('returns false immediately and resolves true after readiness', async () => {
    const domain = 'ready-delayed';
    const delay = 10;
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, delay));
    const { result, wrapper } = mountComposableInProvider(() => useWhenProviderReady(), { domain });

    expect(result.value).toBe(false);
    expect(await result).toBe(true);
    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('updates after readiness when it is not awaited', async () => {
    const domain = 'ready-unawaited';
    const delay = 10;
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, delay));
    const { result, wrapper } = mountComposableInProvider(() => useWhenProviderReady(), { domain });

    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    await flushPromises();

    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('resolves false for the no-op provider', async () => {
    const domain = 'ready-noop';
    await OpenFeature.clearProviders();
    const { result, wrapper } = mountComposableInProvider(() => useWhenProviderReady(), { domain });

    expect(await result).toBe(false);
    wrapper.unmount();
  });

  it('resolves false when provider initialization fails', async () => {
    const domain = 'ready-error';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    OpenFeature.setProvider(domain, new FailingProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useWhenProviderReady(), { domain });

    await expect(result).resolves.toBe(false);
    expect(result.value).toBe(false);
    wrapper.unmount();
    consoleError.mockRestore();
  });

  it('shows the Suspense fallback until the provider is ready', async () => {
    const consoleInfo = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    const domain = 'ready-suspense';
    const delay = 10;
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, delay));
    const child = defineComponent({
      async setup() {
        const ready = useWhenProviderReady();
        await ready;
        return () => h('div', 'ready');
      },
    });
    const host = defineComponent({
      setup() {
        return () =>
          h(Suspense, null, {
            default: () => h(OpenFeatureProvider, { domain }, { default: () => h(child) }),
            fallback: () => h('div', 'loading'),
          });
      },
    });
    const wrapper = mount(host);

    expect(wrapper.text()).toBe('loading');
    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    await flushPromises();

    expect(wrapper.text()).toBe('ready');
    wrapper.unmount();
    consoleInfo.mockRestore();
  });

  it('waits when the provider is initially reconciling', async () => {
    const domain = 'ready-initial-reconciling';
    const delay = 10;
    const provider = new DelayedProvider(FLAG_CONFIG, delay);
    await OpenFeature.setProviderAndWait(domain, provider);
    const contextChange = OpenFeature.setContext(domain, { user: 'bob' });
    await nextTick();
    const { result, wrapper } = mountComposableInProvider(() => useWhenProviderReady(), { domain });
    const pending = result;

    expect(result.value).toBe(false);
    await contextChange;

    expect(await pending).toBe(true);
    wrapper.unmount();
  });

  it('awaits the current client after the provider domain changes', async () => {
    const firstDomain = 'ready-switch-first';
    const secondDomain = 'ready-switch-second';
    OpenFeature.setProvider(firstDomain, new DelayedProvider(FLAG_CONFIG, 1000));
    await OpenFeature.setProviderAndWait(secondDomain, new TypedInMemoryProvider(FLAG_CONFIG));
    const domain = ref(firstDomain);
    const providerProps = computed(() => ({ domain: domain.value }));
    const { result, wrapper } = mountComposableInProvider(() => useWhenProviderReady(), providerProps);

    expect(result.value).toBe(false);
    domain.value = secondDomain;
    await nextTick();

    expect(result.value).toBe(true);
    expect(await result).toBe(true);
    wrapper.unmount();
  });

  it('removes readiness handlers when disposed before initialization', async () => {
    const domain = 'ready-cleanup';
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, 1000));
    const client = OpenFeature.getClient(domain);
    const readyHandlers = client.getHandlers(ProviderEvents.Ready).length;
    const errorHandlers = client.getHandlers(ProviderEvents.Error).length;
    const contextHandlers = client.getHandlers(ProviderEvents.ContextChanged).length;
    const { wrapper } = mountComposableInProvider(() => useWhenProviderReady(), { domain });

    expect(client.getHandlers(ProviderEvents.Ready).length).toBeGreaterThan(readyHandlers);
    expect(client.getHandlers(ProviderEvents.Error).length).toBeGreaterThan(errorHandlers);
    expect(client.getHandlers(ProviderEvents.ContextChanged).length).toBeGreaterThan(contextHandlers);

    wrapper.unmount();

    expect(client.getHandlers(ProviderEvents.Ready).length).toBe(readyHandlers);
    expect(client.getHandlers(ProviderEvents.Error).length).toBe(errorHandlers);
    expect(client.getHandlers(ProviderEvents.ContextChanged).length).toBe(contextHandlers);
  });
});
