import type { EvaluationDetails, FlagValue } from '@openfeature/web-sdk';
import { StandardResolutionReasons } from '@openfeature/web-sdk';
import type { FlagQuery } from '../query';

// FlagQuery implementation, do not export
export class HookFlagQuery<T extends FlagValue = FlagValue> implements FlagQuery {
  constructor(private _details: EvaluationDetails<T>) {}

  get details() {
    return this._details;
  }

  get value() {
    return this._details?.value;
  }

  get variant() {
    return this._details.variant;
  }

  get flagMetadata() {
    return this._details.flagMetadata;
  }

  get reason() {
    return this._details.reason;
  }

  get isError() {
    return !!this._details?.errorCode || this._details.reason == StandardResolutionReasons.ERROR;
  }

  get errorCode() {
    return this._details?.errorCode;
  }

  get errorMessage() {
    return this._details?.errorMessage;
  }

  get isAuthoritative() {
    return (
      !this.isError &&
      this._details.reason != StandardResolutionReasons.STALE &&
      this._details.reason != StandardResolutionReasons.DISABLED
    );
  }

  get type() {
    return typeof this._details.value;
  }
}
