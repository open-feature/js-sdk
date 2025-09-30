import type { FinalResult, ProviderResolutionResult, StrategyPerProviderContext } from './base-evaluation-strategy';
import { BaseEvaluationStrategy } from './base-evaluation-strategy';
import type { EvaluationContext, FlagValue } from '../../../evaluation';
import { ErrorCode } from '../../../evaluation';

export class FirstMatchStrategy<TProviderStatus, TProvider> extends BaseEvaluationStrategy<TProviderStatus, TProvider> {
  override shouldEvaluateNextProvider<T extends FlagValue>(
    strategyContext: StrategyPerProviderContext<TProviderStatus, TProvider>,
    context: EvaluationContext,
    result: ProviderResolutionResult<T, TProviderStatus, TProvider>,
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
    strategyContext: StrategyPerProviderContext<TProviderStatus, TProvider>,
    context: EvaluationContext,
    resolutions: ProviderResolutionResult<T, TProviderStatus, TProvider>[],
  ): FinalResult<T, TProviderStatus, TProvider> {
    const finalResolution = resolutions[resolutions.length - 1];
    if (this.hasError(finalResolution)) {
      return this.collectProviderErrors(resolutions);
    }
    return this.resolutionToFinalResult(finalResolution);
  }
}
