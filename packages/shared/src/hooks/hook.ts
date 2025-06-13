import type { BeforeHookContext, HookContext, HookHints } from './hooks';
import type { EvaluationDetails, FlagValue } from '../evaluation';

export interface BaseHook<
  T extends FlagValue = FlagValue, 
  TData = Record<string, unknown>,
  BeforeHookReturn = unknown, 
  HooksReturn = unknown
> {
  /**
   * Runs before flag values are resolved from the provider.
   * If an EvaluationContext is returned, it will be merged with the pre-existing EvaluationContext.
   * @param hookContext
   * @param hookHints
   */
  before?(hookContext: BeforeHookContext<T, TData>, hookHints?: HookHints): BeforeHookReturn;

  /**
   * Runs after flag values are successfully resolved from the provider.
   * @param hookContext
   * @param evaluationDetails
   * @param hookHints
   */
  after?(
    hookContext: Readonly<HookContext<T, TData>>,
    evaluationDetails: EvaluationDetails<T>,
    hookHints?: HookHints,
  ): HooksReturn;

  /**
   * Runs in the event of an unhandled error or promise rejection during flag resolution, or any attached hooks.
   * @param hookContext
   * @param error
   * @param hookHints
   */
  error?(hookContext: Readonly<HookContext<T, TData>>, error: unknown, hookHints?: HookHints): HooksReturn;

  /**
   * Runs after all other hook stages, regardless of success or error.
   * @param hookContext
   * @param evaluationDetails
   * @param hookHints
   */
  finally?(
    hookContext: Readonly<HookContext<T, TData>>,
    evaluationDetails: EvaluationDetails<T>,
    hookHints?: HookHints,
  ): HooksReturn;
}

