import type { Provider, ResolutionDetails } from '@openfeature/web-sdk';
import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { OpenFeature, OpenFeatureTestProvider, useFlag } from '../src';

const FLAG_KEY = 'thumbs';

function TestComponent(props: { suspend: boolean }) {
  const { value: thumbs, reason } = useFlag(FLAG_KEY, false, { suspend: props.suspend });
  return (
    <>
      <div>{thumbs ? '👍' : '👎'}</div>
      <div>reason: {`${reason}`}</div>
    </>
  );
}

describe('OpenFeatureTestProvider', () => {
  beforeEach(async () => {
    await OpenFeature.clearContexts();
    await OpenFeature.clearProviders();
  });

  describe('no args', () => {
    it('renders default', async () => {
      render(
        <OpenFeatureTestProvider>
          <TestComponent suspend={false} />
        </OpenFeatureTestProvider>,
      );
      expect(screen.getByText('👎')).toBeInTheDocument();
    });
  });

  describe('flagValueMap set', () => {
    it('renders value from map', async () => {
      render(
        <OpenFeatureTestProvider flagValueMap={{ [FLAG_KEY]: true }}>
          <TestComponent suspend={false} />
        </OpenFeatureTestProvider>,
      );

      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  describe('delay and flagValueMap set', () => {
    it('renders value after delay', async () => {
      const delay = 100;
      render(
        <OpenFeatureTestProvider delayMs={delay} flagValueMap={{ [FLAG_KEY]: true }}>
          <TestComponent suspend={false} />
        </OpenFeatureTestProvider>,
      );

      // should only be resolved after delay
      expect(screen.getByText('👎')).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, delay * 4));
      expect(screen.getByText('👍')).toBeInTheDocument();
    });
  });

  describe('provider set', () => {
    const reason = 'MY_REASON';

    it('renders provider-returned value', async () => {
      class MyTestProvider implements Partial<Provider> {
        resolveBooleanEvaluation(): ResolutionDetails<boolean> {
          return {
            value: true,
            variant: 'test-variant',
            reason,
          };
        }
      }

      render(
        <OpenFeatureTestProvider provider={new MyTestProvider()}>
          <TestComponent suspend={false} />
        </OpenFeatureTestProvider>,
      );

      expect(screen.getByText('👍')).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`${reason}`))).toBeInTheDocument();
    });

    it('falls back to no-op for missing methods', async () => {
      class MyEmptyProvider implements Partial<Provider> {}

      render(
        <OpenFeatureTestProvider provider={new MyEmptyProvider()}>
          <TestComponent suspend={false} />
        </OpenFeatureTestProvider>,
      );

      expect(screen.getByText('👎')).toBeInTheDocument();
      expect(screen.getByText(/No-op/)).toBeInTheDocument();
    });
  });

  describe('component under test suspends', () => {
    describe('delay non-zero', () => {
      it('renders fallback then value after delay', async () => {
        const delay = 100;
        render(
          <OpenFeatureTestProvider delayMs={delay} flagValueMap={{ [FLAG_KEY]: true }}>
            <React.Suspense fallback={<>🕒</>}>
              <TestComponent suspend={true} />
            </React.Suspense>
          </OpenFeatureTestProvider>,
        );

        // should initially show fallback, then resolve
        expect(screen.getByText('🕒')).toBeInTheDocument();
        await new Promise((resolve) => setTimeout(resolve, delay * 4));
        expect(screen.getByText('👍')).toBeInTheDocument();
      });
    });

    describe('delay zero', () => {
      it('renders value immediately', async () => {
        render(
          <OpenFeatureTestProvider delayMs={0} flagValueMap={{ [FLAG_KEY]: true }}>
            <React.Suspense fallback={<>🕒</>}>
              <TestComponent suspend={true} />
            </React.Suspense>
          </OpenFeatureTestProvider>,
        );

        // should resolve immediately since delay is falsy
        expect(screen.getByText('👍')).toBeInTheDocument();
      });
    });
  });

  describe('sdk and flagValueMap set', () => {
    it('uses the sdk provided', async () => {
      const sdk = OpenFeature.getIsolated();

      render(
        <OpenFeatureTestProvider sdk={sdk} flagValueMap={{ [FLAG_KEY]: true }}>
          <TestComponent suspend={false} />
        </OpenFeatureTestProvider>,
      );

      expect(sdk.getClient().getBooleanDetails(FLAG_KEY, false)).toMatchObject({
        value: true,
        reason: 'STATIC',
      });
      expect(OpenFeature.getClient().getBooleanDetails(FLAG_KEY, false)).toMatchObject({
        value: false,
        reason: 'ERROR',
      });
    });
  });
});
