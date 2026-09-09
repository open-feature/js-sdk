import type { InMemoryFlagConfiguration, JsonValue, Provider } from '@openfeature/web-sdk';
import { NOOP_PROVIDER, OpenFeature, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { hasComponentContext } from '../internal/scope';
import type { OpenFeatureScopeOptions } from './scope';
import { setOpenFeatureScope } from './scope';

type FlagValueMap = { [flagKey: string]: JsonValue };

export type OpenFeatureTestScopeOptions = Omit<OpenFeatureScopeOptions, 'client'> &
  (
    | {
        provider?: never;
        /**
         * Optional map of flagKeys to flagValues for this test scope.
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
         * An optional partial provider to pass for full control over the flag resolution for this test scope.
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
class TestProvider extends TypedInMemoryProvider {
  initialize: Provider['initialize'] = undefined;

  private delayedInitialize = async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, this.delay));
  };

  constructor(
    flagValueMap: FlagValueMap,
    private delay = 0,
  ) {
    // convert the simple flagValueMap into an in-memory config
    const flagConfig = Object.entries(flagValueMap).reduce(
      (acc: InMemoryFlagConfiguration, flag): InMemoryFlagConfiguration => {
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
      },
      {},
    );
    super(flagConfig);
    // only delay initialization if a delay is specified
    this.initialize = this.delay ? this.delayedInitialize.bind(this) : undefined;
  }

  async onContextChange() {
    return new Promise<void>((resolve) => setTimeout(resolve, this.delay));
  }
}

/**
 * Configures a provider based on the {@link TypedInMemoryProvider}, specifically built for testing, and binds
 * it to the current component subtree like `setOpenFeatureScope` does.
 * Use this for testing components that use flag evaluation functions.
 *
 * Call it during component initialization (for example in a wrapper component around the component under test)
 * to scope it to that subtree, or directly in a test (for example in `beforeEach`) to configure the provider
 * for the default client used by components without a scope.
 * @param {OpenFeatureTestScopeOptions} testScopeOptions options for the test scope
 */
export function setOpenFeatureTestScope(testScopeOptions: OpenFeatureTestScopeOptions = {}): void {
  const { flagValueMap, provider, delayMs, ...scopeOptions } = testScopeOptions;
  const effectiveProvider = (
    flagValueMap ? new TestProvider(flagValueMap, delayMs) : mixInNoop(provider) || NOOP_PROVIDER
  ) as Provider;
  scopeOptions.domain
    ? OpenFeature.setProvider(scopeOptions.domain, effectiveProvider)
    : OpenFeature.setProvider(effectiveProvider);

  if (hasComponentContext()) {
    setOpenFeatureScope(scopeOptions);
  }
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
