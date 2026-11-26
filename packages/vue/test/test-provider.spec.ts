import type { EvaluationContext, Provider, ResolutionDetails } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { createApp, defineComponent, h } from 'vue';
import { createOpenFeatureTestPlugin, OpenFeatureTestProvider, useFlag } from '../src';

const FLAG_KEY = 'test-flag';

const FlagComponent = defineComponent({
  setup() {
    const flag = useFlag(FLAG_KEY, false);
    return () => h('div', `${flag.value}:${flag.reason}`);
  },
});

describe('Vue test utilities', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  it('renders defaults with OpenFeatureTestProvider and no options', () => {
    const wrapper = mount(OpenFeatureTestProvider, {
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('false:No-op');
    wrapper.unmount();
  });

  it('renders no-op defaults on a fresh SDK singleton', async () => {
    await OpenFeature.clearProviders();
    const wrapper = mount(OpenFeatureTestProvider, {
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('false:No-op');
    wrapper.unmount();
  });

  it('renders values from a flagValueMap', () => {
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { flagValueMap: { [FLAG_KEY]: true } },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('true:STATIC');
    wrapper.unmount();
  });

  it('renders mapped values immediately with no delay', () => {
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { flagValueMap: { [FLAG_KEY]: true }, delayMs: 0 },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('true:STATIC');
    wrapper.unmount();
  });

  it('renders defaults until a delayed provider is ready', async () => {
    const delay = 10;
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { flagValueMap: { [FLAG_KEY]: true }, delayMs: delay },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('false:ERROR');
    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    await flushPromises();

    expect(wrapper.text()).toBe('true:STATIC');
    wrapper.unmount();
  });

  it('uses a domain-scoped test provider', () => {
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { domain: 'test-provider-domain', flagValueMap: { [FLAG_KEY]: true } },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('true:STATIC');
    expect(OpenFeature.getProvider('test-provider-domain').metadata.name).toBe('in-memory');
    wrapper.unmount();
  });

  it('supports partial providers', () => {
    class CustomProvider implements Partial<Provider> {
      resolveBooleanEvaluation(): ResolutionDetails<boolean> {
        return { value: true, variant: 'custom', reason: 'CUSTOM_REASON' };
      }
    }
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { provider: new CustomProvider() },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('true:CUSTOM_REASON');
    wrapper.unmount();
  });

  it('supports frozen partial providers', () => {
    const provider = Object.freeze({
      resolveBooleanEvaluation: () => ({ value: true, reason: 'FROZEN_REASON' }),
    });
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { provider },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('true:FROZEN_REASON');
    wrapper.unmount();
  });

  it('supports partial providers with private state', () => {
    class PrivateProvider implements Partial<Provider> {
      #enabled = true;

      resolveBooleanEvaluation(): ResolutionDetails<boolean> {
        return { value: this.#enabled, reason: 'PRIVATE_REASON' };
      }
    }
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { provider: new PrivateProvider() },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('true:PRIVATE_REASON');
    wrapper.unmount();
  });

  it('fills missing partial provider methods with no-op behavior', () => {
    class EmptyProvider implements Partial<Provider> {}
    const wrapper = mount(OpenFeatureTestProvider, {
      props: { provider: new EmptyProvider() },
      slots: { default: () => h(FlagComponent) },
    });

    expect(wrapper.text()).toBe('false:No-op');
    wrapper.unmount();
  });

  it('creates an app-wide test plugin from a flagValueMap', async () => {
    const app = createApp(FlagComponent);
    app.use(createOpenFeatureTestPlugin({ flagValueMap: { [FLAG_KEY]: true } }));
    const container = document.createElement('div');
    app.mount(container);
    await flushPromises();

    expect(container.textContent).toBe('true:STATIC');
    app.unmount();
  });

  it('creates a domain-scoped test plugin', async () => {
    const app = createApp(FlagComponent);
    app.use(createOpenFeatureTestPlugin({ domain: 'test-plugin-domain', flagValueMap: { [FLAG_KEY]: true } }));
    const container = document.createElement('div');
    app.mount(container);
    await flushPromises();

    expect(container.textContent).toBe('true:STATIC');
    expect(OpenFeature.getProvider('test-plugin-domain').metadata.name).toBe('in-memory');
    app.unmount();
  });

  it('creates a no-op test plugin on a fresh SDK singleton', async () => {
    await OpenFeature.clearProviders();
    const app = createApp(FlagComponent);
    app.use(createOpenFeatureTestPlugin());
    const container = document.createElement('div');
    app.mount(container);

    expect(container.textContent).toBe('false:No-op');
    app.unmount();
  });

  it('creates a delayed test plugin', async () => {
    const delay = 10;
    const app = createApp(FlagComponent);
    app.use(createOpenFeatureTestPlugin({ flagValueMap: { [FLAG_KEY]: true }, delayMs: delay }));
    const container = document.createElement('div');
    app.mount(container);

    expect(container.textContent).toBe('false:ERROR');
    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    await flushPromises();

    expect(container.textContent).toBe('true:STATIC');
    app.unmount();
  });

  it('creates a test plugin with an initial context', () => {
    class ContextProvider implements Partial<Provider> {
      resolveBooleanEvaluation(_flagKey: string, _defaultValue: boolean, context: EvaluationContext) {
        return { value: context.user === 'bob', reason: 'CONTEXT' };
      }
    }
    const app = createApp(FlagComponent);
    app.use(createOpenFeatureTestPlugin({ provider: new ContextProvider(), context: { user: 'bob' } }));
    const container = document.createElement('div');
    app.mount(container);

    expect(container.textContent).toBe('true:CONTEXT');
    app.unmount();
  });

  it('creates a test plugin from a partial provider', async () => {
    class CustomProvider implements Partial<Provider> {
      resolveBooleanEvaluation(): ResolutionDetails<boolean> {
        return { value: true, reason: 'CUSTOM_REASON' };
      }
    }
    const app = createApp(FlagComponent);
    app.use(createOpenFeatureTestPlugin({ provider: new CustomProvider() }));
    const container = document.createElement('div');
    app.mount(container);

    expect(container.textContent).toBe('true:CUSTOM_REASON');
    app.unmount();
  });
});
