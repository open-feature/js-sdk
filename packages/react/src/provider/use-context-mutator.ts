import { useCallback, useContext, useRef } from 'react';
import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { Context } from './context';

/**
 *
 * A hook for accessing context mutating functions.
 *
 */
export function useContextMutator({
  setGlobal
}: {
  /**
   * Apply changes to the global context instead of the domain scoped context applied at the React Provider
   */
  setGlobal?: boolean;
} = {}) {
    const { domain } = useContext(Context) || {};
    const previousContext = useRef<null | EvaluationContext>(null);

    const setContext = useCallback(async (updatedContext: EvaluationContext) => {
        if (previousContext.current !== updatedContext) {
            if (!domain || setGlobal) {
                OpenFeature.setContext(updatedContext);
            } else {
                OpenFeature.setContext(domain, updatedContext);
            }
            previousContext.current = updatedContext;
        }
    }, [domain]);

    return {
        setContext,
    };
}
