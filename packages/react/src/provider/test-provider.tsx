import type { JsonValue, Provider } from '@openfeature/web-sdk';
import { InMemoryProvider, NOOP_PROVIDER, OpenFeature } from '@openfeature/web-sdk';
import React from 'react';
import type { NormalizedOptions } from '../options';
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
         * Any un-implemented methods or properties will no-op.
         */
        provider?: Partial<Provider>;
        flagValueMap?: never;
        delayMs?: never;
      }
  );

const TEST_VARIANT = 'test-variant';
const TEST_PROVIDER = 'test-provider';

// internal provider which is basically the in-memory provider with a simpler config and some optional fake delays
class TestProvider extends InMemoryProvider {
  // initially make this undefined, we still set it if a delay is specified
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - For maximum compatibility with previous versions, we ignore a possible TS error here,
  // since "initialize" was previously defined in superclass.
  // We can safely remove this ts-ignore in a few versions
  initialize: Provider['initialize'] = undefined;

  // "place-holder" init function which we only assign if want a delay
  private delayedInitialize = async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, this.delay));
  };

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
    // only define and init if there's a non-zero delay specified
    this.initialize = this.delay ? this.delayedInitialize.bind(this) : undefined;
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
  const { flagValueMap, provider, sdk } = testProviderOptions;
  const effectiveProvider = (
    flagValueMap ? new TestProvider(flagValueMap, testProviderOptions.delayMs) : mixInNoop(provider) || NOOP_PROVIDER
  ) as Provider;
  testProviderOptions.domain
    ? (sdk ?? OpenFeature).setProvider(testProviderOptions.domain, effectiveProvider)
    : (sdk ?? OpenFeature).setProvider(effectiveProvider);

  return (
    <OpenFeatureProvider {...(testProviderOptions as NormalizedOptions)} sdk={sdk} domain={testProviderOptions.domain}>
      {testProviderOptions.children}
    </OpenFeatureProvider>
  );
}

// mix in the no-op provider when the partial is passed
function mixInNoop(provider: Partial<Provider> = {}) {
  // fill in any missing methods with no-ops
  for (const prop of Object.getOwnPropertyNames(Object.getPrototypeOf(NOOP_PROVIDER)).filter(
    (prop) => prop !== 'constructor',
  )) {
    const patchedProvider = provider as { [key: string]: keyof Provider };
    if (!Object.getPrototypeOf(patchedProvider)[prop] && !patchedProvider[prop]) {
      patchedProvider[prop] = Object.getPrototypeOf(NOOP_PROVIDER)[prop];
    }
  }
  // fill in the metadata if missing
  if (!provider.metadata || !provider.metadata.name) {
    (provider.metadata as unknown) = { name: TEST_PROVIDER };
  }
  return provider;
}
