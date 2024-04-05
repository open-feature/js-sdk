import '@testing-library/jest-dom' // see: https://testing-library.com/docs/react-testing-library/setup
import { EvaluationContext, InMemoryProvider, OpenFeature } from '@openfeature/web-sdk'
import { render, screen, waitFor } from '@testing-library/react'
import * as React from 'react'
import { OpenFeatureProvider, useFlag } from '../src/'

class DelayedInMemoryProvider extends InMemoryProvider {
  constructor(
    flagConfiguration: ConstructorParameters<typeof InMemoryProvider>[0],
    private delay: number
  ) {
    super(flagConfiguration);
  }

  // artificially delay our init (delaying PROVIDER_READY event)
  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    return super.initialize(context);
  }
}

function TestComponent({flagKey}: {flagKey: string}) {
  const { value: val } = useFlag(flagKey, 'default');
  return <>{val}</>
}

describe('evaluation', () => {

  const EVALUATION = 'evaluation';
  const STRING_FLAG_KEY = 'string-flag';
  const STRING_FLAG_VALUE = '123';

  const provider = new InMemoryProvider({
    [STRING_FLAG_KEY]: {
      disabled: false,
      variants: {
        a: STRING_FLAG_VALUE,
        b: '456',
      },
      defaultVariant: 'a',
    }
  });

  OpenFeature.setProvider(EVALUATION, provider);

  it('should evaluate flag', () => {
    render(
      <OpenFeatureProvider domain={EVALUATION}>
        <TestComponent flagKey={STRING_FLAG_KEY} ></TestComponent>
      </OpenFeatureProvider>,
    );
    expect(screen.queryByText(STRING_FLAG_VALUE)).toBeInTheDocument();
  });
});

describe('suspense', () => {

  const SUSPENSE = 'suspense';
  const DELAYED_FLAG_KEY = 'delayed-flag';
  const HI = 'hi';
  const FALLBACK = 'fallback';

  const provider = new DelayedInMemoryProvider({
    [DELAYED_FLAG_KEY]: {
      disabled: false,
      variants: {
        greeting: HI,
        parting: 'bye',
      },
      defaultVariant: 'greeting',
    }
  }, 100); // delay init by 100ms

  OpenFeature.setProvider(SUSPENSE, provider);

  describe('suspendUntilReady=true (default)', () => {
    it('should suspend until ready', async () => {
      render(
        <OpenFeatureProvider domain={SUSPENSE}>
          <React.Suspense fallback={<div>{FALLBACK}</div>}>
            <TestComponent flagKey={DELAYED_FLAG_KEY}></TestComponent>
          </React.Suspense>
        </OpenFeatureProvider>,
      );
      expect(screen.queryByText(HI)).toBeNull();
      expect(screen.queryByText(FALLBACK)).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText(HI)).toBeInTheDocument(), { timeout: 200 });
    });
  });
});

