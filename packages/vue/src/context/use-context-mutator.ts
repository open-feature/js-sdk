import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { computed, inject } from 'vue';
import { OPEN_FEATURE_CONTEXT_KEY } from '../internal/context';

export type ContextMutationOptions = {
  defaultContext?: boolean;
};

export type ContextMutation = {
  setContext: (
    updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
  ) => Promise<void>;
};

export function useContextMutator(options: ContextMutationOptions = {}): ContextMutation {
  const context = inject(OPEN_FEATURE_CONTEXT_KEY, undefined);
  const domain = computed(() => (options.defaultContext ? undefined : context?.value.client.metadata.domain));

  if (!options.defaultContext && !domain.value) {
    console.warn(
      '[useContextMutator] No domain available from OpenFeature context. setContext will mutate the default context, as if defaultContext were true.',
    );
  }

  const setContext = async (
    updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
  ): Promise<void> => {
    const currentDomain = domain.value;
    const previousContext = OpenFeature.getContext(currentDomain);
    const resolvedContext = typeof updatedContext === 'function' ? updatedContext(previousContext) : updatedContext;

    if (previousContext !== resolvedContext) {
      if (currentDomain) {
        await OpenFeature.setContext(currentDomain, resolvedContext);
      } else {
        await OpenFeature.setContext(resolvedContext);
      }
    }
  };

  return { setContext };
}
