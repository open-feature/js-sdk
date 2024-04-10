import { EvaluationContext, OpenFeature } from '@openfeature/web-sdk';
import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import { OpenFeatureProvider, useOpenFeatureClient, useWhenProviderReady } from '../src';
import { TestingProvider } from './test.utils';

describe('provider', () => {
  /**
   * artificial delay for various async operations for our provider,
   * multiples of it are used in assertions as well
   */
  const DELAY = 100;
  const SUSPENSE_ON = 'suspense';
  const SUSPENSE_OFF = 'suspense';
  const SUSPENSE_FLAG_KEY = 'delayed-flag';
  const STATIC_FLAG_VALUE = 'hi';
  const TARGETED_FLAG_VALUE = 'aloha';
  const FALLBACK = 'fallback';

  const suspendingProvider = () => {
    return new TestingProvider(
      {
        [SUSPENSE_FLAG_KEY]: {
          disabled: false,
          variants: {
            greeting: STATIC_FLAG_VALUE,
            parting: 'bye',
            both: TARGETED_FLAG_VALUE,
          },
          defaultVariant: 'greeting',
          contextEvaluator: (context: EvaluationContext) => {
            if (context.user == 'bob@flags.com') {
              return 'both';
            }
            return 'greeting';
          },
        },
      },
      DELAY,
    ); // delay init by 100ms
  };

  describe('useOpenFeatureClient', () => {
    const DOMAIN = 'useOpenFeatureClient';

    describe('client specified', () => {
      it('should return client from provider', () => {
        const client = OpenFeature.getClient(DOMAIN);

        const wrapper = ({ children }: Parameters<typeof OpenFeatureProvider>[0]) => (
          <OpenFeatureProvider client={client}>{children}</OpenFeatureProvider>
        );

        const { result } = renderHook(() => useOpenFeatureClient(), { wrapper });

        expect(result.current).toEqual(client);
      });
    });

    describe('domain specified', () => {
      it('should return client with domain', () => {
        const wrapper = ({ children }: Parameters<typeof OpenFeatureProvider>[0]) => (
          <OpenFeatureProvider domain={DOMAIN}>{children}</OpenFeatureProvider>
        );

        const { result } = renderHook(() => useOpenFeatureClient(), { wrapper });

        expect(result.current.metadata.domain).toEqual(DOMAIN);
      });
    });
  });

  describe('useWhenProviderReady', () => {
    describe('suspendUntilReady=true (default)', () => {
      function TestComponent() {
        const isReady = useWhenProviderReady();
        return (
          <>
            <div>{isReady ? '👍' : '👎'}</div>
          </>
        );
      }

      it('should suspend until ready and then return provider status', async () => {
        OpenFeature.setProvider(SUSPENSE_ON, suspendingProvider());

        render(
          <OpenFeatureProvider domain={SUSPENSE_ON}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <TestComponent></TestComponent>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // should see fallback initially
        expect(screen.queryByText('👎')).not.toBeVisible();
        expect(screen.queryByText(FALLBACK)).toBeInTheDocument();
        // eventually we should the value
        await waitFor(() => expect(screen.queryByText('👍')).toBeVisible(), { timeout: DELAY * 2 });
      });
    });

    describe('suspendUntilReady=false', () => {
      function TestComponent() {
        const isReady = useWhenProviderReady({ suspendUntilReady: false });
        return (
          <>
            <div>{isReady ? '👍' : '👎'}</div>
          </>
        );
      }

      it('should not suspend, should return provider status', async () => {
        OpenFeature.setProvider(SUSPENSE_OFF, suspendingProvider());

        render(
          <OpenFeatureProvider domain={SUSPENSE_OFF}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <TestComponent></TestComponent>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // should see falsy value initially
        expect(screen.queryByText('👎')).toBeInTheDocument();
        // eventually we should the value
        await waitFor(() => expect(screen.queryByText('👍')).toBeInTheDocument(), { timeout: DELAY * 2 });
      });
    });
  });
});
