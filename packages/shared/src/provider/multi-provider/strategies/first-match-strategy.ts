import type {
  BaseFinalResult,
  BaseProviderResolutionResult,
  BaseStrategyPerProviderContext,
} from './base-evaluation-strategy';
import { BaseEvaluationStrategy } from './base-evaluation-strategy';
import type { EvaluationContext, FlagValue } from '../../../evaluation';
import { ErrorCode } from '../../../evaluation';

export class FirstMatchStrategy<TProviderStatus, TProvider> extends BaseEvaluationStrategy<TProviderStatus, TProvider> {
  override shouldEvaluateNextProvider<T extends FlagValue>(
    strategyContext: BaseStrategyPerProviderContext<TProviderStatus, TProvider>,
    context: EvaluationContext,
    result: BaseProviderResolutionResult<T, TProviderStatus, TProvider>,
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
    strategyContext: BaseStrategyPerProviderContext<TProviderStatus, TProvider>,
    context: EvaluationContext,
    resolutions: BaseProviderResolutionResult<T, TProviderStatus, TProvider>[],
  ): BaseFinalResult<T, TProviderStatus, TProvider> {
    const finalResolution = resolutions[resolutions.length - 1];
    if (this.hasError(finalResolution)) {
      return this.collectProviderErrors(resolutions);
    }
    return this.resolutionToFinalResult(finalResolution);
  }
}
