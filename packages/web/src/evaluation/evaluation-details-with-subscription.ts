import type { EvaluationDetails, ErrorCode, FlagValue, FlagValueType, JsonValue } from '@openfeature/core';
import type { Client } from '../client';
import { ProviderEvents } from '../events';
import type { FlagEvaluationOptions } from './evaluation';

export class EvaluationDetailsWithSubscription<T extends FlagValue> implements EvaluationDetails<T> {
  private _details: EvaluationDetails<T>;
  private readonly _flagKey: string;
  private readonly _defaultValue: T;
  private readonly _flagType: FlagValueType;
  private readonly _options?: FlagEvaluationOptions;

  constructor(
    private readonly client: Client,
    flagKey: string,
    defaultValue: T,
    flagType: FlagValueType,
    initialDetails: EvaluationDetails<T>,
    options?: FlagEvaluationOptions,
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

  onContextChanged(callback: (newDetails: EvaluationDetails<T>, oldDetails: EvaluationDetails<T>) => void): () => void {
    const handler = () => {
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

    this.client.addHandler(ProviderEvents.ContextChanged, handler);

    return () => {
      this.client.removeHandler(ProviderEvents.ContextChanged, handler);
    };
  }
}
