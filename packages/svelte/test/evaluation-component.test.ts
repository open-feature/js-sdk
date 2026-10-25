import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature, ProviderEvents, StandardResolutionReasons, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import FlagKeyProbe from './fixtures/FlagKeyProbe.svelte';
import FlagValue from './fixtures/FlagValue.svelte';
import OptionsWrapper from './fixtures/OptionsWrapper.svelte';

const FLAG_KEY = 'context-sensitive-flag';
const FLAG_CONFIG = {
  [FLAG_KEY]: {
    disabled: false,
    defaultVariant: 'off',
    variants: { off: false, on: true },
    contextEvaluator(ctx: EvaluationContext) {
      return ctx.change ? 'on' : 'off';
    },
  },
} as const;

describe('evaluation in components', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
    await OpenFeature.clearContexts();
  });

  it('re-evaluates and moves its handlers when the flag key changes', async () => {
    await OpenFeature.setProviderAndWait(
      new TypedInMemoryProvider({
        ...FLAG_CONFIG,
        'enabled-flag': { disabled: false, defaultVariant: 'on', variants: { on: true, off: false } },
      }),
    );
    const client = OpenFeature.getClient();
    const initialHandlers = client.getHandlers(ProviderEvents.ContextChanged).length;
    const { rerender } = render(FlagKeyProbe, { flagKey: FLAG_KEY });
    expect(screen.getByTestId('value')).toHaveTextContent('false');

    await rerender({ flagKey: 'enabled-flag' });
    await Promise.resolve();
    expect(screen.getByTestId('value')).toHaveTextContent('true');
    expect(client.getHandlers(ProviderEvents.ContextChanged).length).toBe(initialHandlers + 1);
  });

  it('renders the flag value and updates it when the context changes', async () => {
    await OpenFeature.setProviderAndWait(new TypedInMemoryProvider(FLAG_CONFIG));
    render(FlagValue, { flagKey: FLAG_KEY, defaultValue: false });

    expect(screen.getByTestId('value')).toHaveTextContent('false');
    expect(screen.getByTestId('variant')).toHaveTextContent('off');
    expect(screen.getByTestId('reason')).toHaveTextContent(StandardResolutionReasons.TARGETING_MATCH);
    expect(screen.getByTestId('type')).toHaveTextContent('boolean');

    await OpenFeature.setContext({ change: true });
    flushSync();
    expect(screen.getByTestId('value')).toHaveTextContent('true');
    expect(screen.getByTestId('variant')).toHaveTextContent('on');
  });

  it('applies scope options to descendants', async () => {
    await OpenFeature.setProviderAndWait('scoped', new TypedInMemoryProvider(FLAG_CONFIG));
    render(OptionsWrapper, {
      scope: { domain: 'scoped', updateOnContextChanged: false },
      flagKey: FLAG_KEY,
      defaultValue: false,
    });

    await OpenFeature.setContext('scoped', { change: true });
    flushSync();
    expect(screen.getByTestId('value')).toHaveTextContent('false');
  });

  it('lets evaluation options override scope options', async () => {
    await OpenFeature.setProviderAndWait('scoped', new TypedInMemoryProvider(FLAG_CONFIG));
    render(OptionsWrapper, {
      scope: { domain: 'scoped', updateOnContextChanged: false },
      flagKey: FLAG_KEY,
      defaultValue: false,
      options: { updateOnContextChanged: true },
    });

    await OpenFeature.setContext('scoped', { change: true });
    flushSync();
    expect(screen.getByTestId('value')).toHaveTextContent('true');
  });
});
