import { type InMemoryFlagConfiguration, type InMemoryFlagVariants, TypedInMemoryProvider } from '@openfeature/web-sdk';

export class TestingProvider<
  T extends Record<string, InMemoryFlagVariants<string>> = Record<string, InMemoryFlagVariants<string>>,
> extends TypedInMemoryProvider<T> {
  constructor(
    flagConfiguration: InMemoryFlagConfiguration<T>,
    private delay: number,
  ) {
    super(flagConfiguration);
  }

  // artificially delay our init (delaying PROVIDER_READY event)
  async initialize(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }

  // artificially delay context changes
  async onContextChange(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }
}
