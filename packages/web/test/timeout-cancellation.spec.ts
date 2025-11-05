import type {
  Provider,
  ResolutionDetails,
} from '../src';
import {
  ErrorCode,
  OpenFeature,
  ProviderStatus,
} from '../src';

// Mock provider that simulates slow operations for testing
class SlowWebProvider implements Provider {
  metadata = {
    name: 'slow-web-mock',
  };

  readonly runsOn = 'client';

  constructor(private delay: number = 100) {}

  async initialize(): Promise<void> {
    // Simulate slow initialization (still async for web providers)
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return Promise.resolve();
  }

  // Web providers have synchronous evaluation methods
  resolveBooleanEvaluation(): ResolutionDetails<boolean> {
    // For the web client, we can't actually make this slow since it's synchronous
    // But we can test the cancellation check that happens before evaluation
    return {
      value: true,
      reason: 'STATIC',
    };
  }

  resolveStringEvaluation(): ResolutionDetails<string> {
    throw new Error('Method not implemented.');
  }

  resolveNumberEvaluation(): ResolutionDetails<number> {
    throw new Error('Method not implemented.');
  }

  resolveObjectEvaluation<T>(): ResolutionDetails<T> {
    throw new Error('Method not implemented.');
  }
}

describe('Web Client Timeout and Cancellation Functionality', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
  });

  describe('Flag Evaluation Cancellation', () => {
    it('should fail immediately if AbortSignal is already aborted', async () => {
      const provider = new SlowWebProvider();
      await OpenFeature.setProviderAndWait(provider);

      const client = OpenFeature.getClient();
      const controller = new AbortController();
      controller.abort(); // Pre-abort the signal

      const result = client.getBooleanDetails('test-flag', false, {
        signal: controller.signal
      });

      expect(result.errorCode).toBe(ErrorCode.GENERAL);
      expect(result.errorMessage).toContain('cancelled');
      expect(result.value).toBe(false); // Should return default value
    });

    it('should complete normally when AbortSignal is not aborted', async () => {
      const provider = new SlowWebProvider();
      await OpenFeature.setProviderAndWait(provider);

      const client = OpenFeature.getClient();
      const controller = new AbortController();

      const result = client.getBooleanDetails('test-flag', false, {
        signal: controller.signal
      });

      expect(result.errorCode).toBeUndefined();
      expect(result.value).toBe(true); // Should return actual value
    });

    it('should log warning when timeout is specified for synchronous operations', async () => {
      const provider = new SlowWebProvider();
      await OpenFeature.setProviderAndWait(provider);

      const client = OpenFeature.getClient();

      // Mock the logger to capture warnings
      const mockLogger = {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      };
      client.setLogger(mockLogger);

      const result = client.getBooleanDetails('test-flag', false, {
        timeout: 1000 // This should trigger a warning
      });

      // Should complete successfully but log a warning
      expect(result.errorCode).toBeUndefined();
      expect(result.value).toBe(true);
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Timeout option is not supported for synchronous web client evaluations')
      );
    });
  });

  describe('Provider Initialization with Timeout and Cancellation', () => {
    it('should timeout provider initialization when timeout is exceeded', async () => {
      const slowProvider = new SlowWebProvider(200); // 200ms initialization delay

      try {
        // Try to initialize with 50ms timeout (should fail)
        await OpenFeature.setProviderAndWait(slowProvider, { timeout: 50 });
        fail('Expected timeout error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.TIMEOUT);
        expect(error.message).toContain('timed out after 50ms');
      }
    });

    it('should complete provider initialization when timeout is not exceeded', async () => {
      const fastProvider = new SlowWebProvider(50); // 50ms initialization delay

      // Should succeed with 200ms timeout
      await expect(
        OpenFeature.setProviderAndWait(fastProvider, { timeout: 200 })
      ).resolves.toBeUndefined();

      const client = OpenFeature.getClient();
      expect(client.providerStatus).toBe(ProviderStatus.READY);
    });

    it('should cancel provider initialization when AbortSignal is aborted', async () => {
      const slowProvider = new SlowWebProvider(200); // 200ms initialization delay
      const controller = new AbortController();

      // Start initialization with abort signal
      const initPromise = OpenFeature.setProviderAndWait(slowProvider, {
        signal: controller.signal
      });

      // Abort after 50ms
      setTimeout(() => controller.abort(), 50);

      try {
        await initPromise;
        fail('Expected cancellation error');
      } catch (error: any) {
        expect(error.message).toContain('cancelled');
      }
    });

    it('should handle complex overload with context and options', async () => {
      const provider = new SlowWebProvider(50);
      const controller = new AbortController();
      const context = { userId: 'test-user' };

      // Test the complex overload: setProviderAndWait(provider, context, options)
      await expect(
        OpenFeature.setProviderAndWait(provider, context, { timeout: 200 })
      ).resolves.toBeUndefined();

      const client = OpenFeature.getClient();
      expect(client.providerStatus).toBe(ProviderStatus.READY);
    });

    it('should distinguish between context and options in overloads', async () => {
      const provider = new SlowWebProvider(10); // Very fast
      const controller = new AbortController();

      // Test overload with just options (no context)
      await expect(
        OpenFeature.setProviderAndWait(provider, { timeout: 100 })
      ).resolves.toBeUndefined();
    });

    it('should handle domain-scoped providers with timeout', async () => {
      const provider = new SlowWebProvider(50);

      // Test domain-scoped provider with timeout
      await expect(
        OpenFeature.setProviderAndWait('test-domain', provider, { timeout: 200 })
      ).resolves.toBeUndefined();

      const client = OpenFeature.getClient('test-domain');
      expect(client.providerStatus).toBe(ProviderStatus.READY);
    });
  });

  describe('Edge Cases', () => {
    it('should work normally when no timeout or signal is provided', async () => {
      const provider = new SlowWebProvider(10);
      await OpenFeature.setProviderAndWait(provider);

      const client = OpenFeature.getClient();

      // No timeout/cancellation options
      const result = client.getBooleanDetails('test-flag', false, {});

      expect(result.errorCode).toBeUndefined();
      expect(result.value).toBe(true);
    });

    it('should work with both timeout warning and cancellation check', async () => {
      const provider = new SlowWebProvider();
      await OpenFeature.setProviderAndWait(provider);

      const client = OpenFeature.getClient();
      const controller = new AbortController();
      controller.abort();

      // Mock the logger to capture warnings
      const mockLogger = {
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
      };
      client.setLogger(mockLogger);

      const result = client.getBooleanDetails('test-flag', false, {
        timeout: 1000, // Should trigger warning
        signal: controller.signal // Should cause cancellation
      });

      // Should be cancelled (takes precedence)
      expect(result.errorCode).toBe(ErrorCode.GENERAL);
      expect(result.errorMessage).toContain('cancelled');
      expect(result.value).toBe(false);

      // Should still log the timeout warning
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Timeout option is not supported for synchronous web client evaluations')
      );
    });
  });
});