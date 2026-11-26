import type { EvaluationContext, Hook } from '@openfeature/web-sdk';
import {
  ErrorCode,
  OpenFeature,
  ProviderEvents,
  ProviderFatalError,
  StandardResolutionReasons,
  TypedInMemoryProvider,
} from '@openfeature/web-sdk';
import { flushPromises } from '@vue/test-utils';
import { computed, isReactive, isRef, nextTick, ref } from 'vue';
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
import { DelayedProvider, mountComposableInProvider } from './utils';

type TestAwaitable = { readonly value: unknown } & PromiseLike<unknown>;

const FLAG_CONFIG = {
  boolean: {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant: 'on',
  },
  string: {
    disabled: false,
    variants: { greeting: 'hello', parting: 'goodbye' },
    defaultVariant: 'greeting',
  },
  number: {
    disabled: false,
    variants: { large: 1024, small: 2 },
    defaultVariant: 'large',
  },
  object: {
    disabled: false,
    variants: { configured: { enabled: true }, empty: {} },
    defaultVariant: 'configured',
  },
  'context-sensitive': {
    disabled: false,
    variants: { off: false, on: true },
    defaultVariant: 'off',
    contextEvaluator: (context: EvaluationContext) => (context.user === 'bob' ? 'on' : 'off'),
  },
} as const;

class FailingProvider extends TypedInMemoryProvider {
  async initialize(): Promise<void> {
    throw new Error('provider failed');
  }
}

class EventProvider extends TypedInMemoryProvider {
  emitConfigurationChanged(flagsChanged?: string[]) {
    this.events?.emit(ProviderEvents.ConfigurationChanged, {
      providerName: this.metadata.name,
      flagsChanged,
    });
  }
}

class ReconcilingProvider extends TypedInMemoryProvider {
  private finishReconciliation: () => void = () => undefined;

  onContextChange(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.finishReconciliation = resolve;
    });
  }

  reconcile() {
    this.finishReconciliation();
  }
}

describe('evaluation composables', () => {
  beforeEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
    OpenFeature.clearHooks();
  });

  it.each([
    ['boolean', useBooleanFlagValue, false, true],
    ['string', useStringFlagValue, 'default', 'hello'],
    ['number', useNumberFlagValue, 0, 1024],
    ['object', useObjectFlagValue, {}, { enabled: true }],
  ] as const)('evaluates %s values as refs', async (flagKey, composable, defaultValue, expected) => {
    const domain = `evaluation-${flagKey}`;
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const evaluate = composable as (flagKey: string, defaultValue: never) => TestAwaitable;
    const { result, wrapper } = mountComposableInProvider(() => evaluate(flagKey, defaultValue as never), { domain });

    expect(isRef(result)).toBe(true);
    expect(result.value).toEqual(expected);
    expect(await result).toEqual(expected);
    wrapper.unmount();
  });

  it.each([
    ['boolean', useBooleanFlagDetails, false, true],
    ['string', useStringFlagDetails, 'default', 'hello'],
    ['number', useNumberFlagDetails, 0, 1024],
    ['object', useObjectFlagDetails, {}, { enabled: true }],
  ] as const)('evaluates %s details as awaitable refs', async (flagKey, composable, defaultValue, expected) => {
    const domain = `details-${flagKey}`;
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const evaluate = composable as (flagKey: string, defaultValue: never) => TestAwaitable;
    const { result, wrapper } = mountComposableInProvider(() => evaluate(flagKey, defaultValue as never), { domain });

    expect(result.value).toMatchObject({
      flagKey,
      value: expected,
      reason: StandardResolutionReasons.STATIC,
    });
    expect(await result).toMatchObject({ flagKey, value: expected });
    wrapper.unmount();
  });

  it('uses the number resolver for generic number flags', async () => {
    const domain = 'evaluation-query-number';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useFlag('number', 0), { domain });

    expect(result.value).toBe(1024);
    expect(result.type).toBe('number');
    wrapper.unmount();
  });

  it('uses the object resolver for generic object flags', async () => {
    const domain = 'evaluation-query-object';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useFlag('object', {}), { domain });

    expect(result.value).toEqual({ enabled: true });
    expect(result.type).toBe('object');
    wrapper.unmount();
  });

  it('returns a reactive query object from useFlag', async () => {
    const domain = 'evaluation-query';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useFlag('string', 'default'), { domain });

    expect(isReactive(result)).toBe(true);
    expect(result.value).toBe('hello');
    expect(result.details.flagKey).toBe('string');
    expect(result.variant).toBe('greeting');
    expect(result.type).toBe('string');
    expect(result.isError).toBe(false);
    expect(result.isAuthoritative).toBe(true);
    expect(await result).toMatchObject({ value: 'hello', variant: 'greeting' });
    wrapper.unmount();
  });

  it('exposes then without making it enumerable', async () => {
    const domain = 'evaluation-then';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });

    expect(typeof result.then).toBe('function');
    expect(Object.keys(result)).not.toContain('then');
    expect(Object.prototype.propertyIsEnumerable.call(result, 'then')).toBe(false);
    wrapper.unmount();
  });

  it('returns the default immediately and waits for readiness when awaited', async () => {
    const domain = 'evaluation-delayed';
    const delay = 10;
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, delay));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });

    expect(result.value).toBe(false);
    const value = await result;
    expect(value).toBe(true);
    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('updates the ref after readiness even when it is not awaited', async () => {
    const domain = 'evaluation-unawaited';
    const delay = 10;
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, delay));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });

    await new Promise((resolve) => setTimeout(resolve, delay * 2));
    await flushPromises();

    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('resolves provider failures with default details instead of rejecting', async () => {
    const domain = 'evaluation-provider-error';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    OpenFeature.setProvider(domain, new FailingProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagDetails('boolean', false), { domain });

    await expect(result).resolves.toMatchObject({
      flagKey: 'boolean',
      value: false,
      reason: StandardResolutionReasons.ERROR,
      errorCode: ErrorCode.GENERAL,
      errorMessage: 'provider failed',
    });
    expect(result.value.value).toBe(false);
    wrapper.unmount();
    consoleError.mockRestore();
  });

  it('runs evaluation hooks for provider error details', async () => {
    const domain = 'evaluation-error-hooks';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    OpenFeature.setProvider(domain, new FailingProvider(FLAG_CONFIG));
    const before = jest.fn();
    const after = jest.fn();
    const error = jest.fn();
    const finallyHook = jest.fn();
    const { result, wrapper } = mountComposableInProvider(
      () => useBooleanFlagDetails('boolean', false, { hooks: [{ before, after, error, finally: finallyHook }] }),
      { domain },
    );

    await expect(result).resolves.toMatchObject({ value: false, errorMessage: 'provider failed' });
    expect(before).toHaveBeenCalledTimes(2);
    expect(after).not.toHaveBeenCalled();
    expect(error).toHaveBeenLastCalledWith(
      expect.any(Object),
      expect.objectContaining({ message: 'provider failed' }),
      {},
    );
    expect(finallyHook).toHaveBeenCalledTimes(2);
    wrapper.unmount();
    consoleError.mockRestore();
  });

  it('runs finally hooks in reverse order for provider error details', async () => {
    const domain = 'evaluation-error-finally-order';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const finallyOrder: string[] = [];
    OpenFeature.setProvider(domain, new FailingProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(
      () =>
        useBooleanFlagDetails('boolean', false, {
          hooks: [{ finally: () => finallyOrder.push('first') }, { finally: () => finallyOrder.push('second') }],
        }),
      { domain },
    );

    await expect(result).resolves.toMatchObject({ value: false, errorMessage: 'provider failed' });
    expect(finallyOrder.slice(-2)).toEqual(['second', 'first']);
    wrapper.unmount();
    consoleError.mockRestore();
  });

  it('resolves fatal provider errors with fatal details', async () => {
    class FatalProvider extends TypedInMemoryProvider {
      async initialize(): Promise<void> {
        throw new ProviderFatalError('fatal provider error');
      }
    }
    const domain = 'evaluation-fatal-error';
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    OpenFeature.setProvider(domain, new FatalProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagDetails('boolean', false), { domain });

    await expect(result).resolves.toMatchObject({
      value: false,
      errorCode: ErrorCode.PROVIDER_FATAL,
      errorMessage: 'fatal provider error',
    });
    wrapper.unmount();
    consoleError.mockRestore();
  });

  it('resolves with the default when the no-op provider is configured', async () => {
    const domain = 'evaluation-noop';
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });

    expect(await result).toBe(false);
    wrapper.unmount();
  });

  it('re-evaluates reactive flag keys', async () => {
    const domain = 'evaluation-reactive-key';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const flagKey = ref('boolean');
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue(() => flagKey.value, false), {
      domain,
    });

    expect(result.value).toBe(true);
    flagKey.value = 'missing';
    await nextTick();

    expect(result.value).toBe(false);
    expect(await result).toBe(false);
    wrapper.unmount();
  });

  it('re-evaluates reactive default values', async () => {
    const domain = 'evaluation-reactive-default';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider({}));
    const defaultValue = ref(false);
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('missing', defaultValue), {
      domain,
    });

    expect(result.value).toBe(false);
    defaultValue.value = true;
    await nextTick();

    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('awaits the current client after the provider domain changes', async () => {
    const firstDomain = 'evaluation-switch-first';
    const secondDomain = 'evaluation-switch-second';
    const firstProvider = new DelayedProvider(
      {
        boolean: {
          disabled: false,
          variants: { off: false },
          defaultVariant: 'off',
        },
      },
      1000,
    );
    OpenFeature.setProvider(firstDomain, firstProvider);
    await OpenFeature.setProviderAndWait(
      secondDomain,
      new TypedInMemoryProvider({
        boolean: {
          disabled: false,
          variants: { on: true },
          defaultVariant: 'on',
        },
      }),
    );
    const domain = ref(firstDomain);
    const providerProps = computed(() => ({ domain: domain.value }));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), providerProps);

    expect(result.value).toBe(false);
    domain.value = secondDomain;
    await nextTick();

    expect(result.value).toBe(true);
    expect(await result).toBe(true);
    wrapper.unmount();
  });

  it('ignores old provider errors after the domain changes', async () => {
    const firstDomain = 'evaluation-switch-error-first';
    const secondDomain = 'evaluation-switch-error-second';
    const firstProvider = new DelayedProvider(FLAG_CONFIG, 1000);
    OpenFeature.setProvider(firstDomain, firstProvider);
    await OpenFeature.setProviderAndWait(secondDomain, new TypedInMemoryProvider(FLAG_CONFIG));
    const domain = ref(firstDomain);
    const providerProps = computed(() => ({ domain: domain.value }));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), providerProps);

    domain.value = secondDomain;
    await nextTick();
    firstProvider.events?.emit(ProviderEvents.Error, {
      providerName: firstProvider.metadata.name,
      message: 'old provider error',
    });
    await nextTick();

    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('re-evaluates after context changes', async () => {
    const domain = 'evaluation-context-change';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('context-sensitive', false), {
      domain,
    });

    expect(result.value).toBe(false);
    await OpenFeature.setContext(domain, { user: 'bob' });
    await flushPromises();

    expect(result.value).toBe(true);
    expect(await result).toBe(true);
    wrapper.unmount();
  });

  it('waits for reconciliation when an existing evaluation is awaited', async () => {
    const domain = 'evaluation-later-reconciling';
    const provider = new ReconcilingProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('context-sensitive', false), {
      domain,
    });
    const contextChange = OpenFeature.setContext(domain, { user: 'bob' });
    await nextTick();
    let settled = false;
    const pending = Promise.resolve(result).then((value) => {
      settled = true;
      return value;
    });

    try {
      await flushPromises();
      expect(settled).toBe(false);
      provider.reconcile();
      await contextChange;
      await expect(pending).resolves.toBe(true);
      expect(result.value).toBe(true);
    } finally {
      provider.reconcile();
      await contextChange;
      wrapper.unmount();
    }
  });

  it('re-evaluates after configuration changes', async () => {
    const domain = 'evaluation-configuration-change';
    const provider = new TypedInMemoryProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });

    await provider.putConfiguration({
      boolean: {
        disabled: false,
        variants: { off: false },
        defaultVariant: 'off',
      },
    });
    await flushPromises();

    expect(result.value).toBe(false);
    expect(await result).toBe(false);
    wrapper.unmount();
  });

  it('can disable context updates per evaluation', async () => {
    const domain = 'evaluation-context-updates-off';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(
      () => useBooleanFlagValue('context-sensitive', false, { updateOnContextChanged: false }),
      { domain },
    );

    await OpenFeature.setContext(domain, { user: 'bob' });
    await flushPromises();

    expect(result.value).toBe(false);
    wrapper.unmount();
  });

  it('can disable configuration updates per evaluation', async () => {
    const domain = 'evaluation-configuration-updates-off';
    const provider = new TypedInMemoryProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);
    const { result, wrapper } = mountComposableInProvider(
      () => useBooleanFlagValue('boolean', false, { updateOnConfigurationChanged: false }),
      { domain },
    );

    await provider.putConfiguration({
      boolean: {
        disabled: false,
        variants: { off: false },
        defaultVariant: 'off',
      },
    });
    await flushPromises();

    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('preserves provider update options when evaluation options do not override them', async () => {
    const domain = 'evaluation-provider-options';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(
      () => useBooleanFlagValue('context-sensitive', false, { hooks: [] }),
      { domain, updateOnContextChanged: false },
    );

    await OpenFeature.setContext(domain, { user: 'bob' });
    await flushPromises();

    expect(result.value).toBe(false);
    wrapper.unmount();
  });

  it('allows evaluation options to override provider update options', async () => {
    const domain = 'evaluation-option-override';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const { result, wrapper } = mountComposableInProvider(
      () => useBooleanFlagValue('context-sensitive', false, { updateOnContextChanged: true }),
      { domain, updateOnContextChanged: false },
    );

    await OpenFeature.setContext(domain, { user: 'bob' });
    await flushPromises();

    expect(result.value).toBe(true);
    wrapper.unmount();
  });

  it('only re-evaluates configuration changes for the current flag', async () => {
    const domain = 'evaluation-flags-changed';
    const provider = new EventProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);
    const resolve = jest.spyOn(provider, 'resolveBooleanEvaluation');
    const { wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });
    const initialCalls = resolve.mock.calls.length;

    provider.emitConfigurationChanged(['another-flag']);
    expect(resolve.mock.calls.length).toBe(initialCalls);

    provider.emitConfigurationChanged(['boolean']);
    expect(resolve.mock.calls.length).toBe(initialCalls + 1);

    provider.emitConfigurationChanged();
    expect(resolve.mock.calls.length).toBe(initialCalls + 2);
    wrapper.unmount();
  });

  it('updates details when the provider enters an error state', async () => {
    const domain = 'evaluation-later-error';
    const provider = new TypedInMemoryProvider(FLAG_CONFIG);
    await OpenFeature.setProviderAndWait(domain, provider);
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagDetails('boolean', false), { domain });

    provider.events?.emit(ProviderEvents.Error, { providerName: provider.metadata.name, message: 'later error' });
    await nextTick();

    expect(result.value).toMatchObject({
      value: false,
      reason: StandardResolutionReasons.ERROR,
      errorCode: ErrorCode.GENERAL,
      errorMessage: 'later error',
    });

    provider.events?.emit(ProviderEvents.Ready, { providerName: provider.metadata.name });
    await nextTick();
    expect(result.value.value).toBe(true);
    wrapper.unmount();
  });

  it('reports error query fields for missing flags', async () => {
    const domain = 'evaluation-query-error';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider({}));
    const { result, wrapper } = mountComposableInProvider(() => useFlag('missing', false), { domain });

    expect(result.isError).toBe(true);
    expect(result.errorCode).toBe(ErrorCode.FLAG_NOT_FOUND);
    expect(result.isAuthoritative).toBe(false);
    wrapper.unmount();
  });

  it('settles a pending await with the fallback when disposed', async () => {
    const domain = 'evaluation-dispose-pending';
    OpenFeature.setProvider(domain, new DelayedProvider(FLAG_CONFIG, 1000));
    const { result, wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });
    const pending = result;

    wrapper.unmount();

    await expect(pending).resolves.toBe(false);
  });

  it('passes Vue framework metadata to evaluation hooks', async () => {
    const domain = 'evaluation-hook-metadata';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const before = jest.fn();
    const hook: Hook = { before };
    const { wrapper } = mountComposableInProvider(() => useStringFlagValue('string', 'default', { hooks: [hook] }), {
      domain,
    });

    expect(before).toHaveBeenCalledWith(
      expect.objectContaining({
        clientMetadata: expect.objectContaining({ domain, framework: 'vue' }),
      }),
      undefined,
    );
    wrapper.unmount();
  });

  it('merges provider and evaluation hooks with evaluation hints taking precedence', async () => {
    const domain = 'evaluation-provider-hooks';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const providerBefore = jest.fn();
    const evaluationBefore = jest.fn();
    const providerHook: Hook = { before: providerBefore };
    const evaluationHook: Hook = { before: evaluationBefore };
    const { wrapper } = mountComposableInProvider(
      () =>
        useBooleanFlagValue('boolean', false, {
          hooks: [evaluationHook],
          hookHints: { source: 'evaluation' },
        }),
      {
        domain,
        hooks: [providerHook],
        hookHints: { source: 'provider' },
      },
    );

    expect(providerBefore).toHaveBeenCalledWith(expect.any(Object), { source: 'evaluation' });
    expect(evaluationBefore).toHaveBeenCalledWith(expect.any(Object), { source: 'evaluation' });
    expect(providerBefore.mock.invocationCallOrder[0]).toBeLessThan(evaluationBefore.mock.invocationCallOrder[0]);
    wrapper.unmount();
  });

  it('uses provider hook hints when evaluation hints are absent', async () => {
    const domain = 'evaluation-provider-hook-hints';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const before = jest.fn();
    const { wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), {
      domain,
      hooks: [{ before }],
      hookHints: { source: 'provider' },
    });

    expect(before).toHaveBeenCalledWith(expect.any(Object), { source: 'provider' });
    wrapper.unmount();
  });

  it('does not evaluate twice when the provider is already ready', async () => {
    const domain = 'evaluation-single-initial-evaluation';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const before = jest.fn();
    const { wrapper } = mountComposableInProvider(
      () => useBooleanFlagValue('boolean', false, { hooks: [{ before }] }),
      { domain },
    );

    expect(before).toHaveBeenCalledTimes(1);
    wrapper.unmount();
  });

  it('removes provider handlers when the component is disposed', async () => {
    const domain = 'evaluation-cleanup';
    await OpenFeature.setProviderAndWait(domain, new TypedInMemoryProvider(FLAG_CONFIG));
    const client = OpenFeature.getClient(domain);
    const readyHandlers = client.getHandlers(ProviderEvents.Ready).length;
    const contextHandlers = client.getHandlers(ProviderEvents.ContextChanged).length;
    const configurationHandlers = client.getHandlers(ProviderEvents.ConfigurationChanged).length;
    const errorHandlers = client.getHandlers(ProviderEvents.Error).length;
    const staleHandlers = client.getHandlers(ProviderEvents.Stale).length;
    const { wrapper } = mountComposableInProvider(() => useBooleanFlagValue('boolean', false), { domain });

    expect(client.getHandlers(ProviderEvents.Ready).length).toBeGreaterThan(readyHandlers);
    expect(client.getHandlers(ProviderEvents.ContextChanged).length).toBeGreaterThan(contextHandlers);
    expect(client.getHandlers(ProviderEvents.ConfigurationChanged).length).toBeGreaterThan(configurationHandlers);
    expect(client.getHandlers(ProviderEvents.Error).length).toBeGreaterThan(errorHandlers);
    expect(client.getHandlers(ProviderEvents.Stale).length).toBeGreaterThan(staleHandlers);

    wrapper.unmount();

    expect(client.getHandlers(ProviderEvents.Ready).length).toBe(readyHandlers);
    expect(client.getHandlers(ProviderEvents.ContextChanged).length).toBe(contextHandlers);
    expect(client.getHandlers(ProviderEvents.ConfigurationChanged).length).toBe(configurationHandlers);
    expect(client.getHandlers(ProviderEvents.Error).length).toBe(errorHandlers);
    expect(client.getHandlers(ProviderEvents.Stale).length).toBe(staleHandlers);
  });
});
