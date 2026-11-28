import type { ErrorCode, EvaluationDetails, FlagMetadata, FlagValue, ResolutionReason } from '@openfeature/web-sdk';

export interface FlagQuery<T extends FlagValue = FlagValue> {
  readonly details: EvaluationDetails<T>;
  readonly value: T;
  readonly variant: string | undefined;
  readonly flagMetadata: FlagMetadata;
  readonly reason: ResolutionReason | undefined;
  readonly isError: boolean;
  readonly errorCode: ErrorCode | undefined;
  readonly errorMessage: string | undefined;
  readonly isAuthoritative: boolean;
  readonly type: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
}

export type AwaitableFlagQuery<T extends FlagValue = FlagValue> = FlagQuery<T> & PromiseLike<FlagQuery<T>>;
