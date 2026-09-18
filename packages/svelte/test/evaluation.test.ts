import type {
  EvaluationContext,
  EventContext,
  InMemoryFlagConfiguration,
  InMemoryFlagVariants,
  ProviderEmittableEvents,
} from '@openfeature/web-sdk';
import {
  ErrorCode,
  OpenFeature,
  ProviderEvents,
  StandardResolutionReasons,
  TypedInMemoryProvider,
} from '@openfeature/web-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  useBooleanFlagDetails,
  useBooleanFlagValue,
  useFlag,
  useNumberFlagDetails,
  useNumberFlagValue,
  useObjectFlagDetails,
  useObjectFlagValue,
  useStringFlagDetails,
  useStringFlagValue,
} from '../src';
import { TestingProvider } from './helpers/testing-provider';
import { flush, watch } from './helpers/watch.svelte';

// custom provider to have better control over the emitted events
class CustomEventInMemoryProvider extends TypedInMemoryProvider {
  putConfigurationWithCustomEvent<
    T extends Record<string, InMemoryFlagVariants<string>> = Record<string, InMemoryFlagVariants<string>>,
  >(flagConfiguration: InMemoryFlagConfiguration<T>, event: ProviderEmittableEvents, eventContext: EventContext) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this as any)['_flagConfiguration'] = { ...flagConfiguration }; // private access hack
    this.events.emit(event, eventContext);
  }
}

const BOOL_FLAG_KEY = 'boolean-flag';
const CONTEXT_BOOL_FLAG_KEY = 'context-sensitive-flag';
const STRING_FLAG_KEY = 'string-flag';
const NUMBER_FLAG_KEY = 'number-flag';
const OBJECT_FLAG_KEY = 'object-flag';
const OBJECT_FLAG_VALUE = { factor: 'x1000' };

const FLAG_CONFIG = {
  [BOOL_FLAG_KEY]: {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant: 'on',
  },
  [STRING_FLAG_KEY]: {
    disabled: false,
    variants: { greeting: 'hi', parting: 'bye' },
    defaultVariant: 'greeting',
  },
  [NUMBER_FLAG_KEY]: {
    disabled: false,
    variants: { '2^10': 1024, '2^1': 2 },
    defaultVariant: '2^10',
  },
  [OBJECT_FLAG_KEY]: {
    disabled: false,
    variants: { template: OBJECT_FLAG_VALUE, empty: {} },
    defaultVariant: 'template',
  },
  [CONTEXT_BOOL_FLAG_KEY]: {
    disabled: false,
    defaultVariant: 'off',
    variants: { off: false, on: true },
    contextEvaluator(ctx: EvaluationContext) {
      return ctx.change ? 'on' : 'off';
    },
  },
} as const;

describe('evaluation', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  describe('evaluation functions', () => {
    it('useFlag should evaluate flags of every type', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));

      const bool = useFlag(BOOL_FLAG_KEY, false);
      expect(bool.value).toBe(true);
      expect(bool.variant).toBe('on');
      expect(bool.reason).toBe(StandardResolutionReasons.STATIC);
      expect(bool.type).toBe('boolean');
      expect(bool.isError).toBe(false);
      expect(bool.isAuthoritative).toBe(true);
      expect(bool.details.flagKey).toBe(BOOL_FLAG_KEY);

      expect(useFlag(STRING_FLAG_KEY, 'default').value).toBe('hi');
      expect(useFlag(NUMBER_FLAG_KEY, 0).value).toBe(1024);
      expect(useFlag(OBJECT_FLAG_KEY, {}).value).toEqual(OBJECT_FLAG_VALUE);
    });

    it('useFlag should report errors for missing flags', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));

      const missing = useFlag('missing-flag', 'default');
      expect(missing.value).toBe('default');
      expect(missing.isError).toBe(true);
      expect(missing.errorCode).toBe(ErrorCode.FLAG_NOT_FOUND);
      expect(missing.errorMessage).toBeDefined();
      expect(missing.isAuthoritative).toBe(false);
      expect(missing.flagMetadata).toEqual({});
    });

    it('typed value functions should evaluate flags', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));

      expect(useBooleanFlagValue(BOOL_FLAG_KEY, false).current).toBe(true);
      expect(useStringFlagValue(STRING_FLAG_KEY, 'default').current).toBe('hi');
      expect(useNumberFlagValue(NUMBER_FLAG_KEY, 0).current).toBe(1024);
      expect(useObjectFlagValue(OBJECT_FLAG_KEY, {}).current).toEqual(OBJECT_FLAG_VALUE);
    });

    it('typed details functions should evaluate flags', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));

      const bool = useBooleanFlagDetails(BOOL_FLAG_KEY, false);
      expect(bool.flagKey).toBe(BOOL_FLAG_KEY);
      expect(bool.value).toBe(true);
      expect(bool.variant).toBe('on');
      expect(bool.reason).toBe(StandardResolutionReasons.STATIC);
      expect(bool.flagMetadata).toEqual({});
      expect(bool.errorCode).toBeUndefined();
      expect(bool.errorMessage).toBeUndefined();

      expect(useStringFlagDetails(STRING_FLAG_KEY, 'default').value).toBe('hi');
      expect(useNumberFlagDetails(NUMBER_FLAG_KEY, 0).value).toBe(1024);
      expect(useObjectFlagDetails(OBJECT_FLAG_KEY, {}).value).toEqual(OBJECT_FLAG_VALUE);
    });

    it('should pass key, default, and options to the client resolver', async () => {
      const provider = new TypedInMemoryProvider(FLAG_CONFIG);
      await OpenFeature.setProviderAndWait(provider);
      const hook = { before: vi.fn() };

      useFlag(BOOL_FLAG_KEY, false, { hooks: [hook], hookHints: { hint: 'value' } });

      expect(hook.before).toHaveBeenCalledWith(
        expect.objectContaining({ flagKey: BOOL_FLAG_KEY, defaultValue: false }),
        { hint: 'value' },
      );
    });
  });

  describe('updates', () => {
    it('should update when the provider becomes ready', async () => {
      const ready = OpenFeature.setProviderAndWait(new TestingProvider(FLAG_CONFIG, 10));
      const flag = useFlag(BOOL_FLAG_KEY, false);
      const watched = watch(() => [flag.value, flag.reason]);

      expect(watched.values).toEqual([[false, StandardResolutionReasons.ERROR]]);
      await ready;
      flush();
      expect(watched.values).toEqual([
        [false, StandardResolutionReasons.ERROR],
        [true, StandardResolutionReasons.STATIC],
      ]);
      watched.stop();
    });

    it('should reflect changes that happened between construction and subscription, without extra runs', async () => {
      const ready = OpenFeature.setProviderAndWait(new TestingProvider(FLAG_CONFIG, 10));
      const flag = useFlag(BOOL_FLAG_KEY, false);
      // the provider becomes ready while nothing is listening
      await ready;

      const watched = watch(() => flag.value);
      expect(watched.values).toEqual([true]);
      watched.stop();
    });

    it('should update on context change when the evaluated value changed', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));
      const flag = useFlag(CONTEXT_BOOL_FLAG_KEY, false);
      const watched = watch(() => flag.value);

      await OpenFeature.setContext({ change: true });
      flush();
      expect(watched.values).toEqual([false, true]);
      watched.stop();
    });

    it('should not update on context change when the evaluated value did not change', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));
      const flag = useFlag(CONTEXT_BOOL_FLAG_KEY, false);
      const watched = watch(() => flag.value);

      await OpenFeature.setContext({ unrelated: true });
      flush();
      expect(watched.values).toEqual([false]);
      watched.stop();
    });

    it('should not update on context change when updateOnContextChanged is false', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));
      const flag = useFlag(CONTEXT_BOOL_FLAG_KEY, false, { updateOnContextChanged: false });
      const watched = watch(() => flag.value);

      await OpenFeature.setContext({ change: true });
      flush();
      expect(watched.values).toEqual([false]);
      watched.stop();
    });

    it('should not update on flag change when the provider change event has empty flagsChanged', async () => {
      const provider = new CustomEventInMemoryProvider(FLAG_CONFIG);
      await OpenFeature.setProviderAndWait(provider);
      const flag = useFlag(BOOL_FLAG_KEY, false);
      const watched = watch(() => flag.value);

      provider.putConfigurationWithCustomEvent(
        { ...FLAG_CONFIG, [BOOL_FLAG_KEY]: { ...FLAG_CONFIG[BOOL_FLAG_KEY], defaultVariant: 'off' } },
        ProviderEvents.ConfigurationChanged,
        { flagsChanged: [] },
      );
      flush();
      expect(watched.values).toEqual([true]);
      watched.stop();
    });

    it('should update on flag change when the provider change event has falsy flagsChanged', async () => {
      const provider = new CustomEventInMemoryProvider(FLAG_CONFIG);
      await OpenFeature.setProviderAndWait(provider);
      const flag = useFlag(BOOL_FLAG_KEY, false);
      const watched = watch(() => flag.value);

      provider.putConfigurationWithCustomEvent(
        { ...FLAG_CONFIG, [BOOL_FLAG_KEY]: { ...FLAG_CONFIG[BOOL_FLAG_KEY], defaultVariant: 'off' } },
        ProviderEvents.ConfigurationChanged,
        { flagsChanged: undefined },
      );
      flush();
      expect(watched.values).toEqual([true, false]);
      watched.stop();
    });

    it('should not update on flag change when the evaluated value did not change', async () => {
      const provider = new CustomEventInMemoryProvider(FLAG_CONFIG);
      await OpenFeature.setProviderAndWait(provider);
      const resolverSpy = vi.spyOn(provider, 'resolveBooleanEvaluation');
      const flag = useFlag(BOOL_FLAG_KEY, false);
      const watched = watch(() => flag.value);
      resolverSpy.mockClear();

      provider.putConfiguration({
        ...FLAG_CONFIG,
        'new-flag': { disabled: false, defaultVariant: 'off', variants: { off: false, on: true } },
      });
      flush();
      // the in-memory provider reports every key in flagsChanged, so the flag is re-evaluated...
      expect(resolverSpy).toHaveBeenCalledTimes(1);
      // ...but effects do not re-run because the evaluation details did not change
      expect(watched.values).toEqual([true]);
      watched.stop();
    });

    it('should update on flag change when the evaluated value changed', async () => {
      const provider = new CustomEventInMemoryProvider(FLAG_CONFIG);
      await OpenFeature.setProviderAndWait(provider);
      const flag = useFlag(BOOL_FLAG_KEY, false);
      const watched = watch(() => flag.value);

      provider.putConfiguration({
        ...FLAG_CONFIG,
        [BOOL_FLAG_KEY]: { ...FLAG_CONFIG[BOOL_FLAG_KEY], defaultVariant: 'off' },
      });
      flush();
      provider.putConfiguration({
        ...FLAG_CONFIG,
        [BOOL_FLAG_KEY]: { ...FLAG_CONFIG[BOOL_FLAG_KEY], defaultVariant: 'on' },
      });
      flush();
      expect(watched.values).toEqual([true, false, true]);
      watched.stop();
    });

    it('should not update on flag change when updateOnConfigurationChanged is false', async () => {
      const provider = new CustomEventInMemoryProvider(FLAG_CONFIG);
      await OpenFeature.setProviderAndWait(provider);
      const flag = useFlag(BOOL_FLAG_KEY, false, { updateOnConfigurationChanged: false });
      const watched = watch(() => flag.value);

      provider.putConfiguration({
        ...FLAG_CONFIG,
        [BOOL_FLAG_KEY]: { ...FLAG_CONFIG[BOOL_FLAG_KEY], defaultVariant: 'off' },
      });
      flush();
      expect(watched.values).toEqual([true]);
      watched.stop();
    });

    it('should re-evaluate on read when nothing is listening', async () => {
      const provider = new CustomEventInMemoryProvider(FLAG_CONFIG);
      await OpenFeature.setProviderAndWait(provider);
      const flag = useFlag(BOOL_FLAG_KEY, false);
      expect(flag.value).toBe(true);

      // change the configuration without emitting any event
      provider.putConfigurationWithCustomEvent(
        { ...FLAG_CONFIG, [BOOL_FLAG_KEY]: { ...FLAG_CONFIG[BOOL_FLAG_KEY], defaultVariant: 'off' } },
        ProviderEvents.Stale,
        {},
      );
      expect(flag.value).toBe(false);
    });

    it('should stop listening once the last effect is destroyed', async () => {
      await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));
      const client = OpenFeature.getClient();
      const initialHandlers = client.getHandlers(ProviderEvents.ContextChanged).length;
      const flag = useFlag(CONTEXT_BOOL_FLAG_KEY, false);
      const watched = watch(() => flag.value);
      expect(client.getHandlers(ProviderEvents.ContextChanged).length).toBe(initialHandlers + 1);

      watched.stop();
      await OpenFeature.setContext({ change: true });
      flush();
      expect(watched.values).toEqual([false]);
      expect(client.getHandlers(ProviderEvents.ContextChanged).length).toBe(initialHandlers);
      // still readable, and fresh, outside effects
      expect(flag.value).toBe(true);
    });
  });
});
