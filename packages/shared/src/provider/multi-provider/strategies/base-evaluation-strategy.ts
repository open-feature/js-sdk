import type { ErrorCode, EvaluationContext, FlagValue, FlagValueType, ResolutionDetails } from '../../../evaluation';
import type { OpenFeatureError } from '../../../errors';
import { ErrorWithCode } from '../errors';
import type { TrackingEventDetails } from '../../../tracking';

export type StrategyEvaluationContext = {
  flagKey: string;
  flagType: FlagValueType;
};

export type StrategyProviderContext<TProviderStatus, TProvider> = {
  provider: TProvider;
  providerName: string;
  providerStatus: TProviderStatus;
};

export type StrategyPerProviderContext<TProviderStatus, TProvider> = StrategyEvaluationContext &
  StrategyProviderContext<TProviderStatus, TProvider>;

type ProviderResolutionResultBase<TProviderStatus, TProvider> = {
  provider: TProvider;
  providerName: string;
};

export type ProviderResolutionSuccessResult<
  T extends FlagValue,
  TProviderStatus,
  TProvider,
> = ProviderResolutionResultBase<TProviderStatus, TProvider> & {
  details: ResolutionDetails<T>;
};

export type ProviderResolutionErrorResult<TProviderStatus, TProvider> = ProviderResolutionResultBase<
  TProviderStatus,
  TProvider
> & {
  thrownError: unknown;
};

export type ProviderResolutionResult<T extends FlagValue, TProviderStatus, TProvider> =
  | ProviderResolutionSuccessResult<T, TProviderStatus, TProvider>
  | ProviderResolutionErrorResult<TProviderStatus, TProvider>;

export type FinalResult<T extends FlagValue, TProviderStatus, TProvider> = {
  details?: ResolutionDetails<T>;
  provider?: TProvider;
  providerName?: string;
  errors?: {
    providerName: string;
    error: unknown;
  }[];
};

export abstract class BaseEvaluationStrategy<TProviderStatus, TProvider> {
  public runMode: 'parallel' | 'sequential' = 'sequential';

  constructor(protected statusEnum: Record<string, TProviderStatus>) {}

  shouldEvaluateThisProvider(
    strategyContext: StrategyPerProviderContext<TProviderStatus, TProvider>,
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
    _strategyContext?: StrategyPerProviderContext<TProviderStatus, TProvider>,
    _context?: EvaluationContext,
    _result?: ProviderResolutionResult<T, TProviderStatus, TProvider>,
  ): boolean {
    return true;
  }

  shouldTrackWithThisProvider(
    strategyContext: StrategyProviderContext<TProviderStatus, TProvider>,
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
    resolutions: ProviderResolutionResult<T, TProviderStatus, TProvider>[],
  ): FinalResult<T, TProviderStatus, TProvider>;

  protected hasError<T extends FlagValue>(
    resolution: ProviderResolutionResult<T, TProviderStatus, TProvider>,
  ): resolution is
    | ProviderResolutionErrorResult<TProviderStatus, TProvider>
    | (ProviderResolutionSuccessResult<T, TProviderStatus, TProvider> & {
        details: ResolutionDetails<T> & { errorCode: ErrorCode };
      }) {
    return 'thrownError' in resolution || !!resolution.details.errorCode;
  }

  protected hasErrorWithCode<T extends FlagValue>(
    resolution: ProviderResolutionResult<T, TProviderStatus, TProvider>,
    code: ErrorCode,
  ): boolean {
    return 'thrownError' in resolution
      ? (resolution.thrownError as OpenFeatureError)?.code === code
      : resolution.details.errorCode === code;
  }

  protected collectProviderErrors<T extends FlagValue>(
    resolutions: ProviderResolutionResult<T, TProviderStatus, TProvider>[],
  ): FinalResult<T, TProviderStatus, TProvider> {
    const errors: FinalResult<FlagValue, TProviderStatus, TProvider>['errors'] = [];
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
    resolution: ProviderResolutionSuccessResult<T, TProviderStatus, TProvider>,
  ) {
    return { details: resolution.details, provider: resolution.provider, providerName: resolution.providerName };
  }
}
