import { withFrameworkMetadata } from '@openfeature/core';
import type { BaseHook, Client, HookHints } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import type { PropType } from 'vue';
import { computed, defineComponent, provide } from 'vue';
import type { VueFlagEvaluationOptions } from '../options';
import { OPEN_FEATURE_CONTEXT_KEY } from '../internal/context';

type ClientOrDomain =
  | {
      client?: Client;
      domain?: never;
    }
  | {
      client?: never;
      domain?: string;
    };

export type OpenFeatureProviderProps = ClientOrDomain & VueFlagEvaluationOptions;

export const OpenFeatureProvider = defineComponent({
  name: 'OpenFeatureProvider',
  inheritAttrs: false,
  props: {
    client: {
      type: Object as PropType<Client>,
      required: false,
    },
    domain: {
      type: String,
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
    const context = computed(() => ({
      client: withFrameworkMetadata(props.client ?? OpenFeature.getClient(props.domain), 'vue'),
      options: {
        updateOnConfigurationChanged: props.updateOnConfigurationChanged,
        updateOnContextChanged: props.updateOnContextChanged,
        hooks: props.hooks,
        hookHints: props.hookHints,
      },
    }));

    provide(OPEN_FEATURE_CONTEXT_KEY, context);

    return () => slots.default?.();
  },
});
