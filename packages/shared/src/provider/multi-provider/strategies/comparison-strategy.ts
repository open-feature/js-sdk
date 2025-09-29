import type {
  FinalResult,
  ProviderResolutionResult,
  ProviderResolutionSuccessResult,
  StrategyPerProviderContext,
} from './base-evaluation-strategy';
import { BaseEvaluationStrategy } from './base-evaluation-strategy';
import type { EvaluationContext, FlagValue } from '../../../evaluation';
import type { CommonProvider, AllProviderStatus } from '../../../provider';
import { GeneralError } from '../../../errors';

export class ComparisonStrategy extends BaseEvaluationStrategy {
  override runMode = 'parallel' as const;

  constructor(
    private fallbackProvider: CommonProvider<AllProviderStatus>,
    private onMismatch?: (resolutions: ProviderResolutionResult<FlagValue>[]) => void,
  ) {
    super();
  }

  override determineFinalResult<T extends FlagValue>(
    strategyContext: StrategyPerProviderContext,
    context: EvaluationContext,
    resolutions: ProviderResolutionResult<T>[],
  ): FinalResult<T> {
    let value: T | undefined;
    let fallbackResolution: ProviderResolutionSuccessResult<T> | undefined;
    let finalResolution: ProviderResolutionSuccessResult<T> | undefined;
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
