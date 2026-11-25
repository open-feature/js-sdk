import type { EvaluationDetails, FlagValue } from '@openfeature/web-sdk';
import { OpenFeature, StandardResolutionReasons, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { flushPromises, mount } from '@vue/test-utils';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { FlagQuery } from '../src';
import { FeatureFlag, OpenFeaturePlugin, OpenFeatureProvider } from '../src';
import { DelayedProvider } from './utils';

const FLAG_CONFIG = {
  enabled: {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant: 'on',
  },
  disabled: {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant: 'off',
  },
  theme: {
    disabled: false,
    variants: { dark: 'dark', light: 'light' },
    defaultVariant: 'dark',
  },
} as const;

describe('FeatureFlag', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  function mountFlag(
    props: Record<string, unknown>,
    slots: Record<string, (...args: never[]) => unknown>,
    domain = 'feature-flag',
  ) {
    return mount(OpenFeatureProvider, {
      props: { domain },
      slots: {
        default: () => h(FeatureFlag, props as never, slots),
      },
    });
  }

  it('renders the default slot for a truthy boolean flag', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const wrapper = mountFlag(
      { flagKey: 'enabled', defaultValue: false },
      { default: () => h('div', 'enabled'), fallback: () => h('div', 'fallback') },
    );

    expect(wrapper.text()).toBe('enabled');
    wrapper.unmount();
  });

  it('renders the fallback slot for a falsy boolean flag', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const wrapper = mountFlag(
      { flagKey: 'disabled', defaultValue: false },
      { default: () => h('div', 'enabled'), fallback: () => h('div', 'fallback') },
    );

    expect(wrapper.text()).toBe('fallback');
    wrapper.unmount();
  });

  it('matches non-boolean values', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const wrapper = mountFlag(
      { flagKey: 'theme', defaultValue: 'light', matchValue: 'dark' },
      { default: () => h('div', 'dark'), fallback: () => h('div', 'light') },
    );

    expect(wrapper.text()).toBe('dark');
    wrapper.unmount();
  });

  it('renders the fallback for non-boolean flags without a match value', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const wrapper = mountFlag(
      { flagKey: 'theme', defaultValue: 'light' },
      { default: () => h('div', 'dark'), fallback: () => h('div', 'light') },
    );

    expect(wrapper.text()).toBe('light');
    wrapper.unmount();
  });

  it('supports custom predicates', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const wrapper = mountFlag(
      {
        flagKey: 'disabled',
        defaultValue: false,
        matchValue: true,
        predicate: (expected: boolean | undefined, details: EvaluationDetails<boolean>) =>
          expected !== undefined && details.value !== expected,
      },
      { default: () => h('div', 'matched'), fallback: () => h('div', 'fallback') },
    );

    expect(wrapper.text()).toBe('matched');
    wrapper.unmount();
  });

  it('passes query details to the scoped default slot', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const wrapper = mountFlag(
      { flagKey: 'theme', defaultValue: 'light', matchValue: 'dark' },
      {
        default: (query: FlagQuery<FlagValue>) => h('div', `${query.value}:${query.variant}:${query.reason}`),
      },
    );

    expect(wrapper.text()).toBe(`dark:dark:${StandardResolutionReasons.STATIC}`);
    wrapper.unmount();
  });

  it('passes evaluation details to the scoped fallback slot', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const wrapper = mountFlag(
      { flagKey: 'missing', defaultValue: false },
      {
        default: () => h('div', 'enabled'),
        fallback: (details: EvaluationDetails<boolean>) => h('div', `${details.flagKey}:${details.reason}`),
      },
    );

    expect(wrapper.text()).toBe(`missing:${StandardResolutionReasons.ERROR}`);
    wrapper.unmount();
  });

  it('renders the fallback while the provider is not ready and updates after initialization', async () => {
    OpenFeature.setProvider('feature-flag', new DelayedProvider(FLAG_CONFIG, 10));
    const wrapper = mountFlag(
      { flagKey: 'enabled', defaultValue: false },
      { default: () => h('div', 'enabled'), fallback: () => h('div', 'fallback') },
    );

    expect(wrapper.text()).toBe('fallback');
    await new Promise((resolve) => setTimeout(resolve, 20));
    await flushPromises();

    expect(wrapper.text()).toBe('enabled');
    wrapper.unmount();
  });

  it('reacts to prop changes', async () => {
    await OpenFeature.setProviderAndWait('feature-flag', new TypedInMemoryProvider(FLAG_CONFIG));
    const matchValue = ref('dark');
    const host = defineComponent({
      setup() {
        return () =>
          h(
            OpenFeatureProvider,
            { domain: 'feature-flag' },
            {
              default: () =>
                h(
                  FeatureFlag,
                  { flagKey: 'theme', defaultValue: 'light', matchValue: matchValue.value },
                  { default: () => h('div', 'dark'), fallback: () => h('div', 'light') },
                ),
            },
          );
      },
    });
    const wrapper = mount(host);

    expect(wrapper.text()).toBe('dark');
    matchValue.value = 'light';
    await nextTick();

    expect(wrapper.text()).toBe('light');
    wrapper.unmount();
  });

  it('registers FeatureFlag globally with the plugin', () => {
    const app = createApp(defineComponent({ render: () => null }));
    app.use(OpenFeaturePlugin);

    expect(app.component('FeatureFlag')).toBe(FeatureFlag);
  });
});
