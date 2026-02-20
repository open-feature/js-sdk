import type {
  EvaluationDetails,
  BaseHook,
  HookHints,
  JsonValue,
  BooleanFlagKey,
  StringFlagKey,
  NumberFlagKey,
  ObjectFlagKey,
} from '@openfeature/core';

export interface FlagEvaluationOptions {
  hooks?: BaseHook[];
  hookHints?: HookHints;
}

export interface Features {
  /**
   * Performs a flag evaluation that returns a boolean.
   * @param {BooleanFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {boolean} Flag evaluation response
   */
  getBooleanValue(flagKey: BooleanFlagKey, defaultValue: boolean, options?: FlagEvaluationOptions): boolean;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {BooleanFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {EvaluationDetails<boolean>} Flag evaluation details response
   */
  getBooleanDetails(
    flagKey: BooleanFlagKey,
    defaultValue: boolean,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<boolean>;

  /**
   * Performs a flag evaluation that returns a string.
   * @param {StringFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {T} Flag evaluation response
   */
  getStringValue(flagKey: StringFlagKey, defaultValue: string, options?: FlagEvaluationOptions): string;

  getStringValue<T extends string = string>(
    flagKey: StringFlagKey,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {StringFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {EvaluationDetails<T>} Flag evaluation details response
   */
  getStringDetails(
    flagKey: StringFlagKey,
    defaultValue: string,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<string>;

  getStringDetails<T extends string = string>(
    flagKey: StringFlagKey,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T>;

  /**
   * Performs a flag evaluation that returns a number.
   * @param {NumberFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {T} Flag evaluation response
   */
  getNumberValue(flagKey: NumberFlagKey, defaultValue: number, options?: FlagEvaluationOptions): number;

  getNumberValue<T extends number = number>(
    flagKey: NumberFlagKey,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {NumberFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getNumberDetails(
    flagKey: NumberFlagKey,
    defaultValue: number,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<number>;

  getNumberDetails<T extends number = number>(
    flagKey: NumberFlagKey,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T>;

  /**
   * Performs a flag evaluation that returns an object.
   * @param {ObjectFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getObjectValue(flagKey: ObjectFlagKey, defaultValue: JsonValue, options?: FlagEvaluationOptions): JsonValue;

  getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: ObjectFlagKey,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {ObjectFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getObjectDetails(
    flagKey: ObjectFlagKey,
    defaultValue: JsonValue,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<JsonValue>;

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: ObjectFlagKey,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T>;
}
