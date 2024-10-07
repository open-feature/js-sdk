import { useContext } from 'react';
import { OpenFeature, EvaluationContext } from '@openfeature/web-sdk';
import { Context } from './context';

/**
 *
 * A hook for accessing context mutating functions.
 *
 */
export function useContextMutator() {
  async function mutateContext(updatedContext: EvaluationContext): Promise<void> {
    const { domain } = useContext(Context) || {};

    if (!domain) {
      throw new Error('No domain set for your context');
    }

    OpenFeature.setContext(domain, updatedContext);
  }

  return {
    mutateContext,
  };
}
