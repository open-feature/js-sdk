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

  resolveBooleanEvaluation(): Promise<ResolutionDetails<boolean>> {
    throw new Error('Method not implemented.');
  }

  resolveStringEvaluation(): Promise<ResolutionDetails<string>> {
    throw new Error('Method not implemented.');
  }

  resolveNumberEvaluation(): Promise<ResolutionDetails<number>> {
    throw new Error('Method not implemented.');
  }

  resolveObjectEvaluation<T extends JsonValue>(): Promise<ResolutionDetails<T>> {
    throw new Error('Method not implemented.');
  }
}

describe('Evaluation Context', () => {
  afterEach(async () => {
    OpenFeature.setContext({});
    jest.clearAllMocks();
  });

  describe('Requirement 3.2.2', () => {
    it('the API MUST have a method for setting the global evaluation context', () => {
      const context: EvaluationContext = { property1: false };
      OpenFeature.setContext(context);
      expect(OpenFeature.getContext()).toEqual(context);
    });

    it('the API MUST have a method for setting evaluation context for a named client', () => {
      const context: EvaluationContext = { property1: false };
      OpenFeature.setContext(context);
      expect(OpenFeature.getContext()).toEqual(context);
    });

    describe('Set context during provider registration', () => {
      it('should set the context for the default provider', () => {
        const context: EvaluationContext = { property1: false };
        const provider = new MockProvider();
        OpenFeature.setProvider(provider, context);
        expect(OpenFeature.getContext()).toEqual(context);
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
        expect(initializeMock).toHaveBeenCalledWith(context);
        expect(OpenFeature.getContext()).toEqual(context);
      });
    });
  });

  describe.skip('Requirement 3.2.4', () => {
    // Only applies to the static-context paradigm
  });
});
