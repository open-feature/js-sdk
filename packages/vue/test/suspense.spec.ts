import { OpenFeature, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent, h, Suspense } from 'vue';
import { OpenFeatureProvider, useStringFlagValue } from '../src';
import { DelayedProvider } from './utils';

const FLAG_CONFIG = {
  theme: {
    disabled: false,
    variants: { dark: 'dark' },
    defaultVariant: 'dark',
  },
} as const;

class FailingProvider extends TypedInMemoryProvider {
  async initialize(): Promise<void> {
    throw new Error('provider failed');
  }
}

describe('evaluation with Suspense', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  it('waits for an awaited evaluation and retains the reactive ref', async () => {
    const domain = 'suspense-evaluation';
    const delay = 10;
    const consoleInfo = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, delay));
    const child = defineComponent({
      async setup() {
        const theme = useStringFlagValue('theme', 'light');
        await theme;
        return () => h('div', theme.value);
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

    expect(wrapper.text()).toBe('dark');
    wrapper.unmount();
    consoleInfo.mockRestore();
  });

  it('resolves provider errors to the default instead of rejecting Suspense', async () => {
    const domain = 'suspense-evaluation-error';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const consoleInfo = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    OpenFeature.setProvider(domain, new FailingProvider(FLAG_CONFIG));
    const child = defineComponent({
      async setup() {
        const theme = useStringFlagValue('theme', 'light');
        await theme;
        return () => h('div', theme.value);
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
    await flushPromises();

    expect(wrapper.text()).toBe('light');
    wrapper.unmount();
    consoleError.mockRestore();
    consoleInfo.mockRestore();
  });
});
