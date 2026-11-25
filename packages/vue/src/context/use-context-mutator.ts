import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { useClientRef } from '../provider/use-open-feature-client';

export type ContextMutationOptions = {
  defaultContext?: boolean;
};

export type ContextMutation = {
  setContext: (
    updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
  ) => Promise<void>;
};

export function useContextMutator(options: ContextMutationOptions = {}): ContextMutation {
  const clientRef = useClientRef();

  const setContext = async (
    updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
  ): Promise<void> => {
    const domain = options.defaultContext ? undefined : clientRef.value.metadata.domain;
    const previousContext = OpenFeature.getContext(domain);
    const resolvedContext = typeof updatedContext === 'function' ? updatedContext(previousContext) : updatedContext;

    if (previousContext !== resolvedContext) {
      if (domain) {
        await OpenFeature.setContext(domain, resolvedContext);
      } else {
        await OpenFeature.setContext(resolvedContext);
      }
    }
  };

  return { setContext };
}
