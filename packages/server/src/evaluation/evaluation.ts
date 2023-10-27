import { EvaluationContext, EvaluationDetails, Hook, HookHints, JsonValue } from '@openfeature/core';

export interface FlagEvaluationOptions {
  hooks?: Hook[];
  hookHints?: HookHints;
}

export interface Features {
  /**
   * Performs a flag evaluation that returns a boolean.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<boolean>} Flag evaluation response
   */
  getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<boolean>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<boolean>>} Flag evaluation details response
   */
  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<boolean>>;

  /**
   * Performs a flag evaluation that returns a string.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<string>;

  getStringValue<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<string>>;

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>>;

  /**
   * Performs a flag evaluation that returns a number.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<number>;

  getNumberValue<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<number>>;

  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>>;

  /**
   * Performs a flag evaluation that returns an object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getObjectValue(
    flagKey: string,
    defaultValue: JsonValue,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<JsonValue>;

  getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getObjectDetails(
    flagKey: string,
    defaultValue: JsonValue,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<JsonValue>>;

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>>;
}
