import { Client, ProviderEvents } from '@openfeature/web-sdk';
import { Dispatch, SetStateAction } from 'react';

enum SuspendState {
  Pending,
  Success,
  Error,
}

/**
 * Suspend function. If this runs, components using the calling hook will be suspended.
 * DO NOT EXPORT PUBLICLY 
 * @internal
 * @param {Client} client the OpenFeature client
 * @param {Function} updateState the state update function
 * @param {ProviderEvents[]} resumeEvents list of events which will resume the suspend
 */
export function suspend(
  client: Client,
  updateState: Dispatch<SetStateAction<object | undefined>>,
  ...resumeEvents: ProviderEvents[]
) {
  let suspendResolver: () => void;

  const suspendPromise = new Promise<void>((resolve) => {
    suspendResolver = () => {
      resolve();
      resumeEvents.forEach((e) => {
        client.removeHandler(e, suspendResolver); // remove handlers once they've run
      });
      client.removeHandler(ProviderEvents.Error, suspendResolver);
    };
    resumeEvents.forEach((e) => {
      client.addHandler(e, suspendResolver);
    });
    client.addHandler(ProviderEvents.Error, suspendResolver); // we never want to throw, resolve with errors - we may make this configurable later
  });
  updateState(suspenseWrapper(suspendPromise));
}

/**
 * Promise wrapper that throws unresolved promises to support React suspense.
 * DO NOT EXPORT PUBLICLY
 * @internal
 * @param {Promise<T>} promise to wrap
 * @template T flag type
 * @returns {Function} suspense-compliant lambda
 */
export function suspenseWrapper<T>(promise: Promise<T>) {
  let status: SuspendState = SuspendState.Pending;
  let result: T;

  const suspended = promise
    .then((value) => {
      status = SuspendState.Success;
      result = value;
    })
    .catch((error) => {
      status = SuspendState.Error;
      result = error;
    });

  return () => {
    switch (status) {
      case SuspendState.Pending:
        throw suspended;
      case SuspendState.Success:
        return result;
      case SuspendState.Error:
        throw result;
      default:
        throw new Error('Suspending promise is in an unknown state.');
    }
  };
}
