import { withFrameworkMetadata } from '@openfeature/core';
import type { Client, EvaluationContext, Provider } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import type { App, Plugin } from 'vue';
import { computed } from 'vue';
import type { VueFlagEvaluationOptions } from './options';
import { OPEN_FEATURE_CONTEXT_KEY } from './internal/context';
import { OpenFeatureProvider } from './provider';
import { FeatureFlag } from './declarative';

type ClientOrDomain =
  | {
      client?: Client;
      domain?: never;
    }
  | {
      client?: never;
      domain?: string;
    };

export type OpenFeaturePluginOptions = ClientOrDomain &
  VueFlagEvaluationOptions & {
    provider?: Provider;
    context?: EvaluationContext;
  };

export const OpenFeaturePlugin: Plugin<[OpenFeaturePluginOptions?]> = {
  install(app: App, options: OpenFeaturePluginOptions = {}) {
    if (options.provider) {
      if (options.domain) {
        OpenFeature.setProvider(options.domain, options.provider, options.context ?? {});
      } else {
        OpenFeature.setProvider(options.provider, options.context ?? {});
      }
    }

    const client = withFrameworkMetadata(options.client ?? OpenFeature.getClient(options.domain), 'vue');

    app.provide(
      OPEN_FEATURE_CONTEXT_KEY,
      computed(() => ({ client, options })),
    );
    app.component('OpenFeatureProvider', OpenFeatureProvider);
    app.component('FeatureFlag', FeatureFlag);
  },
};
