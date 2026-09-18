import type { Provider, ResolutionDetails } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { render, screen } from '@testing-library/svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { setOpenFeatureTestScope, useFlag } from '../src';
import FlagValue from './fixtures/FlagValue.svelte';
import TestScopeWrapper from './fixtures/TestScopeWrapper.svelte';

const FLAG_KEY = 'my-flag';
const DEFAULT_VALUE = 'default';
const FLAG_VALUE = 'from-map';

describe('setOpenFeatureTestScope', () => {
  afterEach(async () => {
    await OpenFeature.clearProviders();
  });

  describe('no args', () => {
    it('renders default', () => {
      render(TestScopeWrapper, { flagKey: FLAG_KEY, defaultValue: DEFAULT_VALUE });
      expect(screen.getByTestId('value')).toHaveTextContent(DEFAULT_VALUE);
    });
  });

  describe('flagValueMap set', () => {
    it('renders value from map', () => {
      render(TestScopeWrapper, {
        testScope: { flagValueMap: { [FLAG_KEY]: FLAG_VALUE } },
        flagKey: FLAG_KEY,
        defaultValue: DEFAULT_VALUE,
      });
      expect(screen.getByTestId('value')).toHaveTextContent(FLAG_VALUE);
    });
  });

  describe('delay and flagValueMap set', () => {
    it('renders value after delay', async () => {
      const delayMs = 50;
      render(TestScopeWrapper, {
        testScope: { flagValueMap: { [FLAG_KEY]: FLAG_VALUE }, delayMs },
        flagKey: FLAG_KEY,
        defaultValue: DEFAULT_VALUE,
      });
      expect(screen.getByTestId('value')).toHaveTextContent(DEFAULT_VALUE);

      await new Promise((resolve) => setTimeout(resolve, delayMs * 2));
      flushSync();
      expect(screen.getByTestId('value')).toHaveTextContent(FLAG_VALUE);
    });
  });

  describe('provider set', () => {
    const PROVIDER_VALUE = 'from-provider';
    const PROVIDER_VARIANT = 'my-variant';
    const PROVIDER_REASON = 'MY_REASON';

    class MyTestProvider implements Partial<Provider> {
      resolveStringEvaluation(): ResolutionDetails<string> {
        return { value: PROVIDER_VALUE, variant: PROVIDER_VARIANT, reason: PROVIDER_REASON };
      }
    }

    it('renders provider-returned value', () => {
      render(TestScopeWrapper, {
        testScope: { provider: new MyTestProvider() },
        flagKey: FLAG_KEY,
        defaultValue: DEFAULT_VALUE,
      });
      expect(screen.getByTestId('value')).toHaveTextContent(PROVIDER_VALUE);
      expect(screen.getByTestId('variant')).toHaveTextContent(PROVIDER_VARIANT);
      expect(screen.getByTestId('reason')).toHaveTextContent(PROVIDER_REASON);
    });

    it('falls back to no-op for missing methods', () => {
      render(TestScopeWrapper, {
        testScope: { provider: new MyTestProvider() },
        flagKey: FLAG_KEY,
        defaultValue: false,
      });
      expect(screen.getByTestId('value')).toHaveTextContent('false');
      expect(screen.getByTestId('reason')).toHaveTextContent('No-op');
    });
  });

  describe('domain set', () => {
    it('scopes the test provider to the domain', () => {
      render(TestScopeWrapper, {
        testScope: { domain: 'test-domain', flagValueMap: { [FLAG_KEY]: FLAG_VALUE } },
        flagKey: FLAG_KEY,
        defaultValue: DEFAULT_VALUE,
      });
      expect(screen.getByTestId('value')).toHaveTextContent(FLAG_VALUE);
      expect(OpenFeature.getProviderMetadata('test-domain').name).toBe('in-memory');
      expect(OpenFeature.getProviderMetadata().name).not.toBe('in-memory');
    });
  });

  describe('called outside a component', () => {
    it('configures the default provider for subsequent evaluations', () => {
      setOpenFeatureTestScope({ flagValueMap: { [FLAG_KEY]: FLAG_VALUE } });

      expect(useFlag(FLAG_KEY, DEFAULT_VALUE).value).toBe(FLAG_VALUE);
      render(FlagValue, { flagKey: FLAG_KEY, defaultValue: DEFAULT_VALUE });
      expect(screen.getByTestId('value')).toHaveTextContent(FLAG_VALUE);
    });
  });
});
