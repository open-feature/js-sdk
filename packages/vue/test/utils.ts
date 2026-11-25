import type { InMemoryFlagConfiguration, InMemoryFlagVariants, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';

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
