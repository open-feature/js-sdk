import type { ConstrainedFlagKey, EvaluationDetails, FlagValue } from '@openfeature/web-sdk';
import type { PropType } from 'vue';
import { computed, defineComponent } from 'vue';
import { useFlag } from '../evaluation';
import { isEqual } from '../internal/is-equal';
import type { VueFlagEvaluationOptions } from '../options';
import type { FlagQuery } from '../query';

type FeatureFlagMatchConfig<T extends FlagValue> = {
  defaultValue: T;
} & (T extends boolean
  ? {
      matchValue?: T;
    }
  : {
      matchValue: T;
    });

export type FeatureFlagProps<T extends FlagValue = FlagValue> = {
  flagKey: ConstrainedFlagKey<T>;
  predicate?: (matchValue: T | undefined, details: EvaluationDetails<T>) => boolean;
  evaluationOptions?: VueFlagEvaluationOptions;
} & FeatureFlagMatchConfig<T>;

export const FeatureFlag = defineComponent({
  name: 'FeatureFlag',
  inheritAttrs: false,
  props: {
    flagKey: {
      type: String,
      required: true,
    },
    defaultValue: {
      type: [Boolean, String, Number, Object] as PropType<FlagValue>,
      required: true,
    },
    matchValue: {
      type: null as unknown as PropType<FlagValue | undefined>,
      required: false,
    },
    predicate: {
      type: Function as PropType<FeatureFlagProps['predicate']>,
      required: false,
    },
    evaluationOptions: {
      type: Object as PropType<VueFlagEvaluationOptions>,
      default: () => ({}),
    },
  },
  setup(props, { slots }) {
    const details = useFlag<FlagValue>(
      () => props.flagKey,
      () => props.defaultValue,
      () => props.evaluationOptions,
    );
    const shouldRender = computed(() => {
      const query = details;

      if (query.isError) {
        return false;
      }

      if (props.predicate) {
        return props.predicate(props.matchValue, query.details);
      }

      if (props.matchValue !== undefined) {
        return isEqual(props.matchValue, query.value);
      }

      return query.type === 'boolean' && Boolean(query.value);
    });

    return () => {
      const query = details as FlagQuery<FlagValue>;
      return shouldRender.value ? (slots.default?.(query) ?? null) : (slots.fallback?.(query.details) ?? null);
    };
  },
});
