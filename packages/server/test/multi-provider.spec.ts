import { MultiProvider } from './multi-provider';
import type {
  EvaluationContext,
  FlagValue,
  FlagValueType,
  Hook,
  Logger,
  Provider,
  ProviderMetadata,
  TrackingEventDetails,
} from '@openfeature/server-sdk';
import {
  DefaultLogger,
  ErrorCode,
  FlagNotFoundError,
  InMemoryProvider,
  OpenFeatureEventEmitter,
  ServerProviderEvents,
} from '@openfeature/server-sdk';
import { FirstMatchStrategy } from './strategies/FirstMatchStrategy';
import { FirstSuccessfulStrategy } from './strategies/FirstSuccessfulStrategy';
import { ComparisonStrategy } from './strategies/ComparisonStrategy';

class TestProvider implements Provider {
  public metadata: ProviderMetadata = {
    name: 'TestProvider',
  };
  public events = new OpenFeatureEventEmitter();
  public hooks: Hook[] = [];
  public track = jest.fn();

  constructor(
    public resolveBooleanEvaluation = jest.fn().mockResolvedValue({ value: false }),
    public resolveStringEvaluation = jest.fn().mockResolvedValue({ value: 'default' }),
    public resolveObjectEvaluation = jest.fn().mockResolvedValue({ value: {} }),
    public resolveNumberEvaluation = jest.fn().mockResolvedValue({ value: 0 }),
    public initialize = jest.fn(),
  ) {}

  emitEvent(type: ServerProviderEvents) {
    this.events.emit(type, { providerName: this.metadata.name });
  }
}

const callEvaluation = async (multi: MultiProvider, context: EvaluationContext, logger: Logger) => {
  await callBeforeHook(multi, context, 'flag', 'boolean', false);
  return multi.resolveBooleanEvaluation('flag', false, context);
};

const callBeforeHook = async (
  multi: MultiProvider,
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
  await multi.hooks[0].before?.(hookContext);
};

describe('MultiProvider', () => {
  const logger = new DefaultLogger();

  describe('unique names', () => {
    it('uses provider names for unique types', () => {
      const multiProvider = new MultiProvider([
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
      const multiProvider = new MultiProvider([
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
      const multiProvider = new MultiProvider([
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
          new MultiProvider([
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
      const multiProvider = new MultiProvider([
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
      const multiProvider = new MultiProvider([
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
      provider2.initialize.mockImplementation(() => initializations++);
      await expect(() => multiProvider.initialize()).rejects.toThrow('Failure!');
    });

    it('emits events when aggregate status changes', async () => {
      const provider1 = new TestProvider();
      const provider2 = new TestProvider();
      const multiProvider = new MultiProvider([
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
      multiProvider.events.addHandler(ServerProviderEvents.Ready, () => {
        readyEmitted++;
      });

      multiProvider.events.addHandler(ServerProviderEvents.Error, () => {
        errorEmitted++;
      });

      multiProvider.events.addHandler(ServerProviderEvents.Stale, () => {
        staleEmitted++;
      });

      await multiProvider.initialize();

      provider1.initialize.mockResolvedValue(true);
      provider2.initialize.mockResolvedValue(true);
      provider1.emitEvent(ServerProviderEvents.Error);
      expect(errorEmitted).toBe(1);
      provider2.emitEvent(ServerProviderEvents.Error);
      // don't emit error again unless aggregate status is changing
      expect(errorEmitted).toBe(1);
      provider1.emitEvent(ServerProviderEvents.Error);
      // don't emit error again unless aggregate status is changing
      expect(errorEmitted).toBe(1);
      provider2.emitEvent(ServerProviderEvents.Stale);
      provider1.emitEvent(ServerProviderEvents.Ready);
      // error status provider is ready now but other provider is stale
      expect(readyEmitted).toBe(0);
      expect(staleEmitted).toBe(1);
      provider2.emitEvent(ServerProviderEvents.Ready);
      // now both providers are ready
      expect(readyEmitted).toBe(1);
    });
  });

  describe('metadata', () => {
    it('contains metadata for all providers', () => {
      const provider1 = new TestProvider();
      const provider2 = new TestProvider();

      const multiProvider = new MultiProvider([
        {
          provider: provider1,
        },
        {
          provider: provider2,
        },
      ]);
      expect(multiProvider.metadata).toEqual({
        name: 'MultiProvider',
        'TestProvider-1': provider1.metadata,
        'TestProvider-2': provider2.metadata,
      });
    });
  });

  describe('evaluation', () => {
    describe('hooks', () => {
      it('runs before hooks to modify context for a specific provider and evaluates using that modified context', async () => {
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

        const weakMap = new WeakMap();

        provider1.hooks = [
          {
            before: async (context) => {
              hook1Called = true;
              expect(context).toEqual(hookContext);
              weakMap.set(context, 'test');
              return { ...context.context, hook1: true };
            },
            after: async (context) => {
              expect(context.context).toEqual({
                test: true,
                hook1: true,
                hook2: true,
              });
              expect(weakMap.get(context)).toEqual('test');
              after1Called = true;
            },
          },
          {
            before: async (context) => {
              hook2Called = true;
              expect(weakMap.get(context)).toEqual('test');
              expect(context.context).toEqual({
                test: true,
                hook1: true,
              });
              return { ...context.context, hook2: true };
            },
          },
        ];

        provider2.hooks = [
          {
            after: async (context) => {
              expect(weakMap.get(context)).toBeFalsy();
              expect(context.context).toEqual({
                test: true,
              });
              after2Called = true;
            },
          },
        ];

        const multiProvider = new MultiProvider(
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

        await multiProvider.hooks[0].before!(hookContext);
        await multiProvider.resolveBooleanEvaluation('flag', false, context);
        expect(hook1Called).toBe(true);
        expect(hook2Called).toBe(true);
        expect(provider1.resolveBooleanEvaluation).toHaveBeenCalledWith(
          'flag',
          false,
          {
            test: true,
            hook1: true,
            hook2: true,
          },
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

      it('runs error hook and finally hook with modified context using same object reference', async () => {
        const provider1 = new TestProvider();
        let hook1Called = false;
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

        const weakMap = new WeakMap();

        provider1.hooks = [
          {
            before: async (context) => {
              hook1Called = true;
              weakMap.set(context, 'exists');
              expect(context).toEqual(hookContext);
              return { ...context.context, hook1: true };
            },
            error: async (context) => {
              expect(context.context).toEqual({
                test: true,
                hook1: true,
              });
              expect(weakMap.get(context)).toEqual('exists');
              error1Called = true;
              throw new Error('error hook error');
            },
            finally: async (context) => {
              expect(context.context).toEqual({
                test: true,
                hook1: true,
              });
              expect(weakMap.get(context)).toEqual('exists');
              finally1Called = true;
            },
          },
        ];

        const multiProvider = new MultiProvider([
          {
            provider: provider1,
          },
        ]);

        provider1.resolveBooleanEvaluation.mockRejectedValue(new Error('test error'));

        // call the multiprovider before hook to set up the hookcontext
        await multiProvider.hooks[0].before!(hookContext);
        await expect(() => multiProvider.resolveBooleanEvaluation('flag', false, context)).rejects.toThrow();
        expect(hook1Called).toBe(true);
        expect(provider1.resolveBooleanEvaluation).toHaveBeenCalledWith(
          'flag',
          false,
          {
            test: true,
            hook1: true,
          },
          expect.any(Object),
        );
        expect(error1Called).toBe(true);
        expect(finally1Called).toBe(true);
      });
    });

    describe('resolution logic and strategies', () => {
      describe('evaluation data types', () => {
        it('evaluates a string variable', async () => {
          const provider1 = new TestProvider();
          provider1.resolveStringEvaluation.mockResolvedValue({ value: 'value' });

          const multiProvider = new MultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};
          await callBeforeHook(multiProvider, context, 'flag', 'string', 'default');
          expect(await multiProvider.resolveStringEvaluation('flag', 'default', context)).toEqual({
            value: 'value',
            flagKey: 'flag',
            flagMetadata: {},
          });
        });

        it('evaluates a number variable', async () => {
          const provider1 = new TestProvider();
          provider1.resolveNumberEvaluation.mockResolvedValue({ value: 1 });

          const multiProvider = new MultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};

          await callBeforeHook(multiProvider, context, 'flag', 'number', 0);

          expect(await multiProvider.resolveNumberEvaluation('flag', 0, context)).toEqual({
            value: 1,
            flagKey: 'flag',
            flagMetadata: {},
          });
        });

        it('evaluates a boolean variable', async () => {
          const provider1 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockResolvedValue({ value: true });

          const multiProvider = new MultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};
          await callBeforeHook(multiProvider, context, 'flag', 'boolean', false);
          expect(await multiProvider.resolveBooleanEvaluation('flag', false, context)).toEqual({
            value: true,
            flagKey: 'flag',
            flagMetadata: {},
          });
        });

        it('evaluates an object variable', async () => {
          const provider1 = new TestProvider();
          provider1.resolveObjectEvaluation.mockResolvedValue({ value: { test: true } });

          const multiProvider = new MultiProvider([
            {
              provider: provider1,
            },
          ]);
          const context = {};
          await callBeforeHook(multiProvider, context, 'flag', 'object', {});
          expect(await multiProvider.resolveObjectEvaluation('flag', {}, context)).toEqual({
            flagKey: 'flag',
            flagMetadata: {},
            value: { test: true },
          });
        });
      });
      describe('first match strategy', () => {
        it('throws an error if any provider throws an error during evaluation', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockRejectedValue(new Error('test error'));
          const multiProvider = new MultiProvider(
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

          await expect(() => callEvaluation(multiProvider, {}, logger)).rejects.toThrow('test error');
          expect(provider2.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });

        it('throws an error if any provider returns an error result during evaluation', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockResolvedValue({
            errorCode: 'test-error',
            errorMessage: 'test error',
          });
          const multiProvider = new MultiProvider(
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

          await expect(() => callEvaluation(multiProvider, {}, logger)).rejects.toThrow('test error');
          expect(provider2.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });

        it('skips providers that return flag not found until it gets a result, skipping any provider after', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockResolvedValue({
            errorCode: ErrorCode.FLAG_NOT_FOUND,
            errorMessage: 'flag not found',
          });
          provider2.resolveBooleanEvaluation.mockResolvedValue({
            value: true,
          });
          const multiProvider = new MultiProvider(
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
          const result = await callEvaluation(multiProvider, {}, logger);
          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });

        it('skips providers that throw flag not found until it gets a result, skipping any provider after', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockRejectedValue(new FlagNotFoundError('flag not found'));
          provider2.resolveBooleanEvaluation.mockResolvedValue({
            value: true,
          });
          const multiProvider = new MultiProvider(
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
          const result = await callEvaluation(multiProvider, {}, logger);
          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });
      });

      describe('first successful strategy', () => {
        it('ignores errors from earlier providers and returns successful result from later provider', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockResolvedValue({
            errorCode: 'some error',
            errorMessage: 'flag not found',
          });
          provider2.resolveBooleanEvaluation.mockResolvedValue({
            value: true,
          });
          const multiProvider = new MultiProvider(
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
          const result = await callEvaluation(multiProvider, {}, logger);
          expect(result).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).not.toHaveBeenCalled();
        });
      });

      describe('comparison strategy', () => {
        it('calls every provider in parallel and returns a result if they all agree', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockReturnValue(
            new Promise((resolve) => {
              setTimeout(() => resolve({ value: true }), 2);
            }),
          );

          provider2.resolveBooleanEvaluation.mockResolvedValue({
            value: true,
          });
          provider3.resolveBooleanEvaluation.mockResolvedValue({
            value: true,
          });

          const multiProvider = new MultiProvider(
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
          const resultPromise = callEvaluation(multiProvider, {}, logger);
          await new Promise((resolve) => process.nextTick(resolve));
          expect(provider1.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).toHaveBeenCalled();

          expect(await resultPromise).toEqual({ value: true, flagKey: 'flag', flagMetadata: {} });
        });

        it('calls every provider and returns the fallback value if any disagree, and calls onMismatch', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockResolvedValue({
            value: true,
          });
          provider2.resolveBooleanEvaluation.mockResolvedValue({
            value: false,
          });
          provider3.resolveBooleanEvaluation.mockResolvedValue({
            value: false,
          });

          const onMismatch = jest.fn();

          const multiProvider = new MultiProvider(
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
          const result = await callEvaluation(multiProvider, {}, logger);
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

        it('returns an error if any provider returns an error', async () => {
          const provider1 = new TestProvider();
          const provider2 = new TestProvider();
          const provider3 = new TestProvider();
          provider1.resolveBooleanEvaluation.mockRejectedValue(new Error('test error'));
          provider2.resolveBooleanEvaluation.mockResolvedValue({
            value: false,
          });
          provider3.resolveBooleanEvaluation.mockResolvedValue({
            value: false,
          });

          const multiProvider = new MultiProvider(
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
          await expect(callEvaluation(multiProvider, {}, logger)).rejects.toThrow('test error');
          expect(provider1.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider2.resolveBooleanEvaluation).toHaveBeenCalled();
          expect(provider3.resolveBooleanEvaluation).toHaveBeenCalled();
        });
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

      const multiProvider = new MultiProvider([
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

      const multiProvider = new MultiProvider([
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
      const multiProvider = new MultiProvider(
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

      const mockStrategy = new FirstMatchStrategy();
      mockStrategy.shouldTrackWithThisProvider = jest
        .fn()
        .mockReturnValueOnce(true) // provider1: should track
        .mockReturnValueOnce(false) // provider2: should not track
        .mockReturnValueOnce(true); // provider3: should track

      const multiProvider = new MultiProvider(
        [{ provider: provider1 }, { provider: provider2 }, { provider: provider3 }],
        mockStrategy,
      );

      multiProvider.track('purchase', context, trackingEventDetails);

      expect(provider1.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
      expect(provider2.track).not.toHaveBeenCalled();
      expect(provider3.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);

      expect(mockStrategy.shouldTrackWithThisProvider).toHaveBeenCalledTimes(3);
      expect(mockStrategy.shouldTrackWithThisProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: provider1,
          providerName: 'TestProvider-1',
        }),
        context,
        'purchase',
        trackingEventDetails,
      );
    });

    it('does not track with providers in NOT_READY or FATAL status by default', () => {
      const provider1 = new TestProvider();
      const provider2 = new TestProvider();
      const provider3 = new TestProvider();

      const multiProvider = new MultiProvider([
        { provider: provider1 },
        { provider: provider2 },
        { provider: provider3 },
      ]);

      // Simulate providers with different statuses
      const mockStatusTracker = {
        providerStatus: jest
          .fn()
          .mockReturnValueOnce('READY') // provider1: ready
          .mockReturnValueOnce('NOT_READY') // provider2: not ready
          .mockReturnValueOnce('FATAL'), // provider3: fatal
      };
      (multiProvider as any).statusTracker = mockStatusTracker;

      multiProvider.track('purchase', context, trackingEventDetails);

      expect(provider1.track).toHaveBeenCalledWith('purchase', context, trackingEventDetails);
      expect(provider2.track).not.toHaveBeenCalled();
      expect(provider3.track).not.toHaveBeenCalled();
    });

    it('passes correct strategy context to shouldTrackWithThisProvider', () => {
      const provider1 = new TestProvider();

      const mockStrategy = new FirstMatchStrategy();
      mockStrategy.shouldTrackWithThisProvider = jest.fn().mockReturnValue(true);

      const multiProvider = new MultiProvider([{ provider: provider1, name: 'custom-name' }], mockStrategy);

      // Mock the status tracker to return a proper status
      const mockStatusTracker = {
        providerStatus: jest.fn().mockReturnValue('READY'),
      };
      (multiProvider as any).statusTracker = mockStatusTracker;

      multiProvider.track('purchase', context, trackingEventDetails);

      expect(mockStrategy.shouldTrackWithThisProvider).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: provider1,
          providerName: 'custom-name',
          providerStatus: 'READY',
        }),
        context,
        'purchase',
        trackingEventDetails,
      );
    });
  });
});
