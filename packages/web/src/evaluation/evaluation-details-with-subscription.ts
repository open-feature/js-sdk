import type {
  EvaluationDetails,
  ErrorCode,
  FlagValue,
  FlagValueType,
  JsonValue,
  EventHandler,
} from '@openfeature/core';
import type { Client } from '../client';
import { ProviderEvents } from '../events';
import type { FlagChangeSubscriptionOptions } from './evaluation';

/**
 * Determines if a flag should be re-evaluated based on a list of changed flags.
 * If flagsChanged is undefined or empty, we assume all flags may have changed.
 * @param {string} flagKey - The flag key to check
 * @param {string[]} [flagsChanged] - List of changed flag keys
 * @returns {boolean} Whether the flag should be re-evaluated
 */
function shouldEvaluateFlag(flagKey: string, flagsChanged?: string[]): boolean {
  return !flagsChanged || flagsChanged.includes(flagKey);
}

export class EvaluationDetailsWithSubscription<T extends FlagValue> implements EvaluationDetails<T> {
  private _details: EvaluationDetails<T>;
  private readonly _flagKey: string;
  private readonly _defaultValue: T;
  private readonly _flagType: FlagValueType;
  private readonly _options?: FlagChangeSubscriptionOptions;

  constructor(
    private readonly client: Client,
    flagKey: string,
    defaultValue: T,
    flagType: FlagValueType,
    initialDetails: EvaluationDetails<T>,
    options?: FlagChangeSubscriptionOptions,
  ) {
    this._details = initialDetails;
    this._flagKey = flagKey;
    this._defaultValue = defaultValue;
    this._flagType = flagType;
    this._options = options;
  }

  get flagKey(): string {
    return this._details.flagKey;
  }

  get value(): T {
    return this._details.value;
  }

  get variant(): string | undefined {
    return this._details.variant;
  }

  get flagMetadata(): Readonly<Record<string, string | number | boolean>> {
    return this._details.flagMetadata;
  }

  get reason(): string | undefined {
    return this._details.reason;
  }

  get errorCode(): ErrorCode | undefined {
    return this._details.errorCode;
  }

  get errorMessage(): string | undefined {
    return this._details.errorMessage;
  }

  /**
   * Subscribes to value changes for this flag.
   * The callback is invoked whenever the flag value changes due to context changes
   * or provider configuration changes (based on the provided options).
   * @param {Function} callback - Function called when flag value changes, receives new and old evaluation details
   * @param {FlagChangeSubscriptionOptions} [options] - Optional settings to control which events trigger the callback.
   *                Defaults to listening to both context changes and configuration changes.
   * @returns {Function} Unsubscribe function to remove the listeners
   */
  onChanged(
    callback: (newDetails: EvaluationDetails<T>, oldDetails: EvaluationDetails<T>) => void,
    options?: FlagChangeSubscriptionOptions,
  ): () => void {
    const updateOnContextChanged = options?.updateOnContextChanged ?? true;
    const updateOnConfigurationChanged = options?.updateOnConfigurationChanged ?? true;

    const evaluateAndCallback = () => {
      const oldDetails = { ...this._details };
      let newDetails: EvaluationDetails<T>;

      switch (this._flagType) {
        case 'boolean':
          newDetails = this.client.getBooleanDetails(
            this._flagKey,
            this._defaultValue as boolean,
            this._options,
          ) as EvaluationDetails<T>;
          break;
        case 'string':
          newDetails = this.client.getStringDetails(
            this._flagKey,
            this._defaultValue as string,
            this._options,
          ) as EvaluationDetails<T>;
          break;
        case 'number':
          newDetails = this.client.getNumberDetails(
            this._flagKey,
            this._defaultValue as number,
            this._options,
          ) as EvaluationDetails<T>;
          break;
        case 'object':
          newDetails = this.client.getObjectDetails(
            this._flagKey,
            this._defaultValue as JsonValue,
            this._options,
          ) as EvaluationDetails<T>;
          break;
        default:
          return;
      }

      this._details = newDetails;
      callback(newDetails, oldDetails);
    };

    const contextChangedHandler = () => {
      evaluateAndCallback();
    };

    const configurationChangedHandler: EventHandler = (eventDetails) => {
      const flagsChanged = (eventDetails as { flagsChanged?: string[] } | undefined)?.flagsChanged;
      if (shouldEvaluateFlag(this._flagKey, flagsChanged)) {
        evaluateAndCallback();
      }
    };

    if (updateOnContextChanged) {
      this.client.addHandler(ProviderEvents.ContextChanged, contextChangedHandler);
    }

    if (updateOnConfigurationChanged) {
      this.client.addHandler(ProviderEvents.ConfigurationChanged, configurationChangedHandler);
    }

    return () => {
      if (updateOnContextChanged) {
        this.client.removeHandler(ProviderEvents.ContextChanged, contextChangedHandler);
      }
      if (updateOnConfigurationChanged) {
        this.client.removeHandler(ProviderEvents.ConfigurationChanged, configurationChangedHandler);
      }
    };
  }
}
