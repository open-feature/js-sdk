import { EvaluationContext, InMemoryProvider, OpenFeature, StandardResolutionReasons } from '@openfeature/web-sdk';
import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { act, render, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import {
    OpenFeatureProvider,
    useBooleanFlagDetails,
    useBooleanFlagValue,
    useFlag,
    useNumberFlagDetails,
    useNumberFlagValue,
    useObjectFlagDetails,
    useObjectFlagValue,
    useStringFlagDetails,
    useStringFlagValue,
} from '../src/';

class TestingProvider extends InMemoryProvider {
  constructor(
    flagConfiguration: ConstructorParameters<typeof InMemoryProvider>[0],
    private delay: number,
  ) {
    super(flagConfiguration);
  }

  // artificially delay our init (delaying PROVIDER_READY event)
  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
    return super.initialize(context);
  }

  // artificially delay context changes
  async onContextChange(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, this.delay));
  }
}

describe('evaluation', () => {
  const EVALUATION = 'evaluation';
  const BOOL_FLAG_KEY = 'boolean-flag';
  const BOOL_FLAG_VARIANT = 'on';
  const BOOL_FLAG_VALUE = true;
  const STRING_FLAG_KEY = 'string-flag';
  const STRING_FLAG_VARIANT = 'greeting';
  const STRING_FLAG_VALUE = 'hi';
  const NUMBER_FLAG_KEY = 'number-flag';
  const NUMBER_FLAG_VARIANT = '2^10';
  const NUMBER_FLAG_VALUE = 1024;
  const OBJECT_FLAG_KEY = 'object-flag';
  const OBJECT_FLAG_VARIANT = 'template';
  const OBJECT_FLAG_VALUE = { factor: 'x1000' };

  const VARIANT_ATTR = 'data-variant';
  const REASON_ATTR = 'data-reason';
  const REASON_ATTR_VALUE = StandardResolutionReasons.STATIC;
  const TYPE_ATTR = 'data-type';

  const provider = new InMemoryProvider({
    [BOOL_FLAG_KEY]: {
      disabled: false,
      variants: {
        [BOOL_FLAG_VARIANT]: BOOL_FLAG_VALUE,
        off: false,
      },
      defaultVariant: BOOL_FLAG_VARIANT,
    },
    [STRING_FLAG_KEY]: {
      disabled: false,
      variants: {
        [STRING_FLAG_VARIANT]: STRING_FLAG_VALUE,
        parting: 'bye',
      },
      defaultVariant: STRING_FLAG_VARIANT,
    },
    [NUMBER_FLAG_KEY]: {
      disabled: false,
      variants: {
        [NUMBER_FLAG_VARIANT]: NUMBER_FLAG_VALUE,
        '2^1': 2,
      },
      defaultVariant: NUMBER_FLAG_VARIANT,
    },
    [OBJECT_FLAG_KEY]: {
      disabled: false,
      variants: {
        [OBJECT_FLAG_VARIANT]: OBJECT_FLAG_VALUE,
        empty: {},
      },
      defaultVariant: OBJECT_FLAG_VARIANT,
    },
  });

  OpenFeature.setProvider(EVALUATION, provider);

  describe('query-style evaluation API', () => {
    function TestComponent() {
      const {
        value: booleanVal,
        reason: boolReason,
        variant: boolVariant,
        type: booleanType,
      } = useFlag(BOOL_FLAG_KEY, false);
      const {
        value: stringVal,
        reason: stringReason,
        variant: stringVariant,
        type: stringType,
      } = useFlag(STRING_FLAG_KEY, 'default');
      const {
        value: numberVal,
        reason: numberReason,
        variant: numberVariant,
        type: numberType,
      } = useFlag(NUMBER_FLAG_KEY, 0);
      const {
        value: objectVal,
        reason: objectReason,
        variant: objectVariant,
        type: objectType,
      } = useFlag(OBJECT_FLAG_KEY, {});
      return (
        <>
          <div data-type={booleanType} data-variant={boolVariant} data-reason={boolReason}>{`${booleanVal}`}</div>
          <div data-type={stringType} data-variant={stringVariant} data-reason={stringReason}>
            {stringVal}
          </div>
          <div data-type={numberType} data-variant={numberVariant} data-reason={numberReason}>{`${numberVal}`}</div>
          <div data-type={objectType} data-variant={objectVariant} data-reason={objectReason}>
            {JSON.stringify(objectVal)}
          </div>
        </>
      );
    }

    it('should evaluate flag', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <TestComponent></TestComponent>
        </OpenFeatureProvider>,
      );

      const boolElement = screen.queryByText(`${BOOL_FLAG_VALUE}`);
      const stringElement = screen.queryByText(STRING_FLAG_VALUE);
      const numberElement = screen.queryByText(`${NUMBER_FLAG_VALUE}`);
      const objectElement = screen.queryByText(JSON.stringify(OBJECT_FLAG_VALUE));

      expect(boolElement).toBeInTheDocument();
      expect(boolElement).toHaveAttribute(VARIANT_ATTR, BOOL_FLAG_VARIANT);
      expect(boolElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);
      expect(boolElement).toHaveAttribute(TYPE_ATTR, 'boolean');

      expect(stringElement).toBeInTheDocument();
      expect(stringElement).toHaveAttribute(VARIANT_ATTR, STRING_FLAG_VARIANT);
      expect(stringElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);
      expect(stringElement).toHaveAttribute(TYPE_ATTR, 'string');

      expect(numberElement).toBeInTheDocument();
      expect(numberElement).toHaveAttribute(VARIANT_ATTR, NUMBER_FLAG_VARIANT);
      expect(numberElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);
      expect(numberElement).toHaveAttribute(TYPE_ATTR, 'number');

      expect(objectElement).toBeInTheDocument();
      expect(objectElement).toHaveAttribute(VARIANT_ATTR, OBJECT_FLAG_VARIANT);
      expect(objectElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);
      expect(objectElement).toHaveAttribute(TYPE_ATTR, 'object');
    });
  });

  describe('basic evaluation API', () => {
    function TestComponent() {
      const booleanVal = useBooleanFlagValue(BOOL_FLAG_KEY, false);
      const stringVal = useStringFlagValue(STRING_FLAG_KEY, 'default');
      const numberVal = useNumberFlagValue(NUMBER_FLAG_KEY, 0);
      const objectVal = useObjectFlagValue(OBJECT_FLAG_KEY, {});
      return (
        <>
          <div>{`${booleanVal}`}</div>
          <div>{stringVal}</div>
          <div>{numberVal}</div>
          <div>{JSON.stringify(objectVal)}</div>
        </>
      );
    }

    it('should evaluate flag', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <TestComponent></TestComponent>
        </OpenFeatureProvider>,
      );
      expect(screen.queryByText(STRING_FLAG_VALUE)).toBeInTheDocument();
    });
  });

  describe('detailed evaluation API', () => {
    function TestComponent() {
      const booleanValDetails = useBooleanFlagDetails(BOOL_FLAG_KEY, false);
      const stringValDetails = useStringFlagDetails(STRING_FLAG_KEY, 'default');
      const numberValDetails = useNumberFlagDetails(NUMBER_FLAG_KEY, 0);
      const objectValDetails = useObjectFlagDetails(OBJECT_FLAG_KEY, {});
      return (
        <>
          <div
            data-variant={booleanValDetails.variant}
            data-reason={booleanValDetails.reason}
          >{`${booleanValDetails.value}`}</div>
          <div data-variant={stringValDetails.variant} data-reason={stringValDetails.reason}>
            {stringValDetails.value}
          </div>
          <div
            data-variant={numberValDetails.variant}
            data-reason={numberValDetails.reason}
          >{`${numberValDetails.value}`}</div>
          <div data-variant={objectValDetails.variant} data-reason={objectValDetails.reason}>
            {JSON.stringify(objectValDetails.value)}
          </div>
        </>
      );
    }

    it('should evaluate flag', () => {
      render(
        <OpenFeatureProvider domain={EVALUATION}>
          <TestComponent></TestComponent>
        </OpenFeatureProvider>,
      );

      const boolElement = screen.queryByText(`${BOOL_FLAG_VALUE}`);
      const stringElement = screen.queryByText(STRING_FLAG_VALUE);
      const numberElement = screen.queryByText(`${NUMBER_FLAG_VALUE}`);
      const objectElement = screen.queryByText(JSON.stringify(OBJECT_FLAG_VALUE));

      expect(boolElement).toBeInTheDocument();
      expect(boolElement).toHaveAttribute(VARIANT_ATTR, BOOL_FLAG_VARIANT);
      expect(boolElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);

      expect(stringElement).toBeInTheDocument();
      expect(stringElement).toHaveAttribute(VARIANT_ATTR, STRING_FLAG_VARIANT);
      expect(stringElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);

      expect(numberElement).toBeInTheDocument();
      expect(numberElement).toHaveAttribute(VARIANT_ATTR, NUMBER_FLAG_VARIANT);
      expect(numberElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);

      expect(objectElement).toBeInTheDocument();
      expect(objectElement).toHaveAttribute(VARIANT_ATTR, OBJECT_FLAG_VARIANT);
      expect(objectElement).toHaveAttribute(REASON_ATTR, REASON_ATTR_VALUE);
    });
  });
});

describe('re-rending and suspense', () => {
  /**
   * artificial delay for various async operations for our provider,
   * multiples of it are used in assertions as well
   */
  const DELAY = 100;
  
  const SUSPENSE = 'suspense';
  const SUSPENSE_FLAG_KEY = 'delayed-flag';
  const SUSPENSE_FLAG_VALUE = 'hi';
  const TARGETED_FLAG_VALUE = 'aloha';
  const FALLBACK = 'fallback';
  const DEFAULT = 'default';
  const TARGETED_USER = 'bob@flags.com';

  const suspendingProvider = () => {
    return new TestingProvider(
      {
        [SUSPENSE_FLAG_KEY]: {
          disabled: false,
          variants: {
            greeting: SUSPENSE_FLAG_VALUE,
            parting: 'bye',
            both: TARGETED_FLAG_VALUE,
          },
          defaultVariant: 'greeting',
          contextEvaluator: (context: EvaluationContext) => {
            if (context.user == 'bob@flags.com') {
              return 'both';
            }
            return 'greeting';
          }
        },
      },
      DELAY,
    ); // delay init by 100ms
  }; 
  

  function TestComponent() {
    const { value } = useFlag(SUSPENSE_FLAG_KEY, DEFAULT);
    return (
      <>
        <div>{value}</div>
      </>
    );
  }

  describe('suspendUntilReady=true (default)', () => {
    it('should suspend until ready and then render', async () => {
      OpenFeature.setProvider(SUSPENSE, suspendingProvider());

      render(
        <OpenFeatureProvider domain={SUSPENSE}>
          <React.Suspense fallback={<div>{FALLBACK}</div>}>
            <TestComponent></TestComponent>
          </React.Suspense>
        </OpenFeatureProvider>,
      );

      // should see fallback initially
      expect(screen.queryByText(SUSPENSE_FLAG_VALUE)).toBeNull();
      expect(screen.queryByText(FALLBACK)).toBeInTheDocument();
      // eventually we should the value
      await waitFor(() => expect(screen.queryByText(SUSPENSE_FLAG_VALUE)).toBeInTheDocument(), { timeout: DELAY * 2 });
    });
  });

  describe('suspendWhileReconciling=true (default)', () => {
    it('should suspend until reconciled and then render', async () => {
      OpenFeature.setProvider(SUSPENSE, suspendingProvider());

      render(
        // disable suspendUntilReady, we are only testing reconcile suspense.
        <OpenFeatureProvider domain={SUSPENSE} suspendUntilReady={false}>
          <React.Suspense fallback={<div>{FALLBACK}</div>}>
            <TestComponent></TestComponent>
          </React.Suspense>
        </OpenFeatureProvider>,
      );
      
      // initially should be default, because suspendUntilReady={false}
      expect(screen.queryByText(DEFAULT)).toBeInTheDocument();
      // update our context
      // don't await the change or we risk missing the suspense (note that the waitfor assertion has a timeout, it retries)
      act(() => {
        OpenFeature.setContext(SUSPENSE, { user: TARGETED_USER }); // update the context
      });

      // expect to see fallback while we are reconciling
      await waitFor(() => expect(screen.queryByText(FALLBACK)).toBeInTheDocument(), { timeout: DELAY / 2 });

      // make sure we updated after reconciling
      await waitFor(() => expect(screen.queryByText(TARGETED_FLAG_VALUE)).toBeInTheDocument(), { timeout: DELAY * 2 });
    });
  });

  describe('suspend=false', () => {
    it('should not suspend until reconciled and then render', async () => {
      OpenFeature.setProvider(SUSPENSE, suspendingProvider());

      render(
        // disable suspendUntilReady, we are only testing reconcile suspense.
        <OpenFeatureProvider domain={SUSPENSE} suspend={false}>
          <React.Suspense fallback={<div>{FALLBACK}</div>}>
            <TestComponent></TestComponent>
          </React.Suspense>
        </OpenFeatureProvider>,
      );
      
      // assert no suspense
      expect(screen.queryByText(DEFAULT)).toBeInTheDocument();
      expect(screen.queryByText(FALLBACK)).toBeNull();
      // update our context
      act(() => {
        OpenFeature.setContext(SUSPENSE, { user: TARGETED_USER }); // update the context
      });

      // assert no suspense
      expect(screen.queryByText(DEFAULT)).toBeInTheDocument();
      expect(screen.queryByText(FALLBACK)).toBeNull();
      
      // expect to see default while we are reconciling
      await waitFor(() => expect(screen.queryByText(DEFAULT)).toBeInTheDocument(), { timeout: DELAY / 2 });

      // make sure we updated after reconciling
      await waitFor(() => expect(screen.queryByText(TARGETED_FLAG_VALUE)).toBeInTheDocument(), { timeout: DELAY * 2 });
    });
  });
});
