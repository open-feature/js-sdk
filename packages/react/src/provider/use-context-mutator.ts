import { OpenFeature, EvaluationContext } from '@openfeature/web-sdk';

type DomainContextMutator = (domain: string, updatedContext: EvaluationContext) => Promise<void>; 

type ContextMutatorReturn = {
  mutateContext: DomainContextMutator;
}
/**
 * 
 * A hook for accessing context mutating functions.
 * 
 * @returns {ContextMutatorReturn} 
 */
export function useContextMutator(): {
  mutateContext: DomainContextMutator;
} {
  return {
    /**
     * 
     * Mutates the evaluation context for a given domain.
     * 
     * @param {string}domain
     * @param {EvaluationContext} updatedContext
     */
    mutateContext: async (domain: string, updatedContext: EvaluationContext) => {
      await OpenFeature.setContext(domain, updatedContext);
    }
  };
}