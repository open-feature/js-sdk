import type {
  BaseFinalResult,
  BaseProviderResolutionResult,
  BaseProviderResolutionSuccessResult,
  BaseStrategyPerProviderContext,
} from './base-evaluation-strategy';
import { BaseEvaluationStrategy } from './base-evaluation-strategy';
import type { EvaluationContext, FlagValue } from '../../../evaluation';
import { GeneralError } from '../../../errors';

export class ComparisonStrategy<TProviderStatus, TProvider> extends BaseEvaluationStrategy<TProviderStatus, TProvider> {
  override runMode = 'parallel' as const;

  constructor(
    statusEnum: Record<string, TProviderStatus>,
    private fallbackProvider: TProvider,
    private onMismatch?: (resolutions: BaseProviderResolutionResult<FlagValue, TProviderStatus, TProvider>[]) => void,
  ) {
    super(statusEnum);
  }

  override determineFinalResult<T extends FlagValue>(
    strategyContext: BaseStrategyPerProviderContext<TProviderStatus, TProvider>,
    context: EvaluationContext,
    resolutions: BaseProviderResolutionResult<T, TProviderStatus, TProvider>[],
  ): BaseFinalResult<T, TProviderStatus, TProvider> {
    let value: T | undefined;
    let fallbackResolution: BaseProviderResolutionSuccessResult<T, TProviderStatus, TProvider> | undefined;
    let finalResolution: BaseProviderResolutionSuccessResult<T, TProviderStatus, TProvider> | undefined;
    let mismatch = false;
    for (const [i, resolution] of resolutions.entries()) {
      if (this.hasError(resolution)) {
        return this.collectProviderErrors(resolutions);
      }
      if (resolution.provider === this.fallbackProvider) {
        fallbackResolution = resolution;
      }
      if (i === 0) {
        finalResolution = resolution;
      }
      if (typeof value !== 'undefined' && value !== resolution.details.value) {
        mismatch = true;
      } else {
        value = resolution.details.value;
      }
    }

    if (!fallbackResolution) {
      throw new GeneralError('Fallback provider not found in resolution results');
    }

    if (!finalResolution) {
      throw new GeneralError('Final resolution not found in resolution results');
    }

    if (mismatch) {
      this.onMismatch?.(resolutions);
      return {
        details: fallbackResolution.details,
        provider: fallbackResolution.provider,
      };
    }

    return this.resolutionToFinalResult(finalResolution);
  }
}
