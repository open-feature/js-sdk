import { useCallback, useContext, useEffect, useState } from 'react';
import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { Context } from '../internal';

export type ContextMutationOptions = {
  /**
   * Mutate the default context instead of the domain scoped context applied at the `<OpenFeatureProvider/>`.
   * By default, will use the domain set on `<OpenFeatureProvider/>` (or the domain associated with the client set on `<OpenFeatureProvider/>`).
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
   * @param updatedContext New context object or method to generate it from the current context
   * @returns Promise for awaiting the context update
   */
  setContext: (
    updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
  ) => Promise<void>;
};

/**
 * Get context-aware tracking function(s) for mutating the evaluation context associated with this domain, or the default context if `defaultContext: true`.
 * See the {@link https://openfeature.dev/docs/reference/technologies/client/web/#targeting-and-context|documentation} for more information.
 * @param {ContextMutationOptions} options options for the generated function
 * @returns {ContextMutation} context-aware function(s) to mutate evaluation context
 */
export function useContextMutator(options: ContextMutationOptions = { defaultContext: false }): ContextMutation {
  const { client } = useContext(Context) || {};
  const domain = client?.metadata.domain;

  // TODO: Replace this warning with a thrown error in a future major release,
  //       to match the behavior of `useOpenFeatureProvider` + `useOpenFeatureClient`,
  //       when `defaultContext` isn't explicitly set to true.
  const [warned, setWarned] = useState(false);
  useEffect(() => {
    if (options.defaultContext || domain) {
      if (warned) {
        setWarned(false);
      }
      return;
    }

    if (!warned) {
      console.warn(
        '[useContextMutator] No domain available from OpenFeature context; are you using <OpenFeatureProvider/>? setContext will mutate the default context, as if `defaultContext: true` were set. This may result in a thrown error in the future.',
      );
      setWarned(true);
    }
  }, [warned]);

  const setContext = useCallback(
    async (
      updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
    ): Promise<void> => {
      const previousContext = OpenFeature.getContext(options?.defaultContext ? undefined : domain);
      const resolvedContext = typeof updatedContext === 'function' ? updatedContext(previousContext) : updatedContext;

      if (previousContext !== resolvedContext) {
        if (!domain || options?.defaultContext) {
          await OpenFeature.setContext(resolvedContext);
        } else {
          await OpenFeature.setContext(domain, resolvedContext);
        }
      }
    },
    [domain, options?.defaultContext],
  );

  return {
    setContext,
  };
}
