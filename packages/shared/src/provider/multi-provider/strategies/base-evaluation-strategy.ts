import type { ErrorCode, EvaluationContext, FlagValue, FlagValueType, ResolutionDetails } from '../../../evaluation';
import type { OpenFeatureError } from '../../../errors';
import { ErrorWithCode } from '../errors';
import type { TrackingEventDetails } from '../../../tracking';

export type StrategyEvaluationContext = {
  flagKey: string;
  flagType: FlagValueType;
};

export type BaseStrategyProviderContext<TProviderStatus, TProvider> = {
  provider: TProvider;
  providerName: string;
  providerStatus: TProviderStatus;
};

export type BaseStrategyPerProviderContext<TProviderStatus, TProvider> = StrategyEvaluationContext &
  BaseStrategyProviderContext<TProviderStatus, TProvider>;

type BaseProviderResolutionResultBase<TProvider> = {
  provider: TProvider;
  providerName: string;
};

export type BaseProviderResolutionSuccessResult<
  T extends FlagValue,
  _TProviderStatus,
  TProvider,
> = BaseProviderResolutionResultBase<TProvider> & {
  details: ResolutionDetails<T>;
};

export type BaseProviderResolutionErrorResult<_TProviderStatus, TProvider> =
  BaseProviderResolutionResultBase<TProvider> & {
    thrownError: unknown;
  };

export type BaseProviderResolutionResult<T extends FlagValue, TProviderStatus, TProvider> =
  | BaseProviderResolutionSuccessResult<T, TProviderStatus, TProvider>
  | BaseProviderResolutionErrorResult<TProviderStatus, TProvider>;

export type BaseFinalResult<T extends FlagValue, _TProviderStatus, TProvider> = {
  details?: ResolutionDetails<T>;
  provider?: TProvider;
  providerName?: string;
  errors?: {
    providerName: string;
    error: unknown;
  }[];
};

/**
 * Base evaluation strategy for multi-provider flag resolution.
 *
 * This class is intended to be extended by concrete strategies and is not
 * directly usable on its own. Implementations must provide a
 * `determineFinalResult` method that takes the per-provider results and
 * determines the final flag resolution outcome.
 *
 * The base class also provides default implementations for
 * `shouldEvaluateThisProvider` and `shouldEvaluateNextProvider` that can be
 * used as-is or overridden by subclasses as needed.
 */
export abstract class BaseEvaluationStrategy<TProviderStatus, TProvider> {
  public runMode: 'parallel' | 'sequential' = 'sequential';

  constructor(protected statusEnum: Record<string, TProviderStatus>) {}

  shouldEvaluateThisProvider(
    strategyContext: BaseStrategyPerProviderContext<TProviderStatus, TProvider>,
    _evalContext?: EvaluationContext,
  ): boolean {
    if (
      strategyContext.providerStatus === this.statusEnum.NOT_READY ||
      strategyContext.providerStatus === this.statusEnum.FATAL
    ) {
      return false;
    }
    return true;
  }

  shouldEvaluateNextProvider<T extends FlagValue>(
    _strategyContext?: BaseStrategyPerProviderContext<TProviderStatus, TProvider>,
    _context?: EvaluationContext,
    _result?: BaseProviderResolutionResult<T, TProviderStatus, TProvider>,
  ): boolean {
    return true;
  }

  shouldTrackWithThisProvider(
    strategyContext: BaseStrategyProviderContext<TProviderStatus, TProvider>,
    _context?: EvaluationContext,
    _trackingEventName?: string,
    _trackingEventDetails?: TrackingEventDetails,
  ): boolean {
    if (
      strategyContext.providerStatus === this.statusEnum.NOT_READY ||
      strategyContext.providerStatus === this.statusEnum.FATAL
    ) {
      return false;
    }
    return true;
  }

  abstract determineFinalResult<T extends FlagValue>(
    strategyContext: StrategyEvaluationContext,
    context: EvaluationContext,
    resolutions: BaseProviderResolutionResult<T, TProviderStatus, TProvider>[],
  ): BaseFinalResult<T, TProviderStatus, TProvider>;

  protected hasError<T extends FlagValue>(
    resolution: BaseProviderResolutionResult<T, TProviderStatus, TProvider>,
  ): resolution is
    | BaseProviderResolutionErrorResult<TProviderStatus, TProvider>
    | (BaseProviderResolutionSuccessResult<T, TProviderStatus, TProvider> & {
        details: ResolutionDetails<T> & { errorCode: ErrorCode };
      }) {
    return 'thrownError' in resolution || !!resolution.details.errorCode;
  }

  protected hasErrorWithCode<T extends FlagValue>(
    resolution: BaseProviderResolutionResult<T, TProviderStatus, TProvider>,
    code: ErrorCode,
  ): boolean {
    return 'thrownError' in resolution
      ? (resolution.thrownError as OpenFeatureError)?.code === code
      : resolution.details.errorCode === code;
  }

  protected collectProviderErrors<T extends FlagValue>(
    resolutions: BaseProviderResolutionResult<T, TProviderStatus, TProvider>[],
  ): BaseFinalResult<T, TProviderStatus, TProvider> {
    const errors: BaseFinalResult<FlagValue, TProviderStatus, TProvider>['errors'] = [];
    for (const resolution of resolutions) {
      if ('thrownError' in resolution) {
        errors.push({ providerName: resolution.providerName, error: resolution.thrownError });
      } else if (resolution.details.errorCode) {
        errors.push({
          providerName: resolution.providerName,
          error: new ErrorWithCode(resolution.details.errorCode, resolution.details.errorMessage ?? 'unknown error'),
        });
      }
    }
    return { errors };
  }

  protected resolutionToFinalResult<T extends FlagValue>(
    resolution: BaseProviderResolutionSuccessResult<T, TProviderStatus, TProvider>,
  ) {
    return { details: resolution.details, provider: resolution.provider, providerName: resolution.providerName };
  }
}
