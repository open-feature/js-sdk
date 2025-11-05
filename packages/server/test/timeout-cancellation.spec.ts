import type {
  Provider,
  ResolutionDetails,
} from '../src';
import {
  ErrorCode,
  OpenFeature,
  ProviderStatus,
} from '../src';

// Mock provider that simulates slow operations for timeout testing
class SlowMockProvider implements Provider {
  metadata = {
    name: 'slow-mock',
  };

  readonly runsOn = 'server';

  constructor(private delay: number = 100) {}

  async initialize(): Promise<void> {
    // Simulate slow initialization
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return Promise.resolve();
  }

  async resolveBooleanEvaluation(): Promise<ResolutionDetails<boolean>> {
    // Simulate slow evaluation
    await new Promise(resolve => setTimeout(resolve, this.delay));
    return {
      value: true,
      reason: 'STATIC',
    };
  }

  resolveStringEvaluation(): Promise<ResolutionDetails<string>> {
    throw new Error('Method not implemented.');
  }

  resolveNumberEvaluation(): Promise<ResolutionDetails<number>> {
    throw new Error('Method not implemented.');
  }

  resolveObjectEvaluation<T>(): Promise<ResolutionDetails<T>> {
    throw new Error('Method not implemented.');
  }
}

describe('Timeout and Cancellation Functionality', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
  });

  describe('Flag Evaluation Timeouts', () => {
    it('should timeout flag evaluation when timeout is exceeded', async () => {
      // Set up a slow provider
      const slowProvider = new SlowMockProvider(200); // 200ms delay
      await OpenFeature.setProviderAndWait(slowProvider);

      const client = OpenFeature.getClient();

      // Try to evaluate with a 50ms timeout (should fail)
      const result = await client.getBooleanDetails('test-flag', false, {}, {
        timeout: 50
      });

      expect(result.errorCode).toBe(ErrorCode.TIMEOUT);
      expect(result.errorMessage).toContain('timed out after 50ms');
      expect(result.value).toBe(false); // Should return default value
    });

    it('should complete flag evaluation when timeout is not exceeded', async () => {
      // Set up a fast provider
      const fastProvider = new SlowMockProvider(50); // 50ms delay
      await OpenFeature.setProviderAndWait(fastProvider);

      const client = OpenFeature.getClient();

      // Try to evaluate with a 200ms timeout (should succeed)
      const result = await client.getBooleanDetails('test-flag', false, {}, {
        timeout: 200
      });

      expect(result.errorCode).toBeUndefined();
      expect(result.value).toBe(true); // Should return actual value
    });

    it('should cancel flag evaluation when AbortSignal is aborted', async () => {
      // Set up a slow provider
      const slowProvider = new SlowMockProvider(200); // 200ms delay
      await OpenFeature.setProviderAndWait(slowProvider);

      const client = OpenFeature.getClient();
      const controller = new AbortController();

      // Start evaluation with abort signal
      const evaluationPromise = client.getBooleanDetails('test-flag', false, {}, {
        signal: controller.signal
      });

      // Abort after 50ms
      setTimeout(() => controller.abort(), 50);

      const result = await evaluationPromise;

      expect(result.errorCode).toBe(ErrorCode.GENERAL);
      expect(result.errorMessage).toContain('cancelled');
      expect(result.value).toBe(false); // Should return default value
    });

    it('should fail immediately if AbortSignal is already aborted', async () => {
      const fastProvider = new SlowMockProvider(10); // Very fast provider
      await OpenFeature.setProviderAndWait(fastProvider);

      const client = OpenFeature.getClient();
      const controller = new AbortController();
      controller.abort(); // Pre-abort the signal

      const result = await client.getBooleanDetails('test-flag', false, {}, {
        signal: controller.signal
      });

      expect(result.errorCode).toBe(ErrorCode.GENERAL);
      expect(result.errorMessage).toContain('cancelled');
      expect(result.value).toBe(false);
    });
  });

  describe('Provider Initialization Timeouts', () => {
    it('should timeout provider initialization when timeout is exceeded', async () => {
      const slowProvider = new SlowMockProvider(200); // 200ms initialization delay

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
      const fastProvider = new SlowMockProvider(50); // 50ms initialization delay

      // Should succeed with 200ms timeout
      await expect(
        OpenFeature.setProviderAndWait(fastProvider, { timeout: 200 })
      ).resolves.toBeUndefined();

      const client = OpenFeature.getClient();
      expect(client.providerStatus).toBe(ProviderStatus.READY);
    });

    it('should cancel provider initialization when AbortSignal is aborted', async () => {
      const slowProvider = new SlowMockProvider(200); // 200ms initialization delay
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

    it('should fail immediately if AbortSignal is already aborted for provider initialization', async () => {
      const provider = new SlowMockProvider(10); // Very fast provider
      const controller = new AbortController();
      controller.abort(); // Pre-abort the signal

      try {
        await OpenFeature.setProviderAndWait(provider, { signal: controller.signal });
        fail('Expected cancellation error');
      } catch (error: any) {
        expect(error.message).toContain('cancelled');
      }
    });
  });

  describe('Combined Timeout and Cancellation', () => {
    it('should respect whichever comes first - timeout vs cancellation', async () => {
      const slowProvider = new SlowMockProvider(200);
      const controller = new AbortController();

      // Start initialization with both timeout (100ms) and abort signal
      const initPromise = OpenFeature.setProviderAndWait(slowProvider, {
        timeout: 100,
        signal: controller.signal
      });

      // Abort after 50ms (should win over 100ms timeout)
      setTimeout(() => controller.abort(), 50);

      try {
        await initPromise;
        fail('Expected error');
      } catch (error: any) {
        // Should be cancelled, not timed out
        expect(error.message).toContain('cancelled');
      }
    });

    it('should timeout when timeout comes before cancellation', async () => {
      const slowProvider = new SlowMockProvider(200);
      const controller = new AbortController();

      // Start initialization with timeout (50ms) and later abort signal
      const initPromise = OpenFeature.setProviderAndWait(slowProvider, {
        timeout: 50,
        signal: controller.signal
      });

      // Abort after 100ms (timeout should win)
      setTimeout(() => controller.abort(), 100);

      try {
        await initPromise;
        fail('Expected timeout error');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCode.TIMEOUT);
        expect(error.message).toContain('timed out after 50ms');
      }
    });
  });

  describe('Edge Cases', () => {
    it('should work normally when timeout is 0 or negative', async () => {
      const provider = new SlowMockProvider(10);
      await OpenFeature.setProviderAndWait(provider);

      const client = OpenFeature.getClient();

      // Timeout of 0 should be ignored
      const result = await client.getBooleanDetails('test-flag', false, {}, {
        timeout: 0
      });

      expect(result.errorCode).toBeUndefined();
      expect(result.value).toBe(true);
    });

    it('should work normally when no timeout or signal is provided', async () => {
      const provider = new SlowMockProvider(50);
      await OpenFeature.setProviderAndWait(provider);

      const client = OpenFeature.getClient();

      // No timeout/cancellation options
      const result = await client.getBooleanDetails('test-flag', false, {}, {});

      expect(result.errorCode).toBeUndefined();
      expect(result.value).toBe(true);
    });
  });
});