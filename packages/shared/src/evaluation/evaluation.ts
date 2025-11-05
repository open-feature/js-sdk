import type { JsonValue } from '../types/structure';

export type FlagValueType = 'boolean' | 'string' | 'number' | 'object';

/**
 * Represents a JSON node value.
 */
export type FlagValue = boolean | string | number | JsonValue;

export type ResolutionReason = keyof typeof StandardResolutionReasons | (string & Record<never, never>);

/**
 * A structure which supports definition of arbitrary properties, with keys of type string, and values of type boolean, string, or number.
 *
 * This structure is populated by a provider for use by an Application Author (via the Evaluation API) or an Application Integrator (via hooks).
 */
export type FlagMetadata = Record<string, string | number | boolean>;

export type ResolutionDetails<U> = {
  value: U;
  variant?: string;
  flagMetadata?: FlagMetadata;
  reason?: ResolutionReason;
  errorCode?: ErrorCode;
  errorMessage?: string;
};

export type EvaluationDetails<T extends FlagValue> = {
  flagKey: string;
  flagMetadata: Readonly<FlagMetadata>;
} & ResolutionDetails<T>;

export const StandardResolutionReasons = {
  /**
   * The resolved value is static (no dynamic evaluation).
   */
  STATIC: 'STATIC',

  /**
   *  The resolved value was configured statically, or otherwise fell back to a pre-configured value.
   */
  DEFAULT: 'DEFAULT',

  /**
   * The resolved value was the result of a dynamic evaluation, such as a rule or specific user-targeting.
   */
  TARGETING_MATCH: 'TARGETING_MATCH',

  /**
   * The resolved value was the result of pseudorandom assignment.
   */
  SPLIT: 'SPLIT',

  /**
   * The resolved value was retrieved from cache.
   */
  CACHED: 'CACHED',

  /**
   * The resolved value was the result of the flag being disabled in the management system.
   */
  DISABLED: 'DISABLED',

  /**
   * The reason for the resolved value could not be determined.
   */
  UNKNOWN: 'UNKNOWN',

  /**
   * The resolved value is non-authoritative or possibly out of date.
   */
  STALE: 'STALE',

  /**
   * The resolved value was the result of an error.
   *
   * Note: The `errorCode` and `errorMessage` fields may contain additional details of this error.
   */
  ERROR: 'ERROR',
} as const;

export enum ErrorCode {
  /**
   * The value was resolved before the provider was ready.
   */
  PROVIDER_NOT_READY = 'PROVIDER_NOT_READY',

  /**
   * The provider has entered an irrecoverable error state.
   */
  PROVIDER_FATAL = 'PROVIDER_FATAL',

  /**
   * The flag could not be found.
   */
  FLAG_NOT_FOUND = 'FLAG_NOT_FOUND',

  /**
   * An error was encountered parsing data, such as a flag configuration.
   */
  PARSE_ERROR = 'PARSE_ERROR',

  /**
   * The type of the flag value does not match the expected type.
   */
  TYPE_MISMATCH = 'TYPE_MISMATCH',

  /**
   * The provider requires a targeting key and one was not provided in the evaluation context.
   */
  TARGETING_KEY_MISSING = 'TARGETING_KEY_MISSING',

  /**
   * The evaluation context does not meet provider requirements.
   */
  INVALID_CONTEXT = 'INVALID_CONTEXT',

  /**
   * The evaluation request timed out.
   */
  TIMEOUT = 'TIMEOUT',

  /**
   * An error with an unspecified code.
   */
  GENERAL = 'GENERAL',
}
