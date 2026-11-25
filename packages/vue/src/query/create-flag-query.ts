import type { EvaluationDetails, FlagValue } from '@openfeature/web-sdk';
import { StandardResolutionReasons } from '@openfeature/web-sdk';
import type { ShallowRef } from 'vue';
import { shallowReactive } from 'vue';
import type { AwaitableFlagQuery, FlagQuery } from './query';

function toQuery<T extends FlagValue>(details: EvaluationDetails<T>): FlagQuery<T> {
  const isError = !!details.errorCode || details.reason === StandardResolutionReasons.ERROR;

  return {
    details,
    value: details.value,
    variant: details.variant,
    flagMetadata: details.flagMetadata,
    reason: details.reason,
    isError,
    errorCode: details.errorCode,
    errorMessage: details.errorMessage,
    isAuthoritative:
      !isError &&
      details.reason !== StandardResolutionReasons.STALE &&
      details.reason !== StandardResolutionReasons.DISABLED,
    type: typeof details.value,
  };
}

export function createFlagQuery<T extends FlagValue>(
  detailsRef: ShallowRef<EvaluationDetails<T>>,
  settled: Promise<EvaluationDetails<T>>,
): AwaitableFlagQuery<T> {
  const query = shallowReactive({
    get details() {
      return detailsRef.value;
    },
    get value() {
      return detailsRef.value.value;
    },
    get variant() {
      return detailsRef.value.variant;
    },
    get flagMetadata() {
      return detailsRef.value.flagMetadata;
    },
    get reason() {
      return detailsRef.value.reason;
    },
    get isError() {
      return toQuery(detailsRef.value).isError;
    },
    get errorCode() {
      return detailsRef.value.errorCode;
    },
    get errorMessage() {
      return detailsRef.value.errorMessage;
    },
    get isAuthoritative() {
      return toQuery(detailsRef.value).isAuthoritative;
    },
    get type() {
      return typeof detailsRef.value.value;
    },
  });
  const promise = settled.then(toQuery);

  Object.defineProperty(query, 'then', {
    configurable: true,
    enumerable: false,
    value: promise.then.bind(promise),
  });

  return query as unknown as AwaitableFlagQuery<T>;
}
