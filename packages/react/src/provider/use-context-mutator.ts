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
    const previousContext = useRef(null);

    const mutateContext = useCallback(async (updatedContext: EvaluationContext) => {
        if (previousContext.current !== updatedContext) {
            if (!domain) {
                OpenFeature.setContext(updatedContext);
            } else {
                OpenFeature.setContext(domain, updatedContext);
            }
            previousContext.current = updatedContext;
        }
    }, [domain]);

    return {
        mutateContext,
    };
}
