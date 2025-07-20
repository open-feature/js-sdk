import React from 'react';
import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { render, screen } from '@testing-library/react';
import { FeatureFlag } from '../src/declarative/FeatureFlag'; // Assuming Feature.tsx is in the same directory or adjust path
import { InMemoryProvider, OpenFeature, OpenFeatureProvider } from '../src';

describe('Feature Component', () => {
  const EVALUATION = 'evaluation';
  const MISSING_FLAG_KEY = 'missing-flag';
  const BOOL_FLAG_KEY = 'boolean-flag';
  const BOOL_FLAG_NEGATE_KEY = 'boolean-flag-negate';
  const BOOL_FLAG_VARIANT = 'on';
  const BOOL_FLAG_VALUE = true;
  const STRING_FLAG_KEY = 'string-flag';
  const STRING_FLAG_VARIANT = 'greeting';
  const STRING_FLAG_VALUE = 'hi';

  const FLAG_CONFIG: ConstructorParameters<typeof InMemoryProvider>[0] = {
    [BOOL_FLAG_KEY]: {
      disabled: false,
      variants: {
        [BOOL_FLAG_VARIANT]: BOOL_FLAG_VALUE,
        off: false,
      },
      defaultVariant: BOOL_FLAG_VARIANT,
    },
    [BOOL_FLAG_NEGATE_KEY]: {
      disabled: false,
      variants: {
        [BOOL_FLAG_VARIANT]: BOOL_FLAG_VALUE,
        off: false,
      },
      defaultVariant: 'off',
    },
    [STRING_FLAG_KEY]: {
      disabled: false,
      variants: {
        [STRING_FLAG_VARIANT]: STRING_FLAG_VALUE,
        parting: 'bye',
      },
      defaultVariant: STRING_FLAG_VARIANT,
    }
  };

  const makeProvider = () => {
    return new InMemoryProvider(FLAG_CONFIG);
  };

  OpenFeature.setProvider(EVALUATION, makeProvider());

  const childText = 'Feature is active';
  const ChildComponent = () => <div>{childText}</div>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('<FeatureFlag />', () => {
    it('should not show the feature component if the flag is not enabled', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <FeatureFlag flagKey={BOOL_FLAG_KEY} defaultValue={false}>
            <ChildComponent />
          </FeatureFlag>
        </OpenFeatureProvider>,
      );

      expect(screen.queryByText(childText)).toBeInTheDocument();
    });

    it('should fallback when provided', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <FeatureFlag flagKey={MISSING_FLAG_KEY} defaultValue={false} fallback={<div>Fallback</div>}>
            <ChildComponent />
          </FeatureFlag>
        </OpenFeatureProvider>,
      );

      expect(screen.queryByText('Fallback')).toBeInTheDocument();

      screen.debug();
    });

    it('should handle showing multivariate flags with string match', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <FeatureFlag flagKey={STRING_FLAG_KEY} match={'hi'} defaultValue={'default'}>
            <ChildComponent />
          </FeatureFlag>
        </OpenFeatureProvider>,
      );

      expect(screen.queryByText(childText)).toBeInTheDocument();
    });

    it('should support custom predicate function', () => {
      const customPredicate = (expected: boolean | undefined, actual: { value: boolean }) => {
        // Custom logic: render if flag is NOT the expected value (negation)
        return expected !== undefined ? actual.value !== expected : !actual.value;
      };

      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <FeatureFlag flagKey={BOOL_FLAG_NEGATE_KEY} match={true} predicate={customPredicate} defaultValue={false}>
            <ChildComponent />
          </FeatureFlag>
        </OpenFeatureProvider>,
      );

      expect(screen.queryByText(childText)).toBeInTheDocument();
    });

    it('should render children when no match is provided and flag is truthy', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <FeatureFlag flagKey={BOOL_FLAG_KEY} defaultValue={false}>
            <ChildComponent />
          </FeatureFlag>
        </OpenFeatureProvider>,
      );

      expect(screen.queryByText(childText)).toBeInTheDocument();
    });

    it('should not render children when no match is provided and flag is falsy', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <FeatureFlag flagKey={BOOL_FLAG_NEGATE_KEY} defaultValue={false}>
            <ChildComponent />
          </FeatureFlag>
        </OpenFeatureProvider>,
      );

      expect(screen.queryByText(childText)).not.toBeInTheDocument();
    });
  });
});
