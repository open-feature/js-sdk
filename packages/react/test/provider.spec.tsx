import type { EvaluationContext } from '@openfeature/web-sdk';
import { InMemoryProvider, OpenFeature, ProviderEvents } from '@openfeature/web-sdk';
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

      it('should return a stable client across renders', () => {
        const wrapper = ({ children }: Parameters<typeof OpenFeatureProvider>[0]) => (
          <OpenFeatureProvider domain={DOMAIN}>{children}</OpenFeatureProvider>
        );

        const { result, rerender } = renderHook(() => useOpenFeatureClient(), { wrapper });

        const firstClient = result.current;
        rerender();
        const secondClient = result.current;

        expect(firstClient).toBe(secondClient);
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
    const MutateButton = ({ setter }: { setter?: (prevContext: EvaluationContext) => EvaluationContext }) => {
      const { setContext } = useContextMutator();
      const [loading, setLoading] = React.useState(false);

      return (
        <button
          onClick={() => {
            setLoading(true);
            setContext(setter ?? { user: 'bob@flags.com' }).finally(() => setLoading(false));
          }}
        >
          {loading ? 'Updating context...' : 'Update Context'}
        </button>
      );
    };

    const TestComponent = ({
      name,
      setter,
    }: {
      name: string;
      setter?: (prevContext: EvaluationContext) => EvaluationContext;
    }) => {
      const flagValue = useStringFlagValue<'hi' | 'bye' | 'aloha'>(SUSPENSE_FLAG_KEY, 'hi');

      return (
        <div>
          <MutateButton setter={setter} />
          <div>{`${name} says ${flagValue}`}</div>
        </div>
      );
    };

    it('should update context when a domain is set', async () => {
      const DOMAIN = 'mutate-context-tests';
      OpenFeature.setProvider(DOMAIN, suspendingProvider());

      const changed = jest.fn();
      OpenFeature.getClient(DOMAIN).addHandler(ProviderEvents.ContextChanged, changed);

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
      expect(screen.getByText('Updating context...')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.getByText('Update Context')).toBeInTheDocument();
        },
        { timeout: DELAY * 2 },
      );
      expect(changed).toHaveBeenCalledTimes(1);

      expect(screen.getByText('Will says aloha')).toBeInTheDocument();
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
      expect(screen.getByText('Updating context...')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.getAllByText('Update Context')).toHaveLength(2);
        },
        { timeout: DELAY * 2 },
      );

      expect(screen.getByText('Todd says aloha')).toBeInTheDocument();
      expect(screen.getByText('Will says hi')).toBeInTheDocument();
    });

    it('should update nested global contexts', async () => {
      const DOMAIN1 = 'Wills Domain';
      OpenFeature.setProvider(DOMAIN1, suspendingProvider());
      OpenFeature.setProvider(
        new InMemoryProvider({
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
          },
        }),
      );
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
      expect(screen.getByText('Updating context...')).toBeInTheDocument();

      await waitFor(
        () => {
          expect(screen.getAllByText('Update Context')).toHaveLength(2);
        },
        { timeout: DELAY * 2 },
      );

      expect(screen.getByText('Todd likes to Frown')).toBeInTheDocument();
      expect(screen.getByText('Will says aloha')).toBeInTheDocument();
    });

    it('should accept a method taking the previous context', () => {
      const DOMAIN = 'mutate-context-with-function';
      OpenFeature.setProvider(DOMAIN, suspendingProvider(), { done: false });

      const reconcile = jest.fn();
      OpenFeature.getClient(DOMAIN).addHandler(ProviderEvents.Reconciling, reconcile);

      const setter = jest.fn((prevContext: EvaluationContext) => ({ ...prevContext, user: 'bob@flags.com' }));
      render(
        <OpenFeatureProvider domain={DOMAIN}>
          <MutateButton setter={setter} />
        </OpenFeatureProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('Update Context'));
      });
      expect(setter).toHaveBeenCalledTimes(1);
      expect(setter).toHaveBeenCalledWith({ done: false });
      expect(reconcile).toHaveBeenCalledTimes(1);
      expect(OpenFeature.getContext(DOMAIN)).toEqual({ done: false, user: 'bob@flags.com' });
    });

    it('should noop if the previous context is passed in unchanged', () => {
      const DOMAIN = 'mutate-context-noop';
      OpenFeature.setProvider(DOMAIN, suspendingProvider(), { done: false });

      const reconcile = jest.fn();
      OpenFeature.getClient(DOMAIN).addHandler(ProviderEvents.Reconciling, reconcile);

      const setter = jest.fn((prevContext: EvaluationContext) => prevContext);
      render(
        <OpenFeatureProvider domain={DOMAIN}>
          <MutateButton setter={setter} />
        </OpenFeatureProvider>,
      );

      act(() => {
        fireEvent.click(screen.getByText('Update Context'));
      });
      expect(setter).toHaveBeenCalledTimes(1);
      expect(setter).toHaveBeenCalledWith({ done: false });
      expect(reconcile).toHaveBeenCalledTimes(0);
      expect(OpenFeature.getContext(DOMAIN)).toEqual({ done: false });
    });
  });
});
