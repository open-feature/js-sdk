import type { FinalResult, ProviderResolutionResult, StrategyPerProviderContext } from './BaseEvaluationStrategy';
import { BaseEvaluationStrategy } from './BaseEvaluationStrategy';
import type { EvaluationContext, FlagValue } from '@openfeature/web-sdk';
import { ErrorCode } from '@openfeature/web-sdk';

/**
 * Return the first result that did not indicate "flag not found".
 * If any provider in the course of evaluation returns or throws an error, throw that error
 */
export class FirstMatchStrategy extends BaseEvaluationStrategy {
  override shouldEvaluateNextProvider<T extends FlagValue>(
    strategyContext: StrategyPerProviderContext,
    context: EvaluationContext,
    result: ProviderResolutionResult<T>,
  ): boolean {
    if (this.hasErrorWithCode(result, ErrorCode.FLAG_NOT_FOUND)) {
      return true;
    }
    if (this.hasError(result)) {
      return false;
    }
    return false;
  }

  override determineFinalResult<T extends FlagValue>(
    strategyContext: StrategyPerProviderContext,
    context: EvaluationContext,
    resolutions: ProviderResolutionResult<T>[],
  ): FinalResult<T> {
    const finalResolution = resolutions[resolutions.length - 1];
    if (this.hasError(finalResolution)) {
      return this.collectProviderErrors(resolutions);
    }
    return this.resolutionToFinalResult(finalResolution);
  }
}
