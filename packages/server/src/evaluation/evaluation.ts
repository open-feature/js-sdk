import type {
  EvaluationContext,
  EvaluationDetails,
  HookHints,
  JsonValue,
  BooleanFlagKey,
  StringFlagKey,
  NumberFlagKey,
  ObjectFlagKey,
} from '@openfeature/core';
import type { Hook } from '../hooks';

// Must be defined outside @openfeature/core to allow module augmentation of the key types
export type ConstrainedFlagKey<T> = T extends boolean
  ? BooleanFlagKey
  : T extends number
    ? NumberFlagKey
    : T extends string
      ? StringFlagKey
      : T extends JsonValue
        ? ObjectFlagKey
        : never;

export interface FlagEvaluationOptions {
  hooks?: Hook[];
  hookHints?: HookHints;
}

export interface Features {
  /**
   * Performs a flag evaluation that returns a boolean.
   * @param {BooleanFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<boolean>} Flag evaluation response
   */
  getBooleanValue(
    flagKey: BooleanFlagKey,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<boolean>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {BooleanFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<boolean>>} Flag evaluation details response
   */
  getBooleanDetails(
    flagKey: BooleanFlagKey,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<boolean>>;

  /**
   * Performs a flag evaluation that returns a string.
   * @param {StringFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getStringValue(
    flagKey: StringFlagKey,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<string>;

  getStringValue<T extends string = string>(
    flagKey: StringFlagKey,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {StringFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getStringDetails(
    flagKey: StringFlagKey,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<string>>;

  getStringDetails<T extends string = string>(
    flagKey: StringFlagKey,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<T>>;

  /**
   * Performs a flag evaluation that returns a number.
   * @param {NumberFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getNumberValue(
    flagKey: NumberFlagKey,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<number>;

  getNumberValue<T extends number = number>(
    flagKey: NumberFlagKey,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {NumberFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getNumberDetails(
    flagKey: NumberFlagKey,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<number>>;

  getNumberDetails<T extends number = number>(
    flagKey: NumberFlagKey,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<T>>;

  /**
   * Performs a flag evaluation that returns an object.
   * @param {ObjectFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getObjectValue(
    flagKey: ObjectFlagKey,
    defaultValue: JsonValue,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<JsonValue>;

  getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: ObjectFlagKey,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   * @param {ObjectFlagKey} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getObjectDetails(
    flagKey: ObjectFlagKey,
    defaultValue: JsonValue,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<JsonValue>>;

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: ObjectFlagKey,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<T>>;
}
