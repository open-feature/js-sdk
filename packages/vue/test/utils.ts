import type { InMemoryFlagConfiguration, InMemoryFlagVariants } from '@openfeature/web-sdk';
import { TypedInMemoryProvider } from '@openfeature/web-sdk';
import { mount } from '@vue/test-utils';
import type { MaybeRefOrGetter } from 'vue';
import { defineComponent, h, toValue } from 'vue';
import type { OpenFeatureProviderProps } from '../src';
import { OpenFeatureProvider } from '../src';

export class DelayedProvider<
  T extends Record<string, InMemoryFlagVariants<string>> = Record<string, InMemoryFlagVariants<string>>,
> extends TypedInMemoryProvider<T> {
  constructor(
    flagConfiguration: InMemoryFlagConfiguration<T>,
    private delay: number,
  ) {
    super(flagConfiguration);
  }

  async initialize(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  async onContextChange(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }
}

export function mountComposable<T>(composable: () => T, options: Parameters<typeof mount>[1] = {}) {
  let result!: T;
  const component = defineComponent({
    setup() {
      result = composable();
      return () => null;
    },
  });
  const wrapper = mount(component, options);

  return { result, wrapper };
}

export function mountComposableInProvider<T>(composable: () => T, props: MaybeRefOrGetter<OpenFeatureProviderProps>) {
  let result!: T;
  const component = defineComponent({
    setup() {
      result = composable();
      return () => null;
    },
  });
  const host = defineComponent({
    setup() {
      return () => h(OpenFeatureProvider, toValue(props), { default: () => h(component) });
    },
  });
  const wrapper = mount(host);

  return { result, wrapper };
}
