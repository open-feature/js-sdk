import { useCallback, useContext, useRef } from 'react';
import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { Context } from '../common';

export type ContextMutationOptions = {
  /**
   * Apply changes to the default context instead of the domain scoped context applied at the <OpenFeatureProvider/>.
   * Note, if the <OpenFeatureProvider/> has no domain specified, the default is used.
   */
  default?: boolean;
};

export type ContextMutation = {
  /**
   * A function to set the desired context (see: {@link ContextMutationOptions} for details).
   * @param updatedContext
   * @returns
   */
  setContext: (updatedContext: EvaluationContext) => Promise<void>
};

/**
 * Get function(s) for mutating the evaluation context associated with this domain, or the default context if `global: true`.
 * @param {ContextMutationOptions} options options for the generated function
 * @returns {ContextMutation}function to mutate context
 */
export function useContextMutator(options: ContextMutationOptions = {}): ContextMutation {
    const { domain } = useContext(Context) || {};
    const previousContext = useRef<null | EvaluationContext>(null);

    const setContext = useCallback(async (updatedContext: EvaluationContext) => {
        if (previousContext.current !== updatedContext) {
            if (!domain || options?.default) {
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
