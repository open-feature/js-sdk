import type {
  BaseHook,
  EvaluationContext,
  HookHints,
  InMemoryFlagConfiguration,
  JsonValue,
  Provider,
} from '@openfeature/web-sdk';
import { NOOP_PROVIDER, OpenFeature, TypedInMemoryProvider } from '@openfeature/web-sdk';
import type { App, Plugin, PropType, VNode } from 'vue';
import { defineComponent, h, toRaw, watch } from 'vue';
import { OpenFeaturePlugin } from '../plugin';
import type { VueFlagEvaluationOptions } from '../options';
import type { StableComponent } from '../internal/component-type';
import { OpenFeatureProvider } from './provider';

type FlagValueMap = Record<string, JsonValue>;

type TestProviderSelection =
  | {
      provider?: never;
      flagValueMap?: FlagValueMap;
      delayMs?: number;
    }
  | {
      provider?: Partial<Provider>;
      flagValueMap?: never;
      delayMs?: never;
    };

export type OpenFeatureTestProviderProps = {
  domain?: string;
} & VueFlagEvaluationOptions &
  TestProviderSelection;

export type OpenFeatureTestProviderSlots = {
  default?: () => VNode[];
};

export type OpenFeatureTestPluginOptions = OpenFeatureTestProviderProps & {
  context?: EvaluationContext;
};

const TEST_VARIANT = 'test-variant';
const TEST_PROVIDER = 'test-provider';
const TEST_NOOP_PROVIDER = Object.assign(Object.create(NOOP_PROVIDER) as Provider, {
  metadata: { name: TEST_PROVIDER },
});

class TestProvider extends TypedInMemoryProvider {
  initialize?: Provider['initialize'];

  constructor(
    flagValueMap: FlagValueMap,
    private delay = 0,
  ) {
    const flagConfig = Object.entries(flagValueMap).reduce<InMemoryFlagConfiguration>((config, [flagKey, value]) => {
      config[flagKey] = {
        variants: { [TEST_VARIANT]: value },
        defaultVariant: TEST_VARIANT,
        disabled: false,
      };
      return config;
    }, {});
    super(flagConfig);

    if (delay > 0) {
      this.initialize = async () => {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      };
    }
  }

  onContextChange(): Promise<void> | void {
    if (this.delay <= 0) {
      return;
    }

    return new Promise<void>((resolve) => setTimeout(resolve, this.delay));
  }
}

function mixInNoop(provider: Partial<Provider>): Provider {
  const target = toRaw(provider) as Provider;

  return new Proxy({} as Provider, {
    get(_target, property) {
      if (property === 'metadata') {
        return target.metadata?.name ? target.metadata : { name: TEST_PROVIDER };
      }

      if (property in target) {
        const value = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      }

      const value = Reflect.get(NOOP_PROVIDER, property);
      return typeof value === 'function' ? value.bind(NOOP_PROVIDER) : value;
    },
  });
}

function createEffectiveProvider(options: {
  flagValueMap?: FlagValueMap;
  provider?: Partial<Provider>;
  delayMs?: number;
}): Provider {
  if (options.flagValueMap) {
    return new TestProvider(options.flagValueMap, options.delayMs);
  }

  if (options.provider) {
    return mixInNoop(options.provider);
  }

  return TEST_NOOP_PROVIDER;
}

export const OpenFeatureTestProvider = defineComponent({
  name: 'OpenFeatureTestProvider',
  inheritAttrs: false,
  props: {
    domain: {
      type: String,
      required: false,
    },
    flagValueMap: {
      type: Object as PropType<FlagValueMap>,
      required: false,
    },
    delayMs: {
      type: Number,
      default: 0,
    },
    provider: {
      type: Object as PropType<Partial<Provider>>,
      required: false,
    },
    updateOnConfigurationChanged: {
      type: Boolean,
      default: true,
    },
    updateOnContextChanged: {
      type: Boolean,
      default: true,
    },
    hooks: {
      type: Array as PropType<BaseHook[]>,
      required: false,
    },
    hookHints: {
      type: Object as PropType<HookHints>,
      required: false,
    },
  },
  setup(props, { slots }) {
    const provider = createEffectiveProvider(props);

    watch(
      () => props.domain,
      (domain) => {
        if (domain) {
          OpenFeature.setProvider(domain, provider);
        } else {
          OpenFeature.setProvider(provider);
        }
      },
      { immediate: true, flush: 'pre' },
    );

    return () =>
      h(
        OpenFeatureProvider,
        {
          domain: props.domain,
          updateOnConfigurationChanged: props.updateOnConfigurationChanged,
          updateOnContextChanged: props.updateOnContextChanged,
          hooks: props.hooks,
          hookHints: props.hookHints,
        },
        slots,
      );
  },
}) as unknown as StableComponent<OpenFeatureTestProviderProps, OpenFeatureTestProviderSlots>;

export function createOpenFeatureTestPlugin(options: OpenFeatureTestPluginOptions = {}): Plugin {
  const provider = createEffectiveProvider(options);

  return {
    install(app: App) {
      app.use(OpenFeaturePlugin, { ...options, provider });
    },
  };
}
