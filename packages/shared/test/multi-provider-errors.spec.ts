import {
  constructAggregateError,
  throwAggregateErrorFromPromiseResults,
  AggregateError,
} from '../src/provider/multi-provider/errors';
import type { RegisteredProvider } from '../src/provider/multi-provider/types';
import { ErrorCode, FlagNotFoundError, TypeMismatchError } from '../src';

describe('Multi-Provider Errors', () => {
  describe('constructAggregateError', () => {
    it.each([1, 2])('keeps GENERAL for %i errors with a non-OpenFeature code', (count) => {
      const error = constructAggregateError(
        Array.from({ length: count }, (_, i) => ({
          error: Object.assign(new Error('Connection reset'), { code: 'ECONNRESET' }),
          providerName: `provider${i}`,
        })),
      );

      expect(error.code).toBe(ErrorCode.GENERAL);
    });

    it('preserves a recognized code without requiring an OpenFeatureError instance', () => {
      const error = constructAggregateError([
        {
          error: Object.assign(new Error('Missing flag'), { code: ErrorCode.FLAG_NOT_FOUND }),
          providerName: 'provider',
        },
      ]);

      expect(error.code).toBe(ErrorCode.FLAG_NOT_FOUND);
    });

    it.each([1, 2])('preserves a common error code from %i provider errors', (count) => {
      const providerErrors = Array.from({ length: count }, (_, i) => ({
        error: new FlagNotFoundError(`Missing flag from provider ${i}`),
        providerName: `provider${i}`,
      }));

      const error = constructAggregateError(providerErrors);

      expect(error.code).toBe(ErrorCode.FLAG_NOT_FOUND);
      expect(error.originalErrors.map(({ error }) => error)).toEqual(providerErrors.map(({ error }) => error));
    });

    it.each([new TypeMismatchError(), new Error('unknown error'), null])(
      'keeps GENERAL when provider error codes do not agree: %p',
      (otherError) => {
        const error = constructAggregateError([
          { error: new FlagNotFoundError(), providerName: 'missing' },
          { error: otherError, providerName: 'other' },
        ]);

        expect(error.code).toBe(ErrorCode.GENERAL);
      },
    );

    it('should create an AggregateError with provider errors', () => {
      const providerErrors = [
        { error: new Error('Provider 1 failed'), providerName: 'provider1' },
        { error: new Error('Provider 2 failed'), providerName: 'provider2' },
      ];

      const error = constructAggregateError(providerErrors);

      expect(error).toBeInstanceOf(AggregateError);
      expect(error.message).toContain('provider1');
      expect(error.message).toContain('Provider 1 failed');
      expect(error.originalErrors).toHaveLength(2);
      expect(error.originalErrors[0].source).toBe('provider1');
      expect(error.originalErrors[1].source).toBe('provider2');
    });

    it('should handle single error', () => {
      const providerErrors = [{ error: new Error('Single error'), providerName: 'single-provider' }];

      const error = constructAggregateError(providerErrors);

      expect(error).toBeInstanceOf(AggregateError);
      expect(error.message).toContain('single-provider');
      expect(error.originalErrors).toHaveLength(1);
    });

    it('should handle empty error array gracefully', () => {
      const providerErrors: { error: unknown; providerName: string }[] = [];

      const error = constructAggregateError(providerErrors);

      expect(error).toBeInstanceOf(AggregateError);
      expect(error.message).toBe('Provider errors occurred');
      expect(error.originalErrors).toHaveLength(0);
      expect(error.code).toBe(ErrorCode.GENERAL);
    });

    it('should handle non-Error objects as errors', () => {
      const providerErrors = [
        { error: 'string error', providerName: 'provider1' },
        { error: { code: 'ERR_001' }, providerName: 'provider2' },
        { error: null, providerName: 'provider3' },
      ];

      const error = constructAggregateError(providerErrors);

      expect(error).toBeInstanceOf(AggregateError);
      expect(error.originalErrors).toHaveLength(3);
    });
  });

  describe('throwAggregateErrorFromPromiseResults', () => {
    type MockProvider = { name: string };

    it('should throw when there are rejected promises', () => {
      const results: PromiseSettledResult<unknown>[] = [
        { status: 'fulfilled', value: 'success' },
        { status: 'rejected', reason: new Error('Failed') },
      ];
      const providerEntries: RegisteredProvider<MockProvider>[] = [
        { name: 'provider1', provider: { name: 'provider1' } },
        { name: 'provider2', provider: { name: 'provider2' } },
      ];

      expect(() => throwAggregateErrorFromPromiseResults(results, providerEntries)).toThrow();
    });

    it('should not throw when all promises are fulfilled', () => {
      const results: PromiseSettledResult<unknown>[] = [
        { status: 'fulfilled', value: 'success1' },
        { status: 'fulfilled', value: 'success2' },
      ];
      const providerEntries: RegisteredProvider<MockProvider>[] = [
        { name: 'provider1', provider: { name: 'provider1' } },
        { name: 'provider2', provider: { name: 'provider2' } },
      ];

      expect(() => throwAggregateErrorFromPromiseResults(results, providerEntries)).not.toThrow();
    });

    it('should include all rejected promise errors in thrown error', () => {
      const results: PromiseSettledResult<unknown>[] = [
        { status: 'rejected', reason: new Error('Error 1') },
        { status: 'fulfilled', value: 'success' },
        { status: 'rejected', reason: new Error('Error 3') },
      ];
      const providerEntries: RegisteredProvider<MockProvider>[] = [
        { name: 'provider1', provider: { name: 'provider1' } },
        { name: 'provider2', provider: { name: 'provider2' } },
        { name: 'provider3', provider: { name: 'provider3' } },
      ];

      try {
        throwAggregateErrorFromPromiseResults(results, providerEntries);
        fail('Expected to throw');
      } catch (error) {
        const aggregateError = error as AggregateError;
        expect(aggregateError.originalErrors).toHaveLength(2);
        expect(aggregateError.originalErrors[0].source).toBe('provider1');
        expect(aggregateError.originalErrors[1].source).toBe('provider3');
      }
    });
  });
});
