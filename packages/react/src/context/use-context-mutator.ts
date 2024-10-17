import { useCallback, useContext, useRef } from 'react';
import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { Context } from '../common';

export type ContextMutationOptions = {
  /**
   * Mutate the default context instead of the domain scoped context applied at the `<OpenFeatureProvider/>`.
   * Note, if the `<OpenFeatureProvider/>` has no domain specified, the default is used.
   * See the {@link https://openfeature.dev/docs/reference/technologies/client/web/#manage-evaluation-context-for-domains|documentation} for more information.
   * @default false
   */
  defaultContext?: boolean;
};

export type ContextMutation = {
  /**
   * A function to set the desired context (see: {@link ContextMutationOptions} for details).
   * There's generally no need to await the result of this function; flag evaluation hooks will re-render when the context is updated.
   * This promise never rejects.
   * @param updatedContext
   * @returns Promise for awaiting the context update
   */
  setContext: (updatedContext: EvaluationContext) => Promise<void>;
};

/**
 * Get function(s) for mutating the evaluation context associated with this domain, or the default context if `defaultContext: true`.
 * See the {@link https://openfeature.dev/docs/reference/technologies/client/web/#targeting-and-context|documentation} for more information.
 * @param {ContextMutationOptions} options options for the generated function
 * @returns {ContextMutation} function(s) to mutate context
 */
export function useContextMutator(options: ContextMutationOptions = { defaultContext: false }): ContextMutation {
    const { domain } = useContext(Context) || {};
    const previousContext = useRef<null | EvaluationContext>(null);

    const setContext = useCallback(async (updatedContext: EvaluationContext) => {
        if (previousContext.current !== updatedContext) {
            if (!domain || options?.defaultContext) {
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
