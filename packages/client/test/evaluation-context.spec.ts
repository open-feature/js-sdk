import {
  EvaluationContext,
  JsonValue,
  OpenFeature,
  Provider,
  ProviderMetadata,
  ProviderStatus,
  ResolutionDetails,
} from '../src';

const initializeMock = jest.fn();

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;
  status = ProviderStatus.NOT_READY;
  constructor(options?: { name?: string }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
  }

  initialize = initializeMock;

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
  afterEach(async () => {
    await OpenFeature.clearContexts();
    jest.clearAllMocks();
  });

  describe('Requirement 3.2.2', () => {
    it('the API MUST have a method for setting the global evaluation context', async () => {
      const context: EvaluationContext = { property1: false };
      await OpenFeature.setContext(context);
      expect(OpenFeature.getContext()).toEqual(context);
    });

    it('the API MUST have a method for setting evaluation context for a named client', async () => {
      const context: EvaluationContext = { property1: false };
      const clientName = 'valid';
      await OpenFeature.setContext(clientName, context);
      expect(OpenFeature.getContext(clientName)).toEqual(context);
    });

    it('the API MUST return the default context if not match is found', async () => {
      const defaultContext: EvaluationContext = { name: 'test' };
      const nameContext: EvaluationContext = { property1: false };
      await OpenFeature.setContext(defaultContext);
      await OpenFeature.setContext('test', nameContext);
      expect(OpenFeature.getContext('invalid')).toEqual(defaultContext);
    });

    describe('Set context during provider registration', () => {
      it('should set the context for the default provider', () => {
        const context: EvaluationContext = { property1: false };
        const provider = new MockProvider();
        OpenFeature.setProvider(provider, context);
        expect(OpenFeature.getContext()).toEqual(context);
      });

      it('should set the context for a named provider', async () => {
        const context: EvaluationContext = { property1: false };
        const clientName = 'test';
        const provider = new MockProvider({ name: clientName });
        OpenFeature.setProvider(clientName, provider, context);
        expect(OpenFeature.getContext()).toEqual({});
        expect(OpenFeature.getContext(clientName)).toEqual(context);
      });

      it('should set the context for the default provider prior to initialization', async () => {
        const context: EvaluationContext = { property1: false };
        const provider = new MockProvider();
        await OpenFeature.setProviderAndWait(provider, context);
        expect(initializeMock).toHaveBeenCalledWith(context);
        expect(OpenFeature.getContext()).toEqual(context);
      });

      it('should set the context for a named provider prior to initialization', async () => {
        const context: EvaluationContext = { property1: false };
        const clientName = 'test';
        const provider = new MockProvider({ name: clientName });
        await OpenFeature.setProviderAndWait(clientName, provider, context);
        expect(OpenFeature.getContext()).toEqual({});
        expect(OpenFeature.getContext(clientName)).toEqual(context);
        expect(initializeMock).toHaveBeenCalledWith(context);
      });
    });

    describe('Context Management', () => {
      it('should reset global context', async () => {
        const globalContext: EvaluationContext = { scope: 'global' };
        await OpenFeature.setContext(globalContext);
        expect(OpenFeature.getContext()).toEqual(globalContext);
        await OpenFeature.clearContext();
        expect(OpenFeature.getContext()).toEqual({});
      });

      it('should remove context from a name provider', async () => {
        const globalContext: EvaluationContext = { scope: 'global' };
        const testContext: EvaluationContext = { scope: 'test' };
        const clientName = 'test';
        await OpenFeature.setContext(globalContext);
        await OpenFeature.setContext(clientName, testContext);
        expect(OpenFeature.getContext(clientName)).toEqual(testContext);
        await OpenFeature.clearContext(clientName);
        expect(OpenFeature.getContext(clientName)).toEqual(globalContext);
      });

      it('should only call a providers onContextChange once when clearing context', async () => {
        const globalContext: EvaluationContext = { scope: 'global' };
        const testContext: EvaluationContext = { scope: 'test' };
        const clientName = 'test';
        await OpenFeature.setContext(globalContext);
        await OpenFeature.setContext(clientName, testContext);

        const defaultProvider = new MockProvider();
        const provider1 = new MockProvider();

        OpenFeature.setProvider(defaultProvider);
        OpenFeature.setProvider(clientName, provider1);

        // Spy on context changed handlers of all providers
        const contextChangedSpies = [defaultProvider, provider1].map((provider) =>
          jest.spyOn(provider, 'onContextChange'),
        );

        await OpenFeature.clearContexts();

        contextChangedSpies.forEach((spy) => expect(spy).toHaveBeenCalledTimes(1));
      });
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
        const contextChangedSpies = [defaultProvider, provider1, provider2].map((provider) =>
          jest.spyOn(provider, 'onContextChange'),
        );

        // Change context
        const newContext: EvaluationContext = { property1: true, property2: 'prop2' };
        await OpenFeature.setContext(newContext);

        contextChangedSpies.forEach((spy) => expect(spy).toHaveBeenCalledWith(context, newContext));
      });

      it('on only the providers using the default context', async () => {
        // Set initial context
        const context: EvaluationContext = { property1: false };
        await OpenFeature.setContext(context);

        // Set some providers
        const defaultProvider = new MockProvider();
        const provider1 = new MockProvider();
        const provider2 = new MockProvider();

        const client1 = 'client1';
        const client2 = 'client2';

        OpenFeature.setProvider(defaultProvider);
        OpenFeature.setProvider(client1, provider1);
        OpenFeature.setProvider(client2, provider2);

        // Set context for client1
        await OpenFeature.setContext(client1, { property1: 'test' });

        // Spy on context changed handlers of all providers
        const contextShouldChangeSpies = [defaultProvider, provider2].map((provider) =>
          jest.spyOn(provider, 'onContextChange'),
        );

        const contextShouldntChangeSpies = jest.spyOn(provider1, 'onContextChange');

        // Change context
        const newContext: EvaluationContext = { property1: true, property2: 'prop2' };
        await OpenFeature.setContext(newContext);

        contextShouldChangeSpies.forEach((spy) => expect(spy).toHaveBeenCalledWith(context, newContext));
        expect(contextShouldntChangeSpies).not.toHaveBeenCalled();
      });

      it('on all registered providers even if one fails', async () => {
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
        const contextChangedSpies = [defaultProvider, provider1, provider2].map((provider) =>
          jest.spyOn(provider, 'onContextChange'),
        );

        // Let first handler fail
        contextChangedSpies[0].mockImplementation(() => Promise.reject(new Error('Error')));

        // Change context
        const newContext: EvaluationContext = { property1: true, property2: 'prop2' };
        await OpenFeature.setContext(newContext);

        contextChangedSpies.forEach((spy) => expect(spy).toHaveBeenCalledWith(context, newContext));
      });
    });
  });
});
