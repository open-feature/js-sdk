import type { FinalResult, ProviderResolutionResult, StrategyPerProviderContext } from './base-evaluation-strategy';
import { BaseEvaluationStrategy } from './base-evaluation-strategy';
import type { EvaluationContext, FlagValue } from '../../../evaluation';
import { ErrorCode } from '../../../evaluation';

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
