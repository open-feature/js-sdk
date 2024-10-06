import { OpenFeature, EvaluationContext } from '@openfeature/web-sdk';

type DomainContextMutator = (domain: string, updatedContext: EvaluationContext) => Promise<void>; 

/**
 * 
 * A hook for accessing context mutating functions.
 * 
 */
export function useContextMutator() {

  async function mutateContext(domainOrUpdatedContext: string | EvaluationContext, updatedContextOrUndefined?: EvaluationContext): Promise<void> {
    if (typeof domainOrUpdatedContext === 'string' && updatedContextOrUndefined) {
      await OpenFeature.setContext(domainOrUpdatedContext, updatedContextOrUndefined);
    } else if (typeof domainOrUpdatedContext !== 'string') {
      OpenFeature.setContext(domainOrUpdatedContext);
    }
  }
  
  return {
    mutateContext, 
  };
}