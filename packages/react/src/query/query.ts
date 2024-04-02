import { ErrorCode, EvaluationDetails, FlagMetadata, FlagValue, StandardResolutionReasons } from '@openfeature/core';

export interface FlagQuery<T extends FlagValue = FlagValue> {
  /**
   * A structure representing the result of the flag evaluation process
   */
  readonly details: EvaluationDetails<T>;

  /**
   * The flag value
   */
  readonly value: T;

  /**
   * A variant is a semantic identifier for a value.
   * Not available from all providers.
   */
  readonly variant: string | undefined;

  /**
   * Arbitrary data associated with this flag or evaluation.
   * Not available from all providers.
   */
  readonly flagMetadata: FlagMetadata;

  /**
   * The reason the evaluation resolved to the particular value.
   * Not available from all providers.
   */
  readonly reason: typeof StandardResolutionReasons | string | undefined;

  /**
   * Indicates if this flag defaulted due to an error.
   * Specifically, indicates reason equals {@link StandardResolutionReasons.ERROR} or the errorCode is set, this field is truthy.
   */
  readonly isError: boolean;

  /**
   * The error code, see {@link ErrorCode}.
   */
  readonly errorCode: ErrorCode | undefined;

  /**
   * A message associated with the error.
   */
  readonly errorMessage: string | undefined;

  /**
   * Indicates this flag is up-to-date and in sync with the source of truth.
   * Specifically, indicates the evaluation did not default due to error, and the reason is neither {@link StandardResolutionReasons.CACHED} or {@link StandardResolutionReasons.DISABLED}.
   */
  readonly isAuthoritative: boolean;

  /**
   * The type of the value, as returned by "typeof" operator.
   */
  readonly type: 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
}