import { EvaluationContext, JsonValue, OpenFeature, Provider, ProviderMetadata, ResolutionDetails } from '../src';

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;

  constructor(options?: { name?: string }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onContextChange(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void> {
    return Promise.resolve();
  }

  resolveBooleanEvaluation(): ResolutionDetails<boolean> {
    throw new Error('Not implemented');
  }

  resolveNumberEvaluation(): ResolutionDetails<number> {
    throw new Error('Not implemented');
  }

  resolveObjectEvaluation<T extends JsonValue>(): ResolutionDetails<T> {
    throw new Error('Not implemented');
  }

  resolveStringEvaluation(): ResolutionDetails<string> {
    throw new Error('Not implemented');
  }
}

describe('Evaluation Context', () => {
  describe('Requirement 3.2.2', () => {
    it('the API MUST have a method for setting the global evaluation context', () => {
      const context: EvaluationContext = { property1: false };
      OpenFeature.setContext(context);
      expect(OpenFeature.getContext()).toEqual(context);
    });
  });

  describe('Requirement 3.2.4', () => {
    describe('when the global evaluation context is set, the on context changed handler MUST run', () => {
      it('on all registered providers', async () => {
        // Set initial context
        const context: EvaluationContext = { property1: false };
        await OpenFeature.setContext(context);

        // Set some providers
        const defaultProvider = new MockProvider();
        const provider1 = new MockProvider();
        const provider2 = new MockProvider();

        OpenFeature.setProvider(defaultProvider);
        OpenFeature.setProvider('client1', provider1);
        OpenFeature.setProvider('client2', provider2);

        // Spy on context changed handlers of all providers
        const contextChangedSpys = [defaultProvider, provider1, provider2].map((provider) =>
          jest.spyOn(provider, 'onContextChange')
        );

        // Change context
        const newContext: EvaluationContext = { property1: true, property2: 'prop2' };
        await OpenFeature.setContext(newContext);

        contextChangedSpys.forEach((spy) => expect(spy).toHaveBeenCalledWith(context, newContext));
      });
    });
  });
});
