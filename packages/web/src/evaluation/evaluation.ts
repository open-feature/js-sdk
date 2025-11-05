import type { EvaluationDetails, BaseHook, HookHints, JsonValue } from '@openfeature/core';

export interface FlagEvaluationOptions {
  hooks?: BaseHook[];
  hookHints?: HookHints;
  /**
   * Timeout in milliseconds for the flag evaluation. If the evaluation takes longer than this timeout,
   * it will be rejected with a TIMEOUT error.
   */
  timeout?: number;
  /**
   * AbortSignal for cancelling the flag evaluation. When the signal is aborted, the evaluation
   * will be rejected with a GENERAL error.
   */
  signal?: AbortSignal;
}

export interface ProviderWaitOptions {
  /**
   * Timeout in milliseconds for provider initialization. If the provider takes longer than this timeout
   * to initialize, the promise will be rejected with a TIMEOUT error.
   */
  timeout?: number;
  /**
   * AbortSignal for cancelling the provider initialization. When the signal is aborted,
   * the promise will be rejected with a GENERAL error.
   */
  signal?: AbortSignal;
}

export interface Features {
  /**
   * Performs a flag evaluation that returns a boolean.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {boolean} Flag evaluation response
   */
  getBooleanValue(flagKey: string, defaultValue: boolean, options?: FlagEvaluationOptions): boolean;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {EvaluationDetails<boolean>} Flag evaluation details response
   */
  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<boolean>;

  /**
   * Performs a flag evaluation that returns a string.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {T} Flag evaluation response
   */
  getStringValue(flagKey: string, defaultValue: string, options?: FlagEvaluationOptions): string;

  getStringValue<T extends string = string>(flagKey: string, defaultValue: T, options?: FlagEvaluationOptions): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {EvaluationDetails<T>} Flag evaluation details response
   */
  getStringDetails(flagKey: string, defaultValue: string, options?: FlagEvaluationOptions): EvaluationDetails<string>;

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T>;

  /**
   * Performs a flag evaluation that returns a number.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {T} Flag evaluation response
   */
  getNumberValue(flagKey: string, defaultValue: number, options?: FlagEvaluationOptions): number;

  getNumberValue<T extends number = number>(flagKey: string, defaultValue: T, options?: FlagEvaluationOptions): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getNumberDetails(flagKey: string, defaultValue: number, options?: FlagEvaluationOptions): EvaluationDetails<number>;

  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T>;

  /**
   * Performs a flag evaluation that returns an object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getObjectValue(flagKey: string, defaultValue: JsonValue, options?: FlagEvaluationOptions): JsonValue;

  getObjectValue<T extends JsonValue = JsonValue>(flagKey: string, defaultValue: T, options?: FlagEvaluationOptions): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getObjectDetails(
    flagKey: string,
    defaultValue: JsonValue,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<JsonValue>;

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T>;
}
