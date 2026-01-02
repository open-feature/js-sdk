import type { ErrorCode } from '../../evaluation';
import { GeneralError, OpenFeatureError } from '../../errors';
import type { RegisteredProvider } from './types';

export class ErrorWithCode extends OpenFeatureError {
  constructor(
    public code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export class AggregateError extends GeneralError {
  constructor(
    message: string,
    public originalErrors: { source: string; error: unknown }[],
  ) {
    super(message);
    Object.setPrototypeOf(this, AggregateError.prototype);
    this.name = 'AggregateError';
  }
}

export const constructAggregateError = (providerErrors: { error: unknown; providerName: string }[]) => {
  const errorsWithSource = providerErrors
    .map(({ providerName, error }) => {
      return { source: providerName, error };
    })
    .flat();

  // log first error in the message for convenience, but include all errors in the error object for completeness
  const firstError = errorsWithSource[0];
  const message = firstError
    ? `Provider errors occurred: ${firstError.source}: ${firstError.error}`
    : 'Provider errors occurred';

  return new AggregateError(message, errorsWithSource);
};

export const throwAggregateErrorFromPromiseResults = <TProvider>(
  result: PromiseSettledResult<unknown>[],
  providerEntries: RegisteredProvider<TProvider>[],
) => {
  const errors = result
    .map((r, i) => {
      if (r.status === 'rejected') {
        return { error: r.reason, providerName: providerEntries[i].name };
      }
      return null;
    })
    .filter((val): val is { error: unknown; providerName: string } => Boolean(val));

  if (errors.length) {
    throw constructAggregateError(errors);
  }
};
