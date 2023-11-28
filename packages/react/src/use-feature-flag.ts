import { Client, EvaluationDetails, FlagEvaluationOptions, FlagValue, ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useOpenFeatureClient } from './provider';

type ReactFlagEvaluationOptions = {
  /**
   * Suspend flag evaluations while the provider is not ready.
   * Set to false if you don't want to use React Suspense API.
   * Defaults to true.
   */
  suspend?: boolean,
  /**
   * Update the component if the the provider emits a change event.
   * Set to false if you never want to update components live, even if flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  updateOnChange?: boolean,
} & FlagEvaluationOptions;

const DEFAULT_OPTIONS: ReactFlagEvaluationOptions = {
  suspend: true
};

enum SuspendState {
  Pending,
  Success,
  Error
}

export function useFeatureFlag<T extends FlagValue>(flagKey: string, defaultValue: T, options?: ReactFlagEvaluationOptions): EvaluationDetails<T> {
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [, updateState] = useState<{}>();
  const forceUpdate = () => updateState({});
  const client = useOpenFeatureClient();

  useEffect(() => {

    if (client.providerStatus !== ProviderStatus.READY) {
      client.addHandler(ProviderEvents.Ready, forceUpdate); // update the UI when the provider is ready
      if (defaultedOptions.suspend) {
        suspend(client, updateState)
      }
    }

    if (defaultedOptions.updateOnChange) {
      // update when the provider configuration changes
      client.addHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    }
    return () => {
      // cleanup the handlers
      client.removeHandler(ProviderEvents.Ready, forceUpdate);
      client.removeHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    };
  }, [client]);

  return getFlag(client, flagKey, defaultValue);
}

function getFlag<T extends FlagValue>(client: Client, flagKey: string, defaultValue: T): EvaluationDetails<T> {
  if (typeof defaultValue === 'boolean') {
    return client.getBooleanDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  } else if (typeof defaultValue === 'string') {
    return client.getStringDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  } else if (typeof defaultValue === 'number') {
    return client.getNumberDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  } else {
    return client.getObjectDetails(flagKey, defaultValue) as EvaluationDetails<T>;
  }
}

/**
 * Suspend function. If this runs, components using the calling hook will be suspended.
 * 
 * @param client the OpenFeature client
 * @param updateState the state update function
 */
function suspend(client: Client, updateState: Dispatch<SetStateAction<{}>>) {
  let suspendResolver: () => void;
  let suspendRejecter: () => void;
  const suspendPromise = new Promise<void>((resolve) => {
    suspendResolver = () => {
      resolve();
      client.removeHandler(ProviderEvents.Ready, suspendResolver); // remove handler once it's run
    };
    suspendRejecter = () => {
      resolve(); // we still resolve here, since we don't want to throw errors
      client.removeHandler(ProviderEvents.Error, suspendRejecter); // remove handler once it's run
    };
    client.addHandler(ProviderEvents.Ready, suspendResolver);
    client.addHandler(ProviderEvents.Error, suspendRejecter);
  });
  updateState(suspenseWrapper(suspendPromise));
}

/**
 * Promise wrapper that throws unresolved promises to support React suspense.
 * 
 * @param promise promise to wrap
 * @returns suspense-compliant lambda
 */
function suspenseWrapper <T>(promise: Promise<T>) {
  let status: SuspendState = SuspendState.Pending;
  let result: T;

  const suspended = promise.then(
    (value) => {
      status = SuspendState.Success;
      result = value;
    },
    (error) => {
      status = SuspendState.Error;
      result = error;
    }
  );

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
};