import type { EvaluationContext, JsonValue, Provider, ProviderMetadata, ResolutionDetails } from '../src';
import { OpenFeature } from '../src';

const initializeMock = jest.fn();

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;

  constructor(options?: { name?: string }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
  }

  initialize = initializeMock;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onContextChange(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void> {
    return Promise.resolve();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resolveBooleanEvaluation = jest.fn((flagKey: string, defaultValue: boolean, context: EvaluationContext) => {
    return {
      value: true,
    };
  });

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

    it('the API MUST have a method for setting evaluation context for a domain', async () => {
      const context: EvaluationContext = { property1: false };
      const domain = 'valid';
      await OpenFeature.setContext(domain, context);
      expect(OpenFeature.getContext(domain)).toEqual(context);
    });

    it('the API MUST return the default context if no matching domain is found', async () => {
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

      it('should set the context for a domain', async () => {
        const context: EvaluationContext = { property1: false };
        const domain = 'test';
        const provider = new MockProvider({ name: domain });
        OpenFeature.setProvider(domain, provider, context);
        expect(OpenFeature.getContext()).toEqual({});
        expect(OpenFeature.getContext(domain)).toEqual(context);
      });

      it('should set the context for the default provider prior to initialization', async () => {
        const context: EvaluationContext = { property1: false };
        const provider = new MockProvider();
        await OpenFeature.setProviderAndWait(provider, context);
        expect(initializeMock).toHaveBeenCalledWith(context);
        expect(OpenFeature.getContext()).toEqual(context);
      });

      it('should set the context for a domain prior to initialization', async () => {
        const context: EvaluationContext = { property1: false };
        const domain = 'test';
        const provider = new MockProvider({ name: domain });
        await OpenFeature.setProviderAndWait(domain, provider, context);
        expect(OpenFeature.getContext()).toEqual({});
        expect(OpenFeature.getContext(domain)).toEqual(context);
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

      it('should remove context from a domain', async () => {
        const globalContext: EvaluationContext = { scope: 'global' };
        const testContext: EvaluationContext = { scope: 'test' };
        const domain = 'test';
        await OpenFeature.setContext(globalContext);
        await OpenFeature.setContext(domain, testContext);
        expect(OpenFeature.getContext(domain)).toEqual(testContext);
        await OpenFeature.clearContext(domain);
        expect(OpenFeature.getContext(domain)).toEqual(globalContext);
      });

      it('should call onContextChange for appropriate provider with appropriate context', async () => {
        const globalContext: EvaluationContext = { scope: 'global' };
        const testContext: EvaluationContext = { scope: 'test' };
        const domain = 'appropriateProviderTest';
        const defaultProvider = new MockProvider();
        const provider1 = new MockProvider();

        await OpenFeature.setProviderAndWait(defaultProvider);
        await OpenFeature.setProviderAndWait(domain, provider1);

        // Spy on context changed handlers of both providers
        const defaultProviderSpy = jest.spyOn(defaultProvider, 'onContextChange');
        const provider1Spy = jest.spyOn(provider1, 'onContextChange');

        await OpenFeature.setContext(globalContext);
        await OpenFeature.setContext(domain, testContext);

        // provider one should get global and specific context calls
        expect(defaultProviderSpy).toHaveBeenCalledWith({}, globalContext);
        expect(provider1Spy).toHaveBeenCalledWith(globalContext, testContext);
      });

      it('should pass correct context to resolver', async () => {
        const globalContext: EvaluationContext = { scope: 'global' };
        const testContext: EvaluationContext = { scope: 'test' };
        const domain = 'correctContextTest';
        const defaultProvider = new MockProvider();
        const provider1 = new MockProvider();

        await OpenFeature.setProviderAndWait(defaultProvider);
        await OpenFeature.setProviderAndWait(domain, provider1);

        // Spy on boolean resolvers of both providers
        const defaultProviderSpy = jest.spyOn(defaultProvider, 'resolveBooleanEvaluation');
        const provider1Spy = jest.spyOn(provider1, 'resolveBooleanEvaluation');

        await OpenFeature.setContext(globalContext);
        await OpenFeature.setContext(domain, testContext);

        const defaultClient = OpenFeature.getClient();
        const provider1Client = OpenFeature.getClient(domain);

        const flagName = 'some-flag';
        defaultClient.getBooleanValue(flagName, false);
        provider1Client.getBooleanValue(flagName, false);

        // provider one should get global and specific context
        expect(defaultProviderSpy).toHaveBeenCalledWith(flagName, false, globalContext, expect.anything());
        expect(provider1Spy).toHaveBeenCalledWith(flagName, false, testContext, expect.anything());
      });

      it('should only call a providers onContextChange once when clearing context', async () => {
        const globalContext: EvaluationContext = { scope: 'global' };
        const testContext: EvaluationContext = { scope: 'test' };
        const domain = 'test';
        await OpenFeature.setContext(globalContext);
        await OpenFeature.setContext(domain, testContext);

        const defaultProvider = new MockProvider();
        const provider1 = new MockProvider();

        OpenFeature.setProvider(defaultProvider);
        OpenFeature.setProvider(domain, provider1);

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
        OpenFeature.setProvider('domain1', provider1);
        OpenFeature.setProvider('domain2', provider2);

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

        const domain1 = 'domain1';
        const domain2 = 'domain2';

        OpenFeature.setProvider(defaultProvider);
        OpenFeature.setProvider(domain1, provider1);
        OpenFeature.setProvider(domain2, provider2);

        // Set context for domain1
        await OpenFeature.setContext(domain1, { property1: 'test' });

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
        OpenFeature.setProvider('domain1', provider1);
        OpenFeature.setProvider('domain2', provider2);

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
