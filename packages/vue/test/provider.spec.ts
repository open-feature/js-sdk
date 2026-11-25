import type { Client } from '@openfeature/web-sdk';
import { TypedInMemoryProvider } from '@openfeature/web-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { createApp, defineComponent, h } from 'vue';
import { OpenFeature, OpenFeaturePlugin, OpenFeatureProvider, useOpenFeatureClient } from '../src';

describe('OpenFeature setup', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
    OpenFeature.clearHooks();
  });

  it('provides a Vue-aware client from the plugin', () => {
    let actualClient!: Client;
    const component = defineComponent({
      setup() {
        actualClient = useOpenFeatureClient();
        return () => null;
      },
    });
    const app = createApp(component);
    app.use(OpenFeaturePlugin, { domain: 'plugin-domain' });
    const container = document.createElement('div');
    app.mount(container);

    expect(actualClient.metadata).toMatchObject({
      domain: 'plugin-domain',
      framework: 'vue',
      paradigm: 'client',
      sdk: 'js-web',
    });
    app.unmount();
  });

  it('sets a provider supplied to the plugin', async () => {
    let actualClient!: Client;
    const provider = new TypedInMemoryProvider({
      enabled: {
        disabled: false,
        variants: { on: true },
        defaultVariant: 'on',
      },
    });
    const component = defineComponent({
      setup() {
        actualClient = useOpenFeatureClient();
        return () => null;
      },
    });
    const app = createApp(component);
    app.use(OpenFeaturePlugin, { domain: 'plugin-provider', provider });
    const container = document.createElement('div');
    app.mount(container);
    await flushPromises();

    expect(actualClient.getBooleanValue('enabled', false)).toBe(true);
    app.unmount();
  });

  it('provides a Vue-aware client for a domain-scoped provider', () => {
    let actualClient!: Client;
    const component = defineComponent({
      setup() {
        actualClient = useOpenFeatureClient();
        return () => null;
      },
    });
    const wrapper = mount(OpenFeatureProvider, {
      props: { domain: 'component-domain' },
      slots: { default: () => h(component) },
    });

    expect(actualClient.metadata).toMatchObject({
      domain: 'component-domain',
      framework: 'vue',
    });
    wrapper.unmount();
  });

  it('keeps the client stable when provider props do not change', async () => {
    const clients: Client[] = [];
    const component = defineComponent({
      setup() {
        clients.push(useOpenFeatureClient());
        return () => null;
      },
    });
    const wrapper = mount(OpenFeatureProvider, {
      props: { domain: 'stable-domain' },
      slots: { default: () => h(component) },
    });
    const firstClient = clients[0];

    await wrapper.setProps({ domain: 'stable-domain' });
    await wrapper.vm.$nextTick();

    expect(clients[clients.length - 1]).toBe(firstClient);
    wrapper.unmount();
  });

  it('uses the closest provider in a nested tree', () => {
    const clients: string[] = [];
    const component = defineComponent({
      setup() {
        const client = useOpenFeatureClient();
        clients.push(client.metadata.domain ?? '');
        return () => null;
      },
    });
    const outer = defineComponent({
      setup() {
        return () =>
          h(
            OpenFeatureProvider,
            { domain: 'outer-domain' },
            {
              default: () => [
                h(component),
                h(OpenFeatureProvider, { domain: 'inner-domain' }, { default: () => h(component) }),
              ],
            },
          );
      },
    });

    const wrapper = mount(outer);

    expect(clients).toEqual(['outer-domain', 'inner-domain']);
    wrapper.unmount();
  });

  it('throws a helpful error without a provider or plugin', () => {
    const component = defineComponent({
      setup() {
        useOpenFeatureClient();
        return () => null;
      },
    });
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(() => mount(component)).toThrow('No OpenFeature context available');
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});
