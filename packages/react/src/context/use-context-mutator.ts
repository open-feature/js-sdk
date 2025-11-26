import { useCallback, useContext, useRef } from 'react';
import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { Context } from '../internal';

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
   * Context-aware function to set the desired context (see: {@link ContextMutationOptions} for details).
   * There's generally no need to await the result of this function; flag evaluation hooks will re-render when the context is updated.
   * This promise never rejects.
   * @param updatedContext
   * @returns Promise for awaiting the context update
   */
  setContext: (updatedContext: EvaluationContext | ((previousContext: EvaluationContext) => EvaluationContext)) => Promise<void>;
};

/**
 * Get context-aware tracking function(s) for mutating the evaluation context associated with this domain, or the default context if `defaultContext: true`.
 * See the {@link https://openfeature.dev/docs/reference/technologies/client/web/#targeting-and-context|documentation} for more information.
 * @param {ContextMutationOptions} options options for the generated function
 * @returns {ContextMutation} context-aware function(s) to mutate evaluation context
 */
export function useContextMutator(options: ContextMutationOptions = { defaultContext: false }): ContextMutation {
    const { domain } = useContext(Context) || {};
    const previousContext = useRef<null | EvaluationContext>(null);

    const setContext = useCallback(async (updatedContext: EvaluationContext | ((previousContext: EvaluationContext) => EvaluationContext)): Promise<void> => {
        const resolvedContext = typeof updatedContext === 'function'
            ? updatedContext(OpenFeature.getContext(options?.defaultContext ? undefined : domain))
            : updatedContext;

        if (previousContext.current !== resolvedContext) {
            if (!domain || options?.defaultContext) {
                OpenFeature.setContext(resolvedContext);
            } else {
                OpenFeature.setContext(domain, resolvedContext);
            }
            previousContext.current = resolvedContext;
        }
    }, [domain, options?.defaultContext]);

    return {
        setContext,
    };
}
