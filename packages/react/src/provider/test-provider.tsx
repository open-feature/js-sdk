import {
  EvaluationContext,
  InMemoryProvider,
  JsonValue,
  NOOP_PROVIDER,
  OpenFeature,
  Provider,
} from '@openfeature/web-sdk';
import React from 'react';
import { NormalizedOptions } from '../common/options';
import { OpenFeatureProvider } from './provider';

type FlagValueMap = { [flagKey: string]: JsonValue };
type FlagConfig = ConstructorParameters<typeof InMemoryProvider>[0];
type TestProviderProps = Omit<React.ComponentProps<typeof OpenFeatureProvider>, 'client'> &
  (
    | {
        provider?: never;
        /**
         * Optional map of flagKeys to flagValues for this OpenFeatureTestProvider context.
         * If not supplied, all flag evaluations will default.
         */
        flagValueMap?: FlagValueMap;
        /**
         * Optional delay for the underlying test provider's readiness and reconciliation.
         * Defaults to 0.
         */
        delayMs?: number;
      }
    | {
        /**
         * An optional partial provider to pass for full control over the flag resolution for this OpenFeatureTestProvider context.
         */
        provider?: Partial<Provider>;
        flagValueMap?: never;
        delayMs?: never;
      }
  );

const TEST_VARIANT = 'test-variant';

// internal provider which is basically the in-memory provider with a simpler config and some optional fake delays
class TestProvider extends InMemoryProvider {
  constructor(
    flagValueMap: FlagValueMap,
    private delay = 0,
  ) {
    // convert the simple flagValueMap into an in-memory config
    const flagConfig = Object.entries(flagValueMap).reduce((acc: FlagConfig, flag): FlagConfig => {
      return {
        ...acc,
        [flag[0]]: {
          variants: {
            [TEST_VARIANT]: flag[1],
          },
          defaultVariant: TEST_VARIANT,
          disabled: false,
        },
      };
    }, {});
    super(flagConfig);
  }

  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    await Promise.all([super.initialize(context), new Promise<void>((resolve) => setTimeout(resolve, this.delay))]);
  }

  async onContextChange() {
    return new Promise<void>((resolve) => setTimeout(resolve, this.delay));
  }
}

/**
 * A React Context provider based on the {@link InMemoryProvider}, specifically built for testing.
 * Use this for testing components that use flag evaluation hooks.
 * @param {TestProviderProps} testProviderOptions options for the OpenFeatureTestProvider
 * @returns {OpenFeatureProvider} OpenFeatureTestProvider
 */
export function OpenFeatureTestProvider(testProviderOptions: TestProviderProps) {
  const { flagValueMap, provider } = testProviderOptions;
  const effectiveProvider = (
    flagValueMap ? new TestProvider(flagValueMap, testProviderOptions.delayMs) : provider || NOOP_PROVIDER
  ) as Provider;
  testProviderOptions.domain
    ? OpenFeature.setProvider(testProviderOptions.domain, effectiveProvider)
    : OpenFeature.setProvider(effectiveProvider);

  return (
    <OpenFeatureProvider {...(testProviderOptions as NormalizedOptions)} domain={testProviderOptions.domain}>
      {testProviderOptions.children}
    </OpenFeatureProvider>
  );
}
