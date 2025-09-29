import type { ErrorCode, EvaluationContext, FlagValue, FlagValueType, ResolutionDetails } from '../../../evaluation';
import type { OpenFeatureError } from '../../../errors';
import type { CommonProvider } from '../../../provider';
import { AllProviderStatus } from '../../../provider';
import { ErrorWithCode } from '../errors';
import type { TrackingEventDetails } from '../../../tracking';

export type StrategyEvaluationContext = {
  flagKey: string;
  flagType: FlagValueType;
};

export type StrategyProviderContext = {
  provider: CommonProvider<AllProviderStatus>;
  providerName: string;
  providerStatus: AllProviderStatus;
};

export type StrategyPerProviderContext = StrategyEvaluationContext & StrategyProviderContext;

type ProviderResolutionResultBase = {
  provider: CommonProvider<AllProviderStatus>;
  providerName: string;
};

export type ProviderResolutionSuccessResult<T extends FlagValue> = ProviderResolutionResultBase & {
  details: ResolutionDetails<T>;
};

export type ProviderResolutionErrorResult = ProviderResolutionResultBase & {
  thrownError: unknown;
};

export type ProviderResolutionResult<T extends FlagValue> =
  | ProviderResolutionSuccessResult<T>
  | ProviderResolutionErrorResult;

export type FinalResult<T extends FlagValue> = {
  details?: ResolutionDetails<T>;
  provider?: CommonProvider<AllProviderStatus>;
  providerName?: string;
  errors?: {
    providerName: string;
    error: unknown;
  }[];
};

export abstract class BaseEvaluationStrategy {
  public runMode: 'parallel' | 'sequential' = 'sequential';

  shouldEvaluateThisProvider(strategyContext: StrategyPerProviderContext, _evalContext?: EvaluationContext): boolean {
    if (
      strategyContext.providerStatus === AllProviderStatus.NOT_READY ||
      strategyContext.providerStatus === AllProviderStatus.FATAL
    ) {
      return false;
    }
    return true;
  }

  shouldEvaluateNextProvider<T extends FlagValue>(
    _strategyContext?: StrategyPerProviderContext,
    _context?: EvaluationContext,
    _result?: ProviderResolutionResult<T>,
  ): boolean {
    return true;
  }

  shouldTrackWithThisProvider(
    strategyContext: StrategyProviderContext,
    _context?: EvaluationContext,
    _trackingEventName?: string,
    _trackingEventDetails?: TrackingEventDetails,
  ): boolean {
    if (
      strategyContext.providerStatus === AllProviderStatus.NOT_READY ||
      strategyContext.providerStatus === AllProviderStatus.FATAL
    ) {
      return false;
    }
    return true;
  }

  abstract determineFinalResult<T extends FlagValue>(
    strategyContext: StrategyEvaluationContext,
    context: EvaluationContext,
    resolutions: ProviderResolutionResult<T>[],
  ): FinalResult<T>;

  protected hasError(resolution: ProviderResolutionResult<FlagValue>): resolution is
    | ProviderResolutionErrorResult
    | (ProviderResolutionSuccessResult<FlagValue> & {
        details: ResolutionDetails<FlagValue> & { errorCode: ErrorCode };
      }) {
    return 'thrownError' in resolution || !!resolution.details.errorCode;
  }

  protected hasErrorWithCode(resolution: ProviderResolutionResult<FlagValue>, code: ErrorCode): boolean {
    return 'thrownError' in resolution
      ? (resolution.thrownError as OpenFeatureError)?.code === code
      : resolution.details.errorCode === code;
  }

  protected collectProviderErrors<T extends FlagValue>(resolutions: ProviderResolutionResult<T>[]): FinalResult<T> {
    const errors: FinalResult<FlagValue>['errors'] = [];
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

  protected resolutionToFinalResult<T extends FlagValue>(resolution: ProviderResolutionSuccessResult<T>) {
    return { details: resolution.details, provider: resolution.provider, providerName: resolution.providerName };
  }
}
