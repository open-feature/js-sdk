import type { EvaluationDetails, FlagValue } from '@openfeature/web-sdk';
import { StandardResolutionReasons } from '@openfeature/web-sdk';
import type { FlagQuery } from '../query';
import type { ReactiveEvaluationDetails } from './reactive-evaluation';
import { toEvaluationDetails } from './reactive-evaluation';

/**
 * FlagQuery implementation backed by reactive evaluation details.
 * Each getter reads a single evaluation, so derived properties are consistent.
 * @internal
 */
export class ReactiveFlagQuery<T extends FlagValue = FlagValue> implements FlagQuery<T> {
  private readonly _details: EvaluationDetails<T>;

  constructor(private readonly evaluation: ReactiveEvaluationDetails<T>) {
    this._details = toEvaluationDetails(evaluation);
  }

  get details() {
    return this._details;
  }

  get value() {
    return this.evaluation.details.value;
  }

  get variant() {
    return this.evaluation.details.variant;
  }

  get flagMetadata() {
    return this.evaluation.details.flagMetadata;
  }

  get reason() {
    return this.evaluation.details.reason;
  }

  get isError() {
    return isError(this.evaluation.details);
  }

  get errorCode() {
    return this.evaluation.details.errorCode;
  }

  get errorMessage() {
    return this.evaluation.details.errorMessage;
  }

  get isAuthoritative() {
    const details = this.evaluation.details;
    return (
      !isError(details) &&
      details.reason != StandardResolutionReasons.STALE &&
      details.reason != StandardResolutionReasons.DISABLED
    );
  }

  get type() {
    return typeof this.evaluation.details.value;
  }
}

function isError(details: EvaluationDetails<FlagValue>): boolean {
  return !!details.errorCode || details.reason == StandardResolutionReasons.ERROR;
}
