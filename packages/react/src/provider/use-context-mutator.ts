import { OpenFeature, EvaluationContext } from '@openfeature/web-sdk';

export function useContextMutator() {
  return {
    mutateContext: async (domain: string, updatedContext: EvaluationContext) => {
      await OpenFeature.setContext(domain, updatedContext);
    }
  };
}