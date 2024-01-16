import { Client, EvaluationDetails, FlagEvaluationOptions, FlagValue, JsonValue, ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
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
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  updateOnConfigurationChanged?: boolean,
  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which 
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  updateOnContextChanged?: boolean,
} & FlagEvaluationOptions;

const DEFAULT_OPTIONS: ReactFlagEvaluationOptions = {
  updateOnContextChanged: true,
  updateOnConfigurationChanged: true,
  suspend: true,
};

enum SuspendState {
  Pending,
  Success,
  Error
}

/**
 * Evaluates a feature flag, returning a boolean.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @param {boolean} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useBooleanFlagValue(flagKey: string, defaultValue: boolean, options?: ReactFlagEvaluationOptions): boolean {
  return useBooleanFlagDetails(flagKey, defaultValue, options)?.value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @param {boolean} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<boolean>} a EvaluationDetails object for this evaluation
 */
export function useBooleanFlagDetails(flagKey: string, defaultValue: boolean, options?: ReactFlagEvaluationOptions): EvaluationDetails<boolean> {
  return attachHandlersAndResolve(flagKey, defaultValue, (client) => {
    return client.getBooleanDetails;
  },  options);
}

/**
 * Evaluates a feature flag, returning a string.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @template {string} [T=string] A optional generic argument constraining the string
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useStringFlagValue<T extends string = string>(flagKey: string, defaultValue: T, options?: ReactFlagEvaluationOptions): T {
  return useStringFlagDetails(flagKey, defaultValue, options)?.value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @template {string} [T=string] A optional generic argument constraining the string
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<string>} a EvaluationDetails object for this evaluation
 */
export function useStringFlagDetails<T extends string = string>(flagKey: string, defaultValue: T, options?: ReactFlagEvaluationOptions): EvaluationDetails<T> {
  return attachHandlersAndResolve(flagKey, defaultValue, (client) => {
    return client.getStringDetails<T>;
  },  options);
}

/**
 * Evaluates a feature flag, returning a number.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @template {number} [T=number] A optional generic argument constraining the number
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useNumberFlagValue<T extends number = number>(flagKey: string, defaultValue: T, options?: ReactFlagEvaluationOptions): T {
  return useNumberFlagDetails(flagKey, defaultValue, options)?.value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @template {number} [T=number] A optional generic argument constraining the number
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<number>} a EvaluationDetails object for this evaluation
 */
export function useNumberFlagDetails<T extends number = number>(flagKey: string, defaultValue: T, options?: ReactFlagEvaluationOptions): EvaluationDetails<T> {
  return attachHandlersAndResolve(flagKey, defaultValue, (client) => {
    return client.getNumberDetails<T>;
  },  options);
}

/**
 * Evaluates a feature flag, returning an object.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @template {JsonValue} [T=JsonValue] A optional generic argument describing the structure
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useObjectFlagValue<T extends JsonValue = JsonValue>(flagKey: string, defaultValue: T, options?: ReactFlagEvaluationOptions): T {
  return useObjectFlagDetails<T>(flagKey, defaultValue, options)?.value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @param {T} defaultValue the default value
 * @template {JsonValue} [T=JsonValue] A optional generic argument describing the structure
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<T>} a EvaluationDetails object for this evaluation
 */
export function useObjectFlagDetails<T extends JsonValue = JsonValue>(flagKey: string, defaultValue: T, options?: ReactFlagEvaluationOptions): EvaluationDetails<T> {
  return attachHandlersAndResolve(flagKey, defaultValue, (client) => {
    return client.getObjectDetails<T>;
  },  options);
}

function attachHandlersAndResolve<T extends FlagValue>(flagKey: string, defaultValue: T, resolver: (client: Client) => (flagKey: string, defaultValue: T) => EvaluationDetails<T>, options?: ReactFlagEvaluationOptions): EvaluationDetails<T> {
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [, updateState] = useState<object | undefined>();
  const forceUpdate = () => {
    updateState({});
  };
  const client = useOpenFeatureClient();

  useEffect(() => {

    if (client.providerStatus !== ProviderStatus.READY) {
      // update when the provider is ready
      client.addHandler(ProviderEvents.Ready, forceUpdate);
      if (defaultedOptions.suspend) {
        suspend(client, updateState);
      }
    }

    if (defaultedOptions.updateOnContextChanged) {
      // update when the context changes
      client.addHandler(ProviderEvents.ContextChanged, forceUpdate);
    }

    if (defaultedOptions.updateOnConfigurationChanged) {
      // update when the provider configuration changes
      client.addHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    }
    return () => {
      // cleanup the handlers (we can do this unconditionally with no impact)
      client.removeHandler(ProviderEvents.Ready, forceUpdate);
      client.removeHandler(ProviderEvents.ContextChanged, forceUpdate);
      client.removeHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    };
  }, [client]);

  return resolver(client).call(client, flagKey, defaultValue);
}

/**
 * Suspend function. If this runs, components using the calling hook will be suspended.
 * @param {Client} client the OpenFeature client
 * @param {Function} updateState the state update function
 */
function suspend(client: Client, updateState: Dispatch<SetStateAction<object | undefined>>) {
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
 * @param {Promise<T>} promise to wrap
 * @template T flag type
 * @returns {Function} suspense-compliant lambda
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