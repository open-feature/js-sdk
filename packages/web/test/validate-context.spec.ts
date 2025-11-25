import type { JsonValue, Provider, ProviderMetadata, ResolutionDetails } from '../src';
import { NOOP_PROVIDER, OpenFeature, ProviderStatus } from '../src';

const initializeMock = jest.fn().mockResolvedValue(undefined);
const contextChangeMock = jest.fn().mockResolvedValue(undefined);

class MockProvider implements Provider {
  readonly metadata: ProviderMetadata;

  constructor(options?: { name?: string }) {
    this.metadata = { name: options?.name ?? 'mock-provider' };
  }

  initialize = initializeMock;
  onContextChange = contextChangeMock;

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

describe('validateContext', () => {
  afterEach(async () => {
    await OpenFeature.clearContexts();
    await OpenFeature.setProviderAndWait(NOOP_PROVIDER, {});
    jest.clearAllMocks();
  });

  describe('when validateContext is not provided', () => {
    it('should call initialize on setProvider', async () => {
      const provider = new MockProvider();
      OpenFeature.setProvider(provider, {});

      await new Promise(process.nextTick);

      expect(initializeMock).toHaveBeenCalledTimes(1);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);
    });

    it('should call initialize on setProviderAndWait', async () => {
      const provider = new MockProvider();
      await OpenFeature.setProviderAndWait(provider, {});

      expect(initializeMock).toHaveBeenCalledTimes(1);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);
    });

    it('should not call initialize on context change', async () => {
      const provider = new MockProvider();
      await OpenFeature.setProviderAndWait(provider, {});

      expect(initializeMock).toHaveBeenCalledTimes(1);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);

      await OpenFeature.setContext({ user: 'test-user' });

      expect(initializeMock).toHaveBeenCalledTimes(1);
      expect(contextChangeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('when validateContext evaluates to true', () => {
    it('should call initialize on setProvider', async () => {
      const provider = new MockProvider();
      const validateContext = jest.fn().mockReturnValue(true);
      OpenFeature.setProvider(provider, {}, { validateContext });

      await new Promise(process.nextTick);

      expect(validateContext).toHaveBeenCalledTimes(1);
      expect(initializeMock).toHaveBeenCalledTimes(1);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);
    });

    it('should call initialize on setProviderAndWait', async () => {
      const provider = new MockProvider();
      const validateContext = jest.fn().mockReturnValue(true);
      await OpenFeature.setProviderAndWait(provider, {}, { validateContext });

      expect(validateContext).toHaveBeenCalledTimes(1);
      expect(initializeMock).toHaveBeenCalledTimes(1);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);
    });

    describe('when the provider is initialized', () => {
      it('should not call initialize again on context change', async () => {
        const provider = new MockProvider();
        const validateContext = jest.fn().mockReturnValue(true);
        await OpenFeature.setProviderAndWait(provider, {}, { validateContext });

        expect(validateContext).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);

        await OpenFeature.setContext({ user: 'test-user' });

        expect(validateContext).toHaveBeenCalledTimes(2);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(contextChangeMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('when the provider is not yet initialized', () => {
      it('should call initialize on the first valid context change', async () => {
        const provider = new MockProvider();
        const validateContext = jest.fn().mockReturnValue(false);
        OpenFeature.setProvider(provider, {}, { validateContext });

        expect(validateContext).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.NOT_READY);

        validateContext.mockReturnValue(true);
        await OpenFeature.setContext({ user: 'test-user' });

        expect(validateContext).toHaveBeenCalledTimes(2);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(contextChangeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);

        await OpenFeature.setContext({ user: 'another-user' });

        expect(validateContext).toHaveBeenCalledTimes(3);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(contextChangeMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when validateContext evaluates to false', () => {
    it('should not call initialize on setProvider', async () => {
      const provider = new MockProvider();
      const validateContext = jest.fn().mockReturnValue(false);
      OpenFeature.setProvider(provider, {}, { validateContext });

      await new Promise(process.nextTick);

      expect(validateContext).toHaveBeenCalledTimes(1);
      expect(initializeMock).toHaveBeenCalledTimes(0);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.NOT_READY);
    });

    it('should not call initialize on setProviderAndWait', async () => {
      const provider = new MockProvider();
      const validateContext = jest.fn().mockReturnValue(false);
      await OpenFeature.setProviderAndWait(provider, {}, { validateContext });

      expect(validateContext).toHaveBeenCalledTimes(1);
      expect(initializeMock).toHaveBeenCalledTimes(0);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.NOT_READY);
    });

    describe('when the provider is initialized', () => {
      it('should not process a context change that fails validation', async () => {
        const provider = new MockProvider();
        const validateContext = jest.fn().mockReturnValue(true);
        await OpenFeature.setProviderAndWait(provider, {}, { validateContext });

        expect(validateContext).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);

        validateContext.mockReturnValue(false);
        await OpenFeature.setContext({ user: 'test-user' });

        expect(validateContext).toHaveBeenCalledTimes(2);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(contextChangeMock).toHaveBeenCalledTimes(0);
      });
    });

    describe('when the provider is not yet initialized', () => {
      it('should not call initialize until a valid context is provided', async () => {
        const provider = new MockProvider();
        const validateContext = jest.fn().mockReturnValue(false);
        OpenFeature.setProvider(provider, {}, { validateContext });

        expect(validateContext).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.NOT_READY);

        await OpenFeature.setContext({ user: 'test-user' });

        expect(validateContext).toHaveBeenCalledTimes(2);
        expect(initializeMock).toHaveBeenCalledTimes(0);
        expect(contextChangeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.NOT_READY);

        validateContext.mockReturnValue(true);
        await OpenFeature.setContext({ user: 'another-user' });

        expect(validateContext).toHaveBeenCalledTimes(3);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(contextChangeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);

        await OpenFeature.setContext({ user: 'final-user' });

        expect(validateContext).toHaveBeenCalledTimes(4);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(contextChangeMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('when validateContext throws an error', () => {
    it('should move to ERROR status on setProvider', async () => {
      const provider = new MockProvider();
      const validateContext = jest.fn().mockImplementation(() => {
        throw new Error('Validation error');
      });
      OpenFeature.setProvider(provider, {}, { validateContext });

      await new Promise(process.nextTick);

      expect(validateContext).toHaveBeenCalledTimes(1);
      expect(initializeMock).toHaveBeenCalledTimes(0);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.ERROR);
    });

    it('should propagate error on setProviderAndWait', async () => {
      const provider = new MockProvider();
      const validateContext = jest.fn().mockImplementation(() => {
        throw new Error('Validation error');
      });

      await expect(OpenFeature.setProviderAndWait(provider, {}, { validateContext })).rejects.toThrow(
        'Validation error',
      );

      expect(validateContext).toHaveBeenCalledTimes(1);
      expect(initializeMock).toHaveBeenCalledTimes(0);
      expect(OpenFeature.getProvider()).toBe(NOOP_PROVIDER);
      expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);
    });

    describe('when the provider is initialized', () => {
      it('should move to ERROR status on context change', async () => {
        const provider = new MockProvider();
        const validateContext = jest.fn().mockReturnValue(true);
        await OpenFeature.setProviderAndWait(provider, {}, { validateContext });

        expect(validateContext).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.READY);

        validateContext.mockImplementation(() => {
          throw new Error('Validation error');
        });
        await OpenFeature.setContext({ user: 'test-user' });

        expect(validateContext).toHaveBeenCalledTimes(2);
        expect(initializeMock).toHaveBeenCalledTimes(1);
        expect(contextChangeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.ERROR);
      });
    });

    describe('when the provider is not yet initialized', () => {
      it('should move to ERROR status on context change', async () => {
        const provider = new MockProvider();
        const validateContext = jest.fn().mockReturnValue(false);
        await OpenFeature.setProviderAndWait(provider, {}, { validateContext });

        expect(validateContext).toHaveBeenCalledTimes(1);
        expect(initializeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.NOT_READY);

        validateContext.mockImplementation(() => {
          throw new Error('Validation error');
        });
        await OpenFeature.setContext({ user: 'test-user' });

        expect(validateContext).toHaveBeenCalledTimes(2);
        expect(initializeMock).toHaveBeenCalledTimes(0);
        expect(contextChangeMock).toHaveBeenCalledTimes(0);
        expect(OpenFeature.getClient().providerStatus).toBe(ProviderStatus.ERROR);
      });
    });
  });
});
