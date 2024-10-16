import '@testing-library/jest-dom'; // see: https://testing-library.com/docs/react-testing-library/setup
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import * as React from 'react';
import type {
  EvaluationContext,
  EvaluationDetails,
  Hook} from '../src/';
import {
  ErrorCode,
  InMemoryProvider,
  OpenFeature,
  OpenFeatureProvider,
  StandardResolutionReasons,
  useBooleanFlagDetails,
  useBooleanFlagValue,
  useFlag,
  useNumberFlagDetails,
  useNumberFlagValue,
  useObjectFlagDetails,
  useObjectFlagValue,
  useStringFlagDetails,
  useStringFlagValue,
  useSuspenseFlag,
} from '../src/';
import { TestingProvider } from './test.utils';
import { HookFlagQuery } from '../src/evaluation/hook-flag-query';
import { startTransition, useState } from 'react';
import { jest } from '@jest/globals';

describe('evaluation', () => {
  const EVALUATION = 'evaluation';
  const BOOL_FLAG_KEY = 'boolean-flag';
  const CONTEXT_BOOL_FLAG_KEY = 'context-sensitive-flag';
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
  const BUTTON_TEXT = 'button';
  const FLAG_CONFIG: ConstructorParameters<typeof InMemoryProvider>[0] = {
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
    [CONTEXT_BOOL_FLAG_KEY]: {
      disabled: false,
      defaultVariant: 'off',
      variants: {
        off: false,
        on: true,
      },
      contextEvaluator(ctx) {
        return ctx.change ? 'on' : 'off';
      },
    },
  };

  const makeProvider = () => {
    return new InMemoryProvider(FLAG_CONFIG);
  };

  OpenFeature.setProvider(EVALUATION, makeProvider());

  describe('rendering', () => {
    describe('useFlag hook', () => {
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

      it('should evaluate flags', () => {
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

    describe('useFlagValue hooks', () => {
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

      it('should evaluate flags', () => {
        render(
          <OpenFeatureProvider domain={EVALUATION}>
            <TestComponent></TestComponent>
          </OpenFeatureProvider>,
        );
        expect(screen.queryByText(STRING_FLAG_VALUE)).toBeInTheDocument();
      });
    });

    describe('useFlagDetails hooks', () => {
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

      it('should evaluate flags', () => {
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

    describe('re-render', () => {
      const RERENDER_DOMAIN = 'rerender';
      const rerenderProvider = new InMemoryProvider(FLAG_CONFIG);

      function TestComponentFactory() {
        let renderCount = 0;

        return function TestComponent() {
          const {
            value: booleanVal,
            reason: boolReason,
            variant: boolVariant,
            type: booleanType,
          } = useFlag(BOOL_FLAG_KEY, false);

          const {
            value: contextBooleanVal,
            reason: contextBoolReason,
            variant: contextBoolVariant,
            type: contextBooleanType,
          } = useFlag('context-sensitive-flag', false);

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

          renderCount++;
          return (
            <>
              <div data-testid="render-count">{renderCount}</div>
              <div data-type={booleanType} data-variant={boolVariant} data-reason={boolReason}>{`${booleanVal}`}</div>
              <div
                data-type={contextBooleanType}
                data-variant={contextBoolVariant}
                data-reason={contextBoolReason}
              >{`${contextBooleanVal}`}</div>
              <div data-type={stringType} data-variant={stringVariant} data-reason={stringReason}>
                {stringVal}
              </div>
              <div data-type={numberType} data-variant={numberVariant} data-reason={numberReason}>{`${numberVal}`}</div>
              <div data-type={objectType} data-variant={objectVariant} data-reason={objectReason}>
                {JSON.stringify(objectVal)}
              </div>
            </>
          );
        };
      }

      OpenFeature.setProvider(RERENDER_DOMAIN, rerenderProvider);

      beforeEach(async () => {
        await rerenderProvider.putConfiguration(FLAG_CONFIG);
        await OpenFeature.setContext(RERENDER_DOMAIN, {});
      });

      afterEach(() => {
        jest.clearAllMocks();
      });

      it('should not rerender on context change because the evaluated values did not change', async () => {
        const TestComponent = TestComponentFactory();
        render(
          <OpenFeatureProvider domain={RERENDER_DOMAIN}>
            <TestComponent></TestComponent>
          </OpenFeatureProvider>,
        );

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');

        await act(async () => {
          await OpenFeature.setContext(RERENDER_DOMAIN, {});
        });

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');
      });

      it('should rerender on context change because the evaluated values changed', async () => {
        const TestComponent = TestComponentFactory();
        render(
          <OpenFeatureProvider domain={RERENDER_DOMAIN}>
            <TestComponent></TestComponent>
          </OpenFeatureProvider>,
        );

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');

        await act(async () => {
          await OpenFeature.setContext(RERENDER_DOMAIN, { change: true });
        });

        expect(screen.queryByTestId('render-count')).toHaveTextContent('2');
      });

      it('should not render on flag change because the provider did not include changed flags in the change event', async () => {
        const TestComponent = TestComponentFactory();
        render(
          <OpenFeatureProvider domain={RERENDER_DOMAIN}>
            <TestComponent></TestComponent>
          </OpenFeatureProvider>,
        );

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');
        await act(async () => {
          await rerenderProvider.putConfiguration({
            ...FLAG_CONFIG,
          });
        });

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');
      });

      it('should not rerender on flag change because the evaluated values did not change', async () => {
        const TestComponent = TestComponentFactory();
        render(
          <OpenFeatureProvider domain={RERENDER_DOMAIN}>
            <TestComponent></TestComponent>
          </OpenFeatureProvider>,
        );

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');

        await act(async () => {
          await rerenderProvider.putConfiguration({
            ...FLAG_CONFIG,
            'new-flag': {
              disabled: false,
              defaultVariant: 'off',
              variants: {
                off: false,
                on: true,
              },
            },
          });
        });

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');
      });

      it('should not rerender on flag change because the config values did not change', async () => {
        const TestComponent = TestComponentFactory();
        const resolverSpy = jest.spyOn(rerenderProvider, 'resolveBooleanEvaluation');
        render(
          <OpenFeatureProvider domain={RERENDER_DOMAIN}>
            <TestComponent></TestComponent>
          </OpenFeatureProvider>,
        );

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');

        await act(async () => {
          await rerenderProvider.putConfiguration({
            ...FLAG_CONFIG,
          });
        });

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');
        // The resolver should not be called again because the flag config did not change
        expect(resolverSpy).toHaveBeenNthCalledWith(
          1,
          BOOL_FLAG_KEY,
          expect.anything(),
          expect.anything(),
          expect.anything(),
        );
      });

      it('should rerender on flag change because the evaluated values changed', async () => {
        const TestComponent = TestComponentFactory();
        const resolverSpy = jest.spyOn(rerenderProvider, 'resolveBooleanEvaluation');
        render(
          <OpenFeatureProvider domain={RERENDER_DOMAIN}>
            <TestComponent></TestComponent>
          </OpenFeatureProvider>,
        );

        expect(screen.queryByTestId('render-count')).toHaveTextContent('1');

        await act(async () => {
          await rerenderProvider.putConfiguration({
            ...FLAG_CONFIG,
            [BOOL_FLAG_KEY]: {
              ...FLAG_CONFIG[BOOL_FLAG_KEY],
              // Change the default variant to trigger a rerender
              defaultVariant: 'off',
            },
          });
        });

        expect(screen.queryByTestId('render-count')).toHaveTextContent('2');

        await act(async () => {
          await rerenderProvider.putConfiguration({
            ...FLAG_CONFIG,
            [BOOL_FLAG_KEY]: {
              ...FLAG_CONFIG[BOOL_FLAG_KEY],
              // Change the default variant to trigger a rerender
              defaultVariant: 'on',
            },
          });
        });

        expect(screen.queryByTestId('render-count')).toHaveTextContent('3');
        expect(resolverSpy).toHaveBeenNthCalledWith(
          3,
          BOOL_FLAG_KEY,
          expect.anything(),
          expect.anything(),
          expect.anything(),
        );
      });
    });
  });

  describe('re-rendering and suspense', () => {
    /**
     * artificial delay for various async operations for our provider,
     * multiples of it are used in assertions as well
     */
    const DELAY = 100;

    const CONFIG_UPDATE = 'config-update';
    const SUSPENSE_FLAG_KEY = 'delayed-flag';
    const FLAG_VARIANT_A = 'greeting';
    const STATIC_FLAG_VALUE_A = 'hi';
    const FLAG_VARIANT_B = 'parting';
    const STATIC_FLAG_VALUE_B = 'bye';
    const TARGETED_FLAG_VARIANT = 'both';
    const TARGETED_FLAG_VALUE = 'aloha';
    const FALLBACK = 'fallback';
    const DEFAULT = 'default';
    const TARGETED_USER = 'bob@flags.com';
    const CONFIG = {
      [SUSPENSE_FLAG_KEY]: {
        disabled: false,
        variants: {
          [FLAG_VARIANT_A]: STATIC_FLAG_VALUE_A,
          [FLAG_VARIANT_B]: STATIC_FLAG_VALUE_B,
          both: TARGETED_FLAG_VALUE,
        },
        defaultVariant: FLAG_VARIANT_A,
        contextEvaluator: (context: EvaluationContext) => {
          if (context.user == 'bob@flags.com') {
            return TARGETED_FLAG_VARIANT;
          }
          return FLAG_VARIANT_A;
        },
      },
    };

    const suspendingProvider = () => {
      return new TestingProvider(CONFIG, DELAY); // delay init by 100ms
    };

    describe('updateOnConfigurationChanged=true (default)', () => {
      function TestComponent() {
        const { value } = useFlag(SUSPENSE_FLAG_KEY, DEFAULT);
        return (
          <>
            <div>{value}</div>
          </>
        );
      }

      it('should re-render after flag config changes', async () => {
        const provider = suspendingProvider();
        OpenFeature.setProvider(CONFIG_UPDATE, provider);

        render(
          <OpenFeatureProvider domain={CONFIG_UPDATE}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <TestComponent></TestComponent>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // first we should see the old value
        await waitFor(() => expect(screen.queryByText(STATIC_FLAG_VALUE_A)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });

        // change our flag config
        await act(async () => {
          await provider.putConfiguration({
            [SUSPENSE_FLAG_KEY]: {
              ...CONFIG[SUSPENSE_FLAG_KEY],
              ...{ defaultVariant: FLAG_VARIANT_B, contextEvaluator: undefined },
            },
          });
        });

        // eventually we should see the new value
        await waitFor(() => expect(screen.queryByText(STATIC_FLAG_VALUE_B)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });
      });
    });

    describe.each([useFlag, useSuspenseFlag])('suspendUntilReady=true', (hook) => {
      const SUSPEND_UNTIL_READY_ON = 'suspendUntilReady';

      function TestComponent() {
        const { value } = hook(SUSPENSE_FLAG_KEY, DEFAULT, { suspendUntilReady: true });
        return (
          <>
            <div>{value}</div>
          </>
        );
      }

      it('should suspend until ready and then render', async () => {
        OpenFeature.setProvider(SUSPEND_UNTIL_READY_ON, suspendingProvider());

        let renderedDefaultValue = false;

        function Component() {
          const { value } = hook(SUSPENSE_FLAG_KEY, DEFAULT, { suspendUntilReady: true });

          if (value === DEFAULT) {
            renderedDefaultValue = true;
          }

          return <div>{value}</div>;
        }

        render(
          <OpenFeatureProvider domain={SUSPEND_UNTIL_READY_ON}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <Component></Component>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // should see fallback initially
        expect(renderedDefaultValue).toBe(false);
        expect(screen.queryByText(STATIC_FLAG_VALUE_A)).toBeNull();
        expect(screen.queryByText(FALLBACK)).toBeInTheDocument();
        // eventually we should see the value
        await waitFor(() => expect(screen.queryByText(STATIC_FLAG_VALUE_A)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });
      });

      it('should show the previous UI during a transition', async () => {
        OpenFeature.setProvider(SUSPEND_UNTIL_READY_ON, suspendingProvider());

        function ParentComponent() {
          const [show, setShow] = useState(false);

          if (show) {
            return <TestComponent></TestComponent>;
          } else {
            return <button onClick={() => startTransition(() => setShow(true))}>{BUTTON_TEXT}</button>;
          }
        }

        render(
          <OpenFeatureProvider domain={SUSPEND_UNTIL_READY_ON}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <ParentComponent></ParentComponent>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // should see button initially
        const button = screen.getByText(BUTTON_TEXT);
        expect(button).toBeInTheDocument();

        // click the button
        act(() => {
          button.click();
        });

        // because this is a transition update, we still see the button
        expect(button).toBeInTheDocument();

        // eventually we should see the value
        await waitFor(() => expect(screen.queryByText(STATIC_FLAG_VALUE_A)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });
      });
    });

    describe('suspendWhileReconciling=true', () => {
      const SUSPEND_WHILE_RECONCILING_ON = 'suspendWhileReconciling=true';

      it('should suspend until reconciled and then render', async () => {
        await OpenFeature.setContext(SUSPEND_WHILE_RECONCILING_ON, {});
        OpenFeature.setProvider(SUSPEND_WHILE_RECONCILING_ON, suspendingProvider());

        let renderedDefaultValue;

        function Component() {
          const { value } = useFlag(SUSPENSE_FLAG_KEY, DEFAULT, { suspendWhileReconciling: true });

          if (value === DEFAULT) {
            renderedDefaultValue = true;
          }

          return <div>{value}</div>;
        }

        render(
          // disable suspendUntilReady, we are only testing reconcile suspense.
          <OpenFeatureProvider domain={SUSPEND_WHILE_RECONCILING_ON} suspendUntilReady={false}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <Component></Component>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // initially should be default, because suspendUntilReady={false}
        expect(screen.queryByText(DEFAULT)).toBeInTheDocument();

        // after the initial render, we should never see the default value anymore, because suspendWhileReconciling={true}
        renderedDefaultValue = false;

        // update the context without awaiting
        act(() => {
          OpenFeature.setContext(SUSPEND_WHILE_RECONCILING_ON, { user: TARGETED_USER });
        });

        // the default value should not be rendered again, since we are suspending while reconciling
        expect(renderedDefaultValue).toBe(false);

        // expect to see fallback while we are reconciling
        await waitFor(() => expect(screen.queryByText(FALLBACK)).toBeInTheDocument(), { timeout: DELAY / 2 });

        // make sure we updated after reconciling
        await waitFor(() => expect(screen.queryByText(TARGETED_FLAG_VALUE)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });
      });

      it('should show the previous UI while reconciling during a transition', async () => {
        await OpenFeature.setContext(SUSPEND_WHILE_RECONCILING_ON, {});
        OpenFeature.setProvider(SUSPEND_WHILE_RECONCILING_ON, suspendingProvider());

        function Component() {
          const { value } = useFlag(SUSPENSE_FLAG_KEY, DEFAULT, { suspendWhileReconciling: true });
          return <div>{value}</div>;
        }

        render(
          // disable suspendUntilReady, we are only testing reconcile suspense.
          <OpenFeatureProvider domain={SUSPEND_WHILE_RECONCILING_ON} suspendUntilReady={false}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <Component></Component>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // initially should be default, because suspendUntilReady={false}
        expect(screen.queryByText(DEFAULT)).toBeInTheDocument();

        // update the context without awaiting
        act(() => {
          startTransition(() => {
            OpenFeature.setContext(SUSPEND_WHILE_RECONCILING_ON, { user: TARGETED_USER });
          });
        });

        // we should still see the same UI, because this is a transition update
        expect(screen.queryByText(DEFAULT)).toBeInTheDocument();

        // make sure we updated after reconciling
        await waitFor(() => expect(screen.queryByText(TARGETED_FLAG_VALUE)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });
      });
    });

    describe.each([useFlag, useSuspenseFlag])('suspend=true', () => {
      const SUSPEND_ON = 'suspend=true';

      it('should suspend on ready and reconcile and then render', async () => {
        await OpenFeature.setContext(SUSPEND_ON, {});
        OpenFeature.setProvider(SUSPEND_ON, suspendingProvider());

        let renderedDefaultValue = false;

        function Component() {
          // test all suspense options on
          const { value } = useFlag(SUSPENSE_FLAG_KEY, DEFAULT, { suspend: true });

          if (value === DEFAULT) {
            renderedDefaultValue = true;
          }

          return <div>{value}</div>;
        }

        render(
          <OpenFeatureProvider domain={SUSPEND_ON}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <Component></Component>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // initially should be default, because suspend={true}
        expect(renderedDefaultValue).toBe(false);
        expect(screen.queryByText(SUSPENSE_FLAG_KEY)).toBeNull();
        expect(screen.queryByText(FALLBACK)).toBeInTheDocument();

        // expect to see value once we are ready
        await waitFor(() => expect(screen.queryByText(STATIC_FLAG_VALUE_A)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });

        // update the context without awaiting
        act(() => {
          OpenFeature.setContext(SUSPEND_ON, { user: TARGETED_USER });
        });

        // the default value should not be rendered again, since we are suspending while reconciling
        expect(renderedDefaultValue).toBe(false);

        // expect to see fallback while we are reconciling
        await waitFor(() => expect(screen.queryByText(FALLBACK)).toBeInTheDocument(), { timeout: DELAY / 2 });

        // make sure we updated after reconciling
        await waitFor(() => expect(screen.queryByText(TARGETED_FLAG_VALUE)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });
      });
    });

    describe('suspend=false (default)', () => {
      const SUSPEND_OFF = 'suspend=false';

      function TestComponent() {
        const { value } = useFlag(SUSPENSE_FLAG_KEY, DEFAULT);
        return (
          <>
            <div>{value}</div>
          </>
        );
      }
      it('should not suspend until reconciled and then render', async () => {
        await OpenFeature.setContext(SUSPEND_OFF, {});
        OpenFeature.setProvider(SUSPEND_OFF, suspendingProvider());

        render(
          // disable suspendUntilReady, we are only testing reconcile suspense.
          <OpenFeatureProvider domain={SUSPEND_OFF} suspend={false}>
            <React.Suspense fallback={<div>{FALLBACK}</div>}>
              <TestComponent></TestComponent>
            </React.Suspense>
          </OpenFeatureProvider>,
        );

        // assert no suspense
        expect(screen.queryByText(DEFAULT)).toBeInTheDocument();
        expect(screen.queryByText(FALLBACK)).toBeNull();

        // expect to see static value after we are ready
        await waitFor(() => expect(screen.queryByText(STATIC_FLAG_VALUE_A)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });

        // update the context without awaiting
        act(() => {
          OpenFeature.setContext(SUSPEND_OFF, { user: TARGETED_USER });
        });

        // expect to see static value until we reconcile
        await waitFor(() => expect(screen.queryByText(STATIC_FLAG_VALUE_A)).toBeInTheDocument(), {
          timeout: DELAY / 2,
        });

        // make sure we updated after reconciling
        await waitFor(() => expect(screen.queryByText(TARGETED_FLAG_VALUE)).toBeInTheDocument(), {
          timeout: DELAY * 2,
        });
      });
    });
  });

  describe('context, hooks and options', () => {
    const DOMAIN = 'signature-tests';
    const STRING_DEFAULT_VALUE = 'default';
    const NUMBER_DEFAULT_VALUE = 13;
    const OBJECT_DEFAULT_VALUE = {};
    const myHook: Hook = {
      before: () => {},
    };
    const client = OpenFeature.getClient(DOMAIN);
    const boolSpy = jest.spyOn(client, 'getBooleanDetails');
    const stringSpy = jest.spyOn(client, 'getStringDetails');
    const numberSpy = jest.spyOn(client, 'getNumberDetails');
    const objectSpy = jest.spyOn(client, 'getObjectDetails');
    const wrapper = ({ children }: Parameters<typeof OpenFeatureProvider>[0]) => (
      <OpenFeatureProvider client={client}>{children}</OpenFeatureProvider>
    );

    beforeAll(async () => {
      await OpenFeature.setProviderAndWait(DOMAIN, makeProvider());
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    describe.each([useFlag, useSuspenseFlag])('useFlag and useSuspenseFlag hook', (hook) => {
      it('should call associated client resolver with key, default, context, and options', () => {
        const { result: boolResult } = renderHook(() => hook(BOOL_FLAG_KEY, false, { hooks: [myHook] }), {
          wrapper,
        });
        expect(boolResult.current.value).toEqual(true);
        expect(boolSpy).toHaveBeenCalledWith(BOOL_FLAG_KEY, false, expect.objectContaining({ hooks: [myHook] }));

        const { result: stringResult } = renderHook(
          () => hook(STRING_FLAG_KEY, STRING_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(stringResult.current.value).toEqual(STRING_FLAG_VALUE);
        expect(stringSpy).toHaveBeenCalledWith(
          STRING_FLAG_KEY,
          STRING_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );

        const { result: numberResult } = renderHook(
          () => hook(NUMBER_FLAG_KEY, NUMBER_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(numberResult.current.value).toEqual(NUMBER_FLAG_VALUE);
        expect(numberSpy).toHaveBeenCalledWith(
          NUMBER_FLAG_KEY,
          NUMBER_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );

        const { result: objectResult } = renderHook(
          () => hook(OBJECT_FLAG_KEY, OBJECT_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(objectResult.current.value).toEqual(OBJECT_FLAG_VALUE);
        expect(objectSpy).toHaveBeenCalledWith(
          OBJECT_FLAG_KEY,
          OBJECT_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );
      });
    });

    describe('useFlagValue hooks', () => {
      it('should call associated client resolver with key, default, context, and options', () => {
        const { result: boolResult } = renderHook(
          () => useBooleanFlagValue(BOOL_FLAG_KEY, false, { hooks: [myHook] }),
          { wrapper },
        );
        expect(boolResult.current).toEqual(true);
        expect(boolSpy).toHaveBeenCalledWith(BOOL_FLAG_KEY, false, expect.objectContaining({ hooks: [myHook] }));

        const { result: stringResult } = renderHook(
          () => useStringFlagValue(STRING_FLAG_KEY, STRING_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(stringResult.current).toEqual(STRING_FLAG_VALUE);
        expect(stringSpy).toHaveBeenCalledWith(
          STRING_FLAG_KEY,
          STRING_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );

        const { result: numberResult } = renderHook(
          () => useNumberFlagValue(NUMBER_FLAG_KEY, NUMBER_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(numberResult.current).toEqual(NUMBER_FLAG_VALUE);
        expect(numberSpy).toHaveBeenCalledWith(
          NUMBER_FLAG_KEY,
          NUMBER_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );

        const { result: objectResult } = renderHook(
          () => useObjectFlagValue(OBJECT_FLAG_KEY, OBJECT_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(objectResult.current).toEqual(OBJECT_FLAG_VALUE);
        expect(objectSpy).toHaveBeenCalledWith(
          OBJECT_FLAG_KEY,
          OBJECT_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );
      });
    });

    describe('useFlagDetails hooks', () => {
      it('should call associated client resolver with key, default, context, and options', () => {
        const { result: boolResult } = renderHook(
          () => useBooleanFlagDetails(BOOL_FLAG_KEY, false, { hooks: [myHook] }),
          { wrapper },
        );
        expect(boolResult.current.value).toEqual(true);
        expect(boolSpy).toHaveBeenCalledWith(BOOL_FLAG_KEY, false, expect.objectContaining({ hooks: [myHook] }));

        const { result: stringResult } = renderHook(
          () => useStringFlagDetails(STRING_FLAG_KEY, STRING_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(stringResult.current.value).toEqual(STRING_FLAG_VALUE);
        expect(stringSpy).toHaveBeenCalledWith(
          STRING_FLAG_KEY,
          STRING_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );

        const { result: numberResult } = renderHook(
          () => useNumberFlagDetails(NUMBER_FLAG_KEY, NUMBER_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(numberResult.current.value).toEqual(NUMBER_FLAG_VALUE);
        expect(numberSpy).toHaveBeenCalledWith(
          NUMBER_FLAG_KEY,
          NUMBER_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );

        const { result: objectResult } = renderHook(
          () => useObjectFlagDetails(OBJECT_FLAG_KEY, OBJECT_DEFAULT_VALUE, { hooks: [myHook] }),
          { wrapper },
        );
        expect(objectResult.current.value).toEqual(OBJECT_FLAG_VALUE);
        expect(objectSpy).toHaveBeenCalledWith(
          OBJECT_FLAG_KEY,
          OBJECT_DEFAULT_VALUE,
          expect.objectContaining({ hooks: [myHook] }),
        );
      });
    });

    describe('HookFlagQuery', () => {
      it('should return details', () => {
        const details: EvaluationDetails<string> = {
          flagKey: 'flag-key',
          flagMetadata: {},
          value: 'string',
        };
        const hookFlagQuery = new HookFlagQuery(details);
        expect(hookFlagQuery.details).toEqual(details);
      });

      it('should return flag metadata', () => {
        const flagMetadata = {
          ping: 'pong',
        };
        const details: EvaluationDetails<boolean> = {
          flagKey: 'with-flagMetadata',
          flagMetadata,
          value: true,
        };
        const hookFlagQuery = new HookFlagQuery(details);
        expect(hookFlagQuery.flagMetadata).toEqual(expect.objectContaining(flagMetadata));
      });

      it.each([
        [
          {
            flagKey: 'i-dont-exist',
            flagMetadata: {},
            errorMessage: 'no flag found with key i-dont-exist',
            errorCode: ErrorCode.FLAG_NOT_FOUND,
            value: true,
          },
        ],
        [
          {
            flagKey: 'i-dont-exist',
            flagMetadata: {},
            errorMessage: 'no flag found with key i-dont-exist',
            errorCode: undefined,
            reason: StandardResolutionReasons.ERROR,
            value: true,
          },
        ],
      ])('should return errors if reason is error or errorCode is set', (details) => {
        const hookFlagQuery = new HookFlagQuery(details);
        expect(hookFlagQuery.isError).toEqual(true);
        expect(hookFlagQuery.errorCode).toEqual(details.errorCode);
        expect(hookFlagQuery.errorMessage).toEqual(details.errorMessage);
      });

      it.each([
        [
          {
            flagKey: 'isAuthoritative-true',
            flagMetadata: {},
            value: 7,
          },
          true,
        ],
        [
          {
            flagKey: 'with-error',
            flagMetadata: {},
            value: 7,
            errorCode: ErrorCode.FLAG_NOT_FOUND,
          },
          false,
        ],
        [
          {
            flagKey: 'with-reason-stale',
            flagMetadata: {},
            value: 7,
            reason: StandardResolutionReasons.STALE,
          },
          false,
        ],
        [
          {
            flagKey: 'with-reason-disabled',
            flagMetadata: {},
            value: 7,
            reason: StandardResolutionReasons.DISABLED,
          },
          false,
        ],
      ])('should return isAuthoritative if Reason != STALE/DISABLED and errorCode unset', (details, expected) => {
        const hookFlagQuery = new HookFlagQuery(details);
        expect(hookFlagQuery.isAuthoritative).toEqual(expected);
      });
    });
  });
});
