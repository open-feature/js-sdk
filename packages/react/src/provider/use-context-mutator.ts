import { useContext } from 'react';
import { OpenFeature, EvaluationContext } from '@openfeature/web-sdk';
import { Context } from './context';

/**
 *
 * A hook for accessing context mutating functions.
 *
 */
export function useContextMutator() {
  const { domain } = useContext(Context) || {};

  async function mutateContext(updatedContext: EvaluationContext): Promise<void> {
    if (!domain) {
      // Set the global context
      OpenFeature.setContext(updatedContext);
      return;
    }

    OpenFeature.setContext(domain, updatedContext);
  }

  return {
    mutateContext,
  };
}
