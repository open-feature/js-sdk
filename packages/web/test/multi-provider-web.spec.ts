import { WebMultiProvider } from './multi-provider-web';
import type {
  EvaluationContext,
  FlagValue,
  FlagValueType,
  Hook,
  Logger,
  Provider,
  ProviderEmittableEvents,
  ProviderMetadata,
  TrackingEventDetails,
} from '@openfeature/web-sdk';
import {
  DefaultLogger,
  ErrorCode,
  FlagNotFoundError,
  InMemoryProvider,
  OpenFeatureEventEmitter,
  ClientProviderEvents,
} from '@openfeature/web-sdk';
import { FirstMatchStrategy } from './strategies/FirstMatchStrategy';
import { FirstSuccessfulStrategy } from './strategies/FirstSuccessfulStrategy';
import { ComparisonStrategy } from './strategies/ComparisonStrategy';
import type { BaseEvaluationStrategy } from './strategies/BaseEvaluationStrategy';

class TestProvider implements Provider {
  public metadata: ProviderMetadata = {
    name: 'TestProvider',
  };
  public events = new OpenFeatureEventEmitter();
  public hooks: Hook[] = [];
  public track = jest.fn();
  constructor(
    public resolveBooleanEvaluation = jest.fn().mockReturnValue({ value: false }),
    public resolveStringEvaluation = jest.fn().mockReturnValue({ value: 'default' }),
    public resolveObjectEvaluation = jest.fn().mockReturnValue({ value: {} }),
    public resolveNumberEvaluation = jest.fn().mockReturnValue({ value: 0 }),
    public initialize = jest.fn(),
  ) {}

  emitEvent(type: ProviderEmittableEvents) {
    this.events.emit(type, { providerName: this.metadata.name });
  }
}

const callEvaluation = (multi: WebMultiProvider, context: EvaluationContext) => {
  callBeforeHook(multi, context, 'flag', 'boolean', false);
  return multi.resolveBooleanEvaluation('flag', false, context);
};

const callBeforeHook = (
  multi: WebMultiProvider,
  context: EvaluationContext,
  flagKey: string,
  flagType: FlagValueType,
  defaultValue: FlagValue,
  logger: Logger = new DefaultLogger(),
) => {
  const hookContext = {
    context: context,
    flagKey,
    flagValueType: flagType,
    defaultValue,
    clientMetadata: {} as any,
    providerMetadata: {} as any,
    logger: logger,
  };
  multi.hooks[0].before?.(hookContext);
};

describe('MultiProvider', () => {
  const logger = new DefaultLogger();

  describe('unique names', () => {
    it('uses provider names for unique types', () => {
      const multiProvider = new WebMultiProvider([
        {
          provider: new InMemoryProvider(),
        },
        {
          provider: new TestProvider(),
        },
      ]);
      expect(multiProvider.providerEntries[0].name).toEqual('in-memory');
      expect(multiProvider.providerEntries[1].name).toEqual('TestProvider');
      expect(multiProvider.providerEntries.length).toBe(2);
    });
    it('generates unique names for identical provider types', () => {
      const multiProvider = new WebMultiProvider([
        {
          provider: new TestProvider(),
        },
        {
          provider: new TestProvider(),
        },
        {
          provider: new TestProvider(),
        },
        {
          provider: new InMemoryProvider(),
        },
      ]);
      expect(multiProvider.providerEntries[0].name).toEqual('TestProvider-1');
      expect(multiProvider.providerEntries[1].name).toEqual('TestProvider-2');
      expect(multiProvider.providerEntries[2].name).toEqual('TestProvider-3');
      expect(multiProvider.providerEntries[3].name).toEqual('in-memory');
      expect(multiProvider.providerEntries.length).toBe(4);
    });
    it('uses specified names for identical provider types', () => {
      const multiProvider = new WebMultiProvider([
        {
          provider: new TestProvider(),
          name: 'provider1',
        },
        {
          provider: new TestProvider(),
          name: 'provider2',
        },
      ]);
      expect(multiProvider.providerEntries[0].name).toEqual('provider1');
      expect(multiProvider.providerEntries[1].name).toEqual('provider2');
      expect(multiProvider.providerEntries.length).toBe(2);
    });
    it('throws an error if specified names are not unique', () => {
      expect(
        () =>
          new WebMultiProvider([
            {
              provider: new TestProvider(),
              name: 'provider',
            },
            {
              provider: new InMemoryProvider(),
              name: 'provider',
            },
          ]),
      ).toThrow();
    });
  });

  describe('event tracking and statuses', () => {
    it('initializes by waiting for all initializations', async () => {
      const provider1 = new TestProvider();
      const provider2 = new TestProvider();
      let initializations = 0;
      const multiProvider = new WebMultiProvider([
        {
          provider: provider1,
        },
        {
          provider: provider2,
        },
      ]);
      provider1.initialize.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        initializations++;
      });
      provider2.initialize.mockImplementation(() => initializations++);
      await multiProvider.initialize();
      expect(initializations).toBe(2);
    });

    it('throws error if a provider errors on initialization', async () => {
      const provider1 = new TestProvider();
      const provider2 = new TestProvider();
      let initializations = 0;
      const multiProvider = new WebMultiProvider([
        {
          provider: provider1,
        },
        {
          provider: provider2,
        },
      ]);
      provider1.initialize.mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        throw new Error('Failure!');
      });
      provider2.initialize.mockImplementation(async () => initializations++);
      await expect(() => multiProvider.initialize()).rejects.toThrow('Failure!');
    });

    it('emits events when aggregate status changes', async () => {
      const provider1 = new TestProvider();
      const provider2 = new TestProvider();
      const multiProvider = new WebMultiProvider([
        {
          provider: provider1,
        },
        {
          provider: provider2,
        },
      ]);

      let readyEmitted = 0;
      let errorEmitted = 0;
      let staleEmitted = 0;
      multiProvider.events.addHandler(ClientProviderEvents.Ready, () => {
        readyEmitted++;
      });

      multiProvider.events.addHandler(ClientProviderEvents.Error, () => {
        errorEmitted++;
      });

      multiProvider.events.addHandler(ClientProviderEvents.Stale, () => {
        staleEmitted++;
      });

      await multiProvider.initialize();

      provider1.initialize.mockResolvedValue(true);
      provider2.initialize.mockResolvedValue(true);
      provider1.emitEvent(ClientProviderEvents.Error);
      expect(errorEmitted).toBe(1);
      provider2.emitEvent(ClientProviderEvents.Error);
      // don't emit error again unless aggregate status is changing
      expect(errorEmitted).toBe(1);
      provider1.emitEvent(ClientProviderEvents.Error);
      // don't emit error again unless aggregate status is changing
      expect(errorEmitted).toBe(1);
      provider2.emitEvent(ClientProviderEvents.Stale);
      provider1.emitEvent(ClientProviderEvents.Ready);
      // error status provider is ready now but other provider is stale
      expect(readyEmitted).toBe(0);
      expect(staleEmitted).toBe(1);
      provider2.emitEvent(ClientProviderEvents.Ready);
      // now both providers are ready
      expect(readyEmitted).toBe(1);
    });
  });

  describe('metadata', () => {
    it('contains metadata for all providers', () => {
      const provider1 = new TestProvider();
      const provider2 = new TestProvider();

      const multiProvider = new WebMultiProvider([
        {
          provider: provider1,
        },
        {
          provider: provider2,
        },
      ]);
      expect(multiProvider.metadata).toEqual({
        name: 'WebMultiProvider',
        'TestProvider-1': provider1.metadata,
        'TestProvider-2': provider2.metadata,
      });
    });
  });

  describe('evaluation', () => {
    describe('hooks', () => {
      it("runs all providers' before hooks before evaluation, using same hook context", () => {
        const provider1 = new TestProvider();
        const provider2 = new TestProvider();
        let hook1Called = false;
        let hook2Called = false;
        let after1Called = false;
        let after2Called = false;
        const context = {
          test: true,
        };
        const hookContext = {
          context: context,
          flagKey: 'flag',
          flagValueType: 'boolean' as any,
          defaultValue: false,
          clientMetadata: {} as any,
          providerMetadata: {} as any,
          logger: logger,
        };

        provider1.hooks = [
          {
            before: (context) => {
              hook1Called = true;
              expect(context).toEqual(hookContext);
            },
            after: (context) => {
              expect(context).toEqual(hookContext);
              after1Called = true;
            },
          },
          {
            before: (context) => {
              expect(context).toEqual(hookContext);
              hook2Called = true;
            },
          },
        ];

        provider2.hooks = [
          {
            after: (context) => {
              expect(context).toEqual(hookContext);
              after2Called = true;
            },
          },
        ];

        const multiProvider = new WebMultiProvider(
          [
            {
              provider: provider1,
            },
            {
              provider: provider2,
            },
          ],
          new ComparisonStrategy(provider1),
        );

        multiProvider.hooks[0].before?.(hookContext);
        multiProvider.resolveBooleanEvaluation('flag', false, context);
        expect(hook1Called).toBe(true);
        expect(hook2Called).toBe(true);
        expect(provider1.resolveBooleanEvaluation).toHaveBeenCalledWith(
          'flag',
          false,
          { test: true },
          expect.any(Object),
        );
        expect(provider2.resolveBooleanEvaluation).toHaveBeenCalledWith(
          'flag',
          false,
          { test: true },
          expect.any(Object),
        );
        expect(after1Called).toBe(true);
        expect(after2Called).toBe(true);
      });

      it('runs error hook and finally hook', () => {
        const provider1 = new TestProvider();
        let error1Called = false;
        let finally1Called = false;

        const context = {
          test: true,
        };

        const hookContext = {
          context: context,
          flagKey: 'flag',
          flagValueType: 'boolean' as any,
          defaultValue: false,
          clientMetadata: {} as any,
          providerMetadata: {} as any,
          logger: logger,
        };

        provider1.hooks = [
          {
            error: async (context) => {
              expect(context).toEqual(hookContext);
              error1Called = true;
            },
            finally: async (context) => {
              expect(context).toEqual(hookContext);
              finally1Called = true;
            },
          },
        ];

        const multiProvider = new WebMultiProvider([
          {
            provider: provider1,
          },
        ]);

        provider1.resolveBooleanEvaluation.mockImplementation(() => {
          throw new Error('test error');
        });

        multiProvider.hooks[0].before?.(hookContext);
        expect(() => multiProvider.resolveBooleanEvaluation('flag', false, context)).toThrow();
        expect(error1Called).toBe(true);
        expect(finally1Called).toBe(true);
      });
    });

    describe('resolution logic and strategies', () => {
      describe('evaluation data types', () => {
        it('evaluates a string variable', () => {
          const provider1 = new TestProvider();
          provider1.resolveStringEvaluation.mockReturnValue({ value: 'value' });

          const multiProvider = new WebMultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};
          callBeforeHook(multiProvider, context, 'flag', 'string', 'default');
          expect(multiProvider.resolveStringEvaluation('flag', 'default', context)).toEqual({
            value: 'value',
            flagKey: 'flag',
            flagMetadata: {},
          });
        });

        it('evaluates a number variable', () => {
          const provider1 = new TestProvider();
          provider1.resolveNumberEvaluation.mockReturnValue({ value: 1 });

          const multiProvider = new WebMultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};

          callBeforeHook(multiProvider, context, 'flag', 'number', 0);

          expect(multiProvider.resolveNumberEvaluation('flag', 0, context)).toEqual({
            value: 1,
            flagKey: 'flag',
            flagMetadata: {},
          });
        });

        it('evaluates a boolean variable', () => {
          const provider1 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockReturnValue({ value: true });

          const multiProvider = new WebMultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};
          callBeforeHook(multiProvider, context, 'flag', 'boolean', false);
          expect(multiProvider.resolveBooleanEvaluation('flag', false, context)).toEqual({
            value: true,
            flagKey: 'flag',
            flagMetadata: {},
          });
        });

        it('evaluates an object variable', () => {
          const provider1 = new TestProvider();
          provider1.resolveObjectEvaluation.mockReturnValue({ value: { test: true } });

          const multiProvider = new WebMultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};
          callBeforeHook(multiProvider, context, 'flag', 'object', {});
          expect(multiProvider.resolveObjectEvaluation('flag', {}, context)).toEqual({
            value: { test: true },
            flagKey: 'flag',
            flagMetadata: {},
          });
        });
      });
      describe('first match strategy', () => {
        it('throws an error if any provider throws an error during evaluation', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockImplementation(() => {
            throw new Error('test error');
          });
          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
            ],
            new FirstMatchStrategy(),
          );

          expect(() => callEvaluation(multiProvider, {})).toThrow('test error');
          expect(provider2.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });

        it('throws an error if any provider returns an error result during evaluation', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockReturnValue({
            errorCode: 'test-error',
            errorMessage: 'test error',
          });
          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
            ],
            new FirstMatchStrategy(),
          );

          expect(() => callEvaluation(multiProvider, {})).toThrow('test error');
          expect(provider2.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });

        it('skips providers that return flag not found until it gets a result, skipping any provider after', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockReturnValue({
            errorCode: ErrorCode.FLAG_NOT_FOUND,
            errorMessage: 'flag not found',
          });
          provider2.resolveBooleanEvaluation.mockReturnValue({
            value: true,
          });
          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
              {
                provider: provider3,
              },
            ],
            new FirstMatchStrategy(),
          );
          const result = callEvaluation(multiProvider, {});
          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });

        it('skips providers that throw flag not found until it gets a result, skipping any provider after', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockImplementation(() => {
            throw new FlagNotFoundError('flag not found');
          });
          provider2.resolveBooleanEvaluation.mockReturnValue({
            value: true,
          });
          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
              {
                provider: provider3,
              },
            ],
            new FirstMatchStrategy(),
          );
          const result = callEvaluation(multiProvider, {});
          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });
      });

      describe('first successful strategy', () => {
        it('ignores errors from earlier providers and returns successful result from later provider', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockReturnValue({
            errorCode: 'some error',
            errorMessage: 'flag not found',
          });
          provider2.resolveBooleanEvaluation.mockReturnValue({
            value: true,
          });
          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
              {
                provider: provider3,
              },
            ],
            new FirstSuccessfulStrategy(),
          );
          const result = callEvaluation(multiProvider, {});
          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });
      });

      describe('comparison strategy', () => {
        it('calls every provider and returns a result if they all agree', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockReturnValue({ value: true });

          provider2.resolveBooleanEvaluation.mockReturnValue({ value: true });
          provider3.resolveBooleanEvaluation.mockReturnValue({ value: true });

          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
              {
                provider: provider3,
              },
            ],
            new ComparisonStrategy(provider1),
          );
          const result = callEvaluation(multiProvider, {});
          expect(provider1.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).toHaveBeenCalled();

          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
        });

        it('calls every provider and returns the fallback value if any disagree, and calls onMismatch', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockReturnValue({
            value: true,
          });
          provider2.resolveBooleanEvaluation.mockReturnValue({
            value: false,
          });
          provider3.resolveBooleanEvaluation.mockReturnValue({
            value: false,
          });

          const onMismatch = jest.fn();

          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
              {
                provider: provider3,
              },
            ],
            new ComparisonStrategy(provider1, onMismatch),
          );
          const result = callEvaluation(multiProvider, {});
          expect(provider1.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(onMismatch).toHaveBeenCalledWith([
            {
              provider: provider1,
              providerName: 'TestProvider-1',
              details: { value: true, flagKey: 'flag', flagMetadata: {} },
            },
            {
              provider: provider2,
              providerName: 'TestProvider-2',
              details: { value: false, flagKey: 'flag', flagMetadata: {} },
            },
            {
              provider: provider3,
              providerName: 'TestProvider-3',
              details: { value: false, flagKey: 'flag', flagMetadata: {} },
            },
          ]);

          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
        });

        it('returns an error if any provider returns an error', () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockImplementation(() => {
            throw new Error('test error');
          });
          provider2.resolveBooleanEvaluation.mockReturnValue({
            value: false,
          });
          provider3.resolveBooleanEvaluation.mockReturnValue({
            value: false,
          });

          const multiProvider = new WebMultiProvider(
            [
              {
                provider: provider1,
              },
              {
                provider: provider2,
              },
              {
                provider: provider3,
              },
            ],
            new ComparisonStrategy(provider1),
          );
          expect(() => callEvaluation(multiProvider, {})).toThrow('test error');
          expect(provider1.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).toHaveBeenCalled();
        });
      });
    });

    describe('tracking', () => {
      const context: EvaluationContext = { targetingKey: 'user123' };
      const trackingEventDetails: TrackingEventDetails = { value: 100, currency: 'USD' };

      it('calls track on all providers by default', () => {
        const provider1 = new TestProvider();
        const provider2 = new TestProvider();
        const provider3 = new TestProvider();

        const multiProvider = new WebMultiProvider([
          { provider: provider1 },
          { provider: provider2 },
          { provider: provider3 },
        ]);

        multiProvider.track('purchase', context, trackingEventDetails);

        expect(provider1.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(provider2.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(provider3.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
      });

      it('skips providers without track method', () => {
        const provider1 = new TestProvider();
        const provider2 = new InMemoryProvider(); // Doesn't have track method
        const provider3 = new TestProvider();

        const multiProvider = new WebMultiProvider([
          { provider: provider1 },
          { provider: provider2 },
          { provider: provider3 },
        ]);

        expect(() => multiProvider.track('purchase', context, trackingEventDetails)).not.toThrow();
        expect(provider1.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(provider3.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
      });

      it('continues tracking with other providers when one throws an error', () => {
        const provider1 = new TestProvider();
        const provider2 = new TestProvider();
        const provider3 = new TestProvider();

        provider2.track.mockImplementation(() => {
          throw new Error('Tracking failed');
        });

        const mockLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
        const multiProvider = new WebMultiProvider(
          [{ provider: provider1 }, { provider: provider2 }, { provider: provider3 }],
          undefined,
          mockLogger,
        );

        expect(() => multiProvider.track('purchase', context, trackingEventDetails)).not.toThrow();

        expect(provider1.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(provider2.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(provider3.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(mockLogger.error).toHaveBeenCalledWith(
          'Error tracking event "purchase" with provider "TestProvider-2":',
          expect.any(Error),
        );
      });

      it('respects strategy shouldTrackWithThisProvider decision', () => {
        const provider1 = new TestProvider();
        const provider2 = new TestProvider();
        const provider3 = new TestProvider();

        // Create a custom strategy that only allows the second provider to track
        class MockStrategy extends FirstMatchStrategy {
          override shouldTrackWithThisProvider = jest.fn().mockImplementation((strategyContext) => {
            return strategyContext.providerName === 'TestProvider-2';
          });
        }

        const mockStrategy = new MockStrategy();

        const multiProvider = new WebMultiProvider(
          [{ provider: provider1 }, { provider: provider2 }, { provider: provider3 }],
          mockStrategy,
        );

        multiProvider.track('purchase', context, trackingEventDetails);

        expect(mockStrategy.shouldTrackWithThisProvider).toHaveBeenCalledTimes(3);
        expect(provider1.track).not.toHaveBeenCalled();
        expect(provider2.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(provider3.track).not.toHaveBeenCalled();
      });

      it('does not track with providers in NOT_READY or FATAL status by default', () => {
        const provider1 = new TestProvider();
        const provider2 = new TestProvider();
        const provider3 = new TestProvider();

        const multiProvider = new WebMultiProvider([
          { provider: provider1 },
          { provider: provider2 },
          { provider: provider3 },
        ]);

        // Mock the status tracker to return different statuses
        const mockStatusTracker = {
          providerStatus: jest.fn().mockImplementation((name) => {
            if (name === 'TestProvider-1') return 'NOT_READY';
            if (name === 'TestProvider-2') return 'READY';
            if (name === 'TestProvider-3') return 'FATAL';
            return 'READY'; // Default fallback
          }),
        };
        (multiProvider as any).statusTracker = mockStatusTracker;

        multiProvider.track('purchase', context, trackingEventDetails);

        expect(provider1.track).not.toHaveBeenCalled();
        expect(provider2.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
        expect(provider3.track).not.toHaveBeenCalled();
      });

      it('passes correct strategy context to shouldTrackWithThisProvider', () => {
        const provider1 = new TestProvider();
        const provider2 = new TestProvider();

        class MockStrategy extends FirstMatchStrategy {
          override shouldTrackWithThisProvider = jest.fn().mockReturnValue(true);
        }

        const mockStrategy = new MockStrategy();

        const multiProvider = new WebMultiProvider([{ provider: provider1 }, { provider: provider2 }], mockStrategy);

        // Mock the status tracker to return READY status
        const mockStatusTracker = {
          providerStatus: jest.fn().mockReturnValue('READY'),
        };
        (multiProvider as any).statusTracker = mockStatusTracker;

        multiProvider.track('purchase', context, trackingEventDetails);

        expect(mockStrategy.shouldTrackWithThisProvider).toHaveBeenCalledWith(
          {
            provider: provider1,
            providerName: 'TestProvider-1',
            providerStatus: 'READY',
          },
          context,
          'purchase',
          trackingEventDetails,
        );

        expect(mockStrategy.shouldTrackWithThisProvider).toHaveBeenCalledWith(
          {
            provider: provider2,
            providerName: 'TestProvider-2',
            providerStatus: 'READY',
          },
          context,
          'purchase',
          trackingEventDetails,
        );
      });
    });
  });
});
