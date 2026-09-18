import type { EvaluationContext } from '@openfeature/web-sdk';
import { OpenFeature } from '@openfeature/web-sdk';
import { cloneContext } from '../internal/clone-context';
import { isEqual } from '../internal/is-equal';
import { getScope } from '../internal/scope';

export type ContextMutationOptions = {
  /**
   * Mutate the default context instead of the domain scoped context applied with `setOpenFeatureScope`.
   * By default, will use the domain set with `setOpenFeatureScope` (or the domain associated with the client set with `setOpenFeatureScope`).
   * See the {@link https://openfeature.dev/docs/reference/technologies/client/web/#manage-evaluation-context-for-domains|documentation} for more information.
   * @default false
   */
  defaultContext?: boolean;
};

export type ContextMutation = {
  /**
   * Context-aware function to set the desired context (see: {@link ContextMutationOptions} for details).
   * There's generally no need to await the result of this function; reactive flag evaluations update when the context is updated.
   * This promise never rejects.
   * @param updatedContext New context object or method to generate it from the current context
   * @returns Promise for awaiting the context update
   */
  setContext: (
    updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
  ) => Promise<void>;
};

/**
 * Get context-aware function(s) for mutating the evaluation context associated with the domain of the enclosing scope,
 * or the default context if `defaultContext: true`.
 * See the {@link https://openfeature.dev/docs/reference/technologies/client/web/#targeting-and-context|documentation} for more information.
 * @param {ContextMutationOptions} options options for the generated function
 * @returns {ContextMutation} context-aware function(s) to mutate evaluation context
 */
export function useContextMutator(options: ContextMutationOptions = { defaultContext: false }): ContextMutation {
  const domain = getScope()?.client.metadata.domain;

  // TODO: Replace this warning with a thrown error in a future major release,
  //       when `defaultContext` isn't explicitly set to true.
  if (!options.defaultContext && !domain) {
    console.warn(
      '[useContextMutator] No domain available from the OpenFeature scope; are you using setOpenFeatureScope? setContext will mutate the default context, as if `defaultContext: true` were set. This may result in a thrown error in the future.',
    );
  }

  const setContext = async (
    updatedContext: EvaluationContext | ((currentContext: EvaluationContext) => EvaluationContext),
  ): Promise<void> => {
    const previousContext = OpenFeature.getContext(options?.defaultContext ? undefined : domain);
    // the updater gets an independent copy, so in-place mutations (even of nested values) are still detected as changes
    const resolvedContext =
      typeof updatedContext === 'function' ? updatedContext(cloneContext(previousContext)) : updatedContext;

    if (!isEqual(previousContext, resolvedContext)) {
      if (!domain || options?.defaultContext) {
        await OpenFeature.setContext(resolvedContext);
      } else {
        await OpenFeature.setContext(domain, resolvedContext);
      }
    }
  };

  return {
    setContext,
  };
}
