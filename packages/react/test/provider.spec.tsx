import { EvaluationContext, InMemoryProvider, OpenFeature } from '@openfeature/web-sdk';
import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { render, renderHook, screen, waitFor, fireEvent, act } from '@testing-library/react';
import * as React from 'react';
import {
  OpenFeatureProvider,
  useOpenFeatureClient,
  useWhenProviderReady,
  useContextMutator,
  useStringFlagValue,
} from '../src';
import { TestingProvider } from './test.utils';

describe('OpenFeatureProvider', () => {
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
            if (context.done === true) {
              return 'parting';
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
      it('should suspend until ready and then return provider status', async () => {
        OpenFeature.setProvider(SUSPENSE_ON, suspendingProvider());

        let renderedWhileNotReady = false;

        function TestComponent() {
          const isReady = useWhenProviderReady({ suspendUntilReady: true });

          if (!isReady) {
            renderedWhileNotReady = true;
          }

          return (
            <>
              <div>{isReady ? '👍' : '👎'}</div>
            </>
          );
        }

        render(
          <OpenFeatureProvider domain={SUSPENSE_ON}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <TestComponent></TestComponent>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // should see fallback initially
        expect(renderedWhileNotReady).toBe(false);
        expect(screen.queryByText('👎')).not.toBeInTheDocument();
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
  describe('useMutateContext', () => {
    const MutateButton = () => {
      const { setContext } = useContextMutator();

      return <button onClick={() => setContext({ user: 'bob@flags.com' })}>Update Context</button>;
    };
    const TestComponent = ({ name }: { name: string }) => {
      const flagValue = useStringFlagValue<'hi' | 'bye' | 'aloha'>(SUSPENSE_FLAG_KEY, 'hi');

      return (
        <div>
          <MutateButton />
          <div>{`${name} says ${flagValue}`}</div>
        </div>
      );
    };

    it('should update context when a domain is set', async () => {
      const DOMAIN = 'mutate-context-tests';
      OpenFeature.setProvider(DOMAIN, suspendingProvider());
      render(
        <OpenFeatureProvider domain={DOMAIN}>
          <React.Suspense fallback={<div>{FALLBACK}</div>}>
            <TestComponent name="Will" />
          </React.Suspense>
        </OpenFeatureProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Will says hi')).toBeInTheDocument();
      });

      act(() => {
        fireEvent.click(screen.getByText('Update Context'));
      });
      await waitFor(
        () => {
          expect(screen.getByText('Will says aloha')).toBeInTheDocument();
        },
        { timeout: DELAY * 4 },
      );
    });

    it('should update nested contexts', async () => {
      const DOMAIN1 = 'Wills Domain';
      const DOMAIN2 = 'Todds Domain';
      OpenFeature.setProvider(DOMAIN1, suspendingProvider());
      OpenFeature.setProvider(DOMAIN2, suspendingProvider());
      render(
        <OpenFeatureProvider domain={DOMAIN1}>
          <React.Suspense fallback={<div>{FALLBACK}</div>}>
            <TestComponent name="Will" />
            <OpenFeatureProvider domain={DOMAIN2}>
              <React.Suspense fallback={<div>{FALLBACK}</div>}>
                <TestComponent name="Todd" />
              </React.Suspense>
            </OpenFeatureProvider>
          </React.Suspense>
        </OpenFeatureProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Todd says hi')).toBeInTheDocument();
      });

      act(() => {
        // Click the Update context button in Todds domain
        fireEvent.click(screen.getAllByText('Update Context')[1]);
      });
      await waitFor(
        () => {
          expect(screen.getByText('Todd says aloha')).toBeInTheDocument();
        },
        { timeout: DELAY * 4 },
      );
      await waitFor(
        () => {
          expect(screen.getByText('Will says hi')).toBeInTheDocument();
        },
        { timeout: DELAY * 4 },
      );
    });

    it('should update nested global contexts', async () => {
      const DOMAIN1 = 'Wills Domain';
      OpenFeature.setProvider(DOMAIN1, suspendingProvider());
      OpenFeature.setProvider(new InMemoryProvider({
        globalFlagsHere: {
          defaultVariant: 'a',
          variants: {
            a: 'Smile',
            b: 'Frown',
          },
          disabled: false,
          contextEvaluator: (ctx: EvaluationContext) => {
            if (ctx.user === 'bob@flags.com') {
              return 'b';
            }

            return 'a';
          },
        }
      }));
      const GlobalComponent = ({ name }: { name: string }) => {
        const flagValue = useStringFlagValue<'b' | 'a'>('globalFlagsHere', 'a');
  
        return (
          <div>
            <MutateButton />
            <div>{`${name} likes to ${flagValue}`}</div>
          </div>
        );
      };
      render(
        <OpenFeatureProvider domain={DOMAIN1}>
          <React.Suspense fallback={<div>{FALLBACK}</div>}>
            <TestComponent name="Will" />
            <OpenFeatureProvider>
              <React.Suspense fallback={<div>{FALLBACK}</div>}>
                <GlobalComponent name="Todd" />
              </React.Suspense>
            </OpenFeatureProvider>
          </React.Suspense>
        </OpenFeatureProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText('Todd likes to Smile')).toBeInTheDocument();
      });

      act(() => {
        // Click the Update context button in Todds domain
        fireEvent.click(screen.getAllByText('Update Context')[1]);
      });
      await waitFor(
        () => {
          expect(screen.getByText('Todd likes to Frown')).toBeInTheDocument();
        },
        { timeout: DELAY * 4 },
      );

      expect(screen.getByText('Will says hi')).toBeInTheDocument();
    });
  });
});
