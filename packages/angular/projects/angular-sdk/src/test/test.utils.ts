import { InMemoryProvider } from '@openfeature/web-sdk';

export class TestingProvider extends InMemoryProvider {
  constructor(
    flagConfiguration: ConstructorParameters<typeof InMemoryProvider>[0],
    private delay: number,
  ) {
    super(flagConfiguration);
    if (!delay) {
      // If no delay, we remove the optional initialize method to avoid the provider not being ready immediately
      Object.assign(this, { initialize: undefined });
    }
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
