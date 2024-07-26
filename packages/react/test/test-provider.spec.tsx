import { Provider, ResolutionDetails } from '@openfeature/web-sdk';
import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { OpenFeatureTestProvider, useFlag } from '../src';

const FLAG_KEY = 'thumbs';

function TestComponent() {
  const { value: thumbs } = useFlag(FLAG_KEY, false);
  return (
    <>
      <div>{thumbs ? '👍' : '👎'}</div>
    </>
  );
}

describe('OpenFeatureTestProvider', () => {
  describe('no args', () => {
    it('renders default', async () => {
      render(
        <OpenFeatureTestProvider>
          <TestComponent />
        </OpenFeatureTestProvider>,
      );
      expect(await screen.findByText('👎')).toBeInTheDocument();
    });
  });

  describe('flagValueMap set', () => {
    it('renders value from map', async () => {
      render(
        <OpenFeatureTestProvider flagValueMap={{ [FLAG_KEY]: true }}>
          <TestComponent />
        </OpenFeatureTestProvider>,
      );

      expect(await screen.findByText('👍')).toBeInTheDocument();
    });
  });

  describe('delay and flagValueMap set', () => {
    it('renders value after delay', async () => {
      const delay = 100;
      render(
        <OpenFeatureTestProvider delayMs={delay} flagValueMap={{ [FLAG_KEY]: true }}>
          <TestComponent />
        </OpenFeatureTestProvider>,
      );

      // should only be resolved after delay
      expect(await screen.findByText('👎')).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, delay * 2));
      expect(await screen.findByText('👍')).toBeInTheDocument();
    });
  });

  describe('provider set', () => {
    class MyTestProvider implements Partial<Provider> {
      metadata = {
        name: 'my test provider',
      };
      resolveBooleanEvaluation(): ResolutionDetails<boolean> {
        return {
          value: true,
          variant: 'test-variant',
          reason: 'MY_REASON',
        };
      }
    }

    it('renders provider-returned value', async () => {
      render(
        <OpenFeatureTestProvider provider={new MyTestProvider()}>
          <TestComponent />
        </OpenFeatureTestProvider>,
      );

      expect(await screen.findByText('👍')).toBeInTheDocument();
    });
  });
});
