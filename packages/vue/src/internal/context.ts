import type { Client } from '@openfeature/web-sdk';
import type { ComputedRef, InjectionKey } from 'vue';
import { inject } from 'vue';
import type { VueFlagEvaluationOptions } from '../options';

export interface OpenFeatureContext {
  client: Client;
  options: VueFlagEvaluationOptions;
}

export const OPEN_FEATURE_CONTEXT_KEY: InjectionKey<ComputedRef<OpenFeatureContext>> = Symbol('openfeature');

export class MissingContextError extends Error {
  constructor(reason: string) {
    super(
      `${reason}: Components using OpenFeature must be wrapped with an <OpenFeatureProvider> or use the OpenFeaturePlugin.`,
    );
    this.name = 'MissingContextError';
  }
}

export function useOpenFeatureContext(): ComputedRef<OpenFeatureContext> {
  const context = inject(OPEN_FEATURE_CONTEXT_KEY, undefined);

  if (!context) {
    throw new MissingContextError('No OpenFeature context available');
  }

  return context;
}
