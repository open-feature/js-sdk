import { type InMemoryFlagConfiguration, type InMemoryFlagVariants, TypedInMemoryProvider } from '@openfeature/web-sdk';

/**
 * In-memory provider with configurable delays for initialization and context changes.
 */
export class TestingProvider<
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
