import type { EvaluationDetails, BaseHook, HookHints, JsonValue } from '@openfeature/core';

export interface FlagEvaluationOptions {
  hooks?: BaseHook[];
  hookHints?: HookHints;
}

/**
 * Options for subscribing to flag value changes.
 */
export interface FlagChangeSubscriptionOptions extends FlagEvaluationOptions {
  /**
   * Whether to fire the callback when the evaluation context changes.
   * @default true
   */
  updateOnContextChanged?: boolean;

  /**
   * Whether to fire the callback when the provider configuration changes
   * (e.g., when an admin flips a flag or a scheduled feature activation is due).
   * @default true
   */
  updateOnConfigurationChanged?: boolean;
}

export interface FlagValueChangeSubscriptions {
  /**
   * Subscribes to value changes for a boolean flag.
   * The callback is invoked immediately upon subscription with the current flag value,
   * and subsequently whenever the flag value changes due to context changes or
   * provider configuration changes (based on the provided options).
   * @param flagKey The flag key uniquely identifies a particular flag
   * @param defaultValue The value returned if an error occurs
   * @param callback Function called immediately and when flag value changes, receives new and old evaluation details
   * @param options Additional subscription options including which events to listen for
   * @returns Unsubscribe function to remove the listener
   */
  onBooleanChanged(
    flagKey: string,
    defaultValue: boolean,
    callback: (newDetails: EvaluationDetails<boolean>, oldDetails: EvaluationDetails<boolean>) => void,
    options?: FlagChangeSubscriptionOptions,
  ): () => void;

  /**
   * Subscribes to value changes for a string flag.
   * The callback is invoked immediately upon subscription with the current flag value,
   * and subsequently whenever the flag value changes due to context changes or
   * provider configuration changes (based on the provided options).
   * @param flagKey The flag key uniquely identifies a particular flag
   * @param defaultValue The value returned if an error occurs
   * @param callback Function called immediately and when flag value changes, receives new and old evaluation details
   * @param options Additional subscription options including which events to listen for
   * @returns Unsubscribe function to remove the listener
   */
  onStringChanged(
    flagKey: string,
    defaultValue: string,
    callback: (newDetails: EvaluationDetails<string>, oldDetails: EvaluationDetails<string>) => void,
    options?: FlagChangeSubscriptionOptions,
  ): () => void;

  /**
   * Subscribes to value changes for a number flag.
   * The callback is invoked immediately upon subscription with the current flag value,
   * and subsequently whenever the flag value changes due to context changes or
   * provider configuration changes (based on the provided options).
   * @param flagKey The flag key uniquely identifies a particular flag
   * @param defaultValue The value returned if an error occurs
   * @param callback Function called immediately and when flag value changes, receives new and old evaluation details
   * @param options Additional subscription options including which events to listen for
   * @returns Unsubscribe function to remove the listener
   */
  onNumberChanged(
    flagKey: string,
    defaultValue: number,
    callback: (newDetails: EvaluationDetails<number>, oldDetails: EvaluationDetails<number>) => void,
    options?: FlagChangeSubscriptionOptions,
  ): () => void;

  /**
   * Subscribes to value changes for an object flag.
   * The callback is invoked immediately upon subscription with the current flag value,
   * and subsequently whenever the flag value changes due to context changes or
   * provider configuration changes (based on the provided options).
   * @param flagKey The flag key uniquely identifies a particular flag
   * @param defaultValue The value returned if an error occurs
   * @param callback Function called immediately and when flag value changes, receives new and old evaluation details
   * @param options Additional subscription options including which events to listen for
   * @returns Unsubscribe function to remove the listener
   */
  onObjectChanged<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    callback: (newDetails: EvaluationDetails<T>, oldDetails: EvaluationDetails<T>) => void,
    options?: FlagChangeSubscriptionOptions,
  ): () => void;
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
