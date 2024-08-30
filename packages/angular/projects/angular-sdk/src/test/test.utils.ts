import { EvaluationContext, InMemoryProvider } from '@openfeature/web-sdk';

export class TestingProvider extends InMemoryProvider {
  constructor(
    flagConfiguration: ConstructorParameters<typeof InMemoryProvider>[0],
    private delay: number,
  ) {
    super(flagConfiguration);
  }

  // artificially delay our init (delaying PROVIDER_READY event)
  override async initialize(context?: EvaluationContext | undefined): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    return super.initialize(context);
  }

  // artificially delay context changes
  async onContextChange(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }
}
