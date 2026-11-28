import { withFrameworkMetadata } from '@openfeature/core';
import type { BaseHook, Client, HookHints } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import type { PropType, VNode } from 'vue';
import { computed, defineComponent, provide } from 'vue';
import type { VueFlagEvaluationOptions } from '../options';
import { OPEN_FEATURE_CONTEXT_KEY } from '../internal/context';
import type { StableComponent } from '../internal/component-type';

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

export type OpenFeatureProviderSlots = {
  default?: () => VNode[];
};

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
    const client = computed(() => withFrameworkMetadata(props.client ?? OpenFeature.getClient(props.domain), 'vue'));
    const options = computed(() => ({
      updateOnConfigurationChanged: props.updateOnConfigurationChanged,
      updateOnContextChanged: props.updateOnContextChanged,
      hooks: props.hooks,
      hookHints: props.hookHints,
    }));
    const context = computed(() => ({ client: client.value, options: options.value }));

    provide(OPEN_FEATURE_CONTEXT_KEY, context);

    return () => slots.default?.();
  },
}) as unknown as StableComponent<OpenFeatureProviderProps, OpenFeatureProviderSlots>;
