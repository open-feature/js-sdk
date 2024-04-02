import {
  Client,
  EvaluationDetails,
  FlagEvaluationOptions,
  FlagValue,
  JsonValue,
  ProviderEvents,
  ProviderStatus,
  StandardResolutionReasons,
} from '@openfeature/web-sdk';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { useOpenFeatureClient } from '../provider';
import { FlagQuery } from '../query';

type ReactFlagEvaluationOptions = {
  /**
   * Suspend flag evaluations while the provider is not ready.
   * Set to false if you don't want to show suspense fallbacks until the provider is initialized.
   * Defaults to true.
   */
  suspendUntilReady?: boolean;
  /**
   * Suspend flag evaluations while the provider's context is being reconciled.
   * Set to true if you want to show suspense fallbacks while flags are re-evaluated after context changes.
   * Defaults to false.
   */
  suspendWhileReconciling?: boolean;
  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  updateOnConfigurationChanged?: boolean;
  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  updateOnContextChanged?: boolean;
} & FlagEvaluationOptions;

const DEFAULT_OPTIONS: ReactFlagEvaluationOptions = {
  updateOnContextChanged: true,
  updateOnConfigurationChanged: true,
  suspendUntilReady: true,
  suspendWhileReconciling: false,
};

enum SuspendState {
  Pending,
  Success,
  Error,
}

// just used for casting, etc, but don't use for return values because the name isn't as clear
type ConstrainedFlagQuery<T> = FlagQuery<
  T extends boolean
    ? boolean
    : T extends number
      ? number
      : T extends string
        ? string
        : T extends JsonValue
          ? T
          : JsonValue
>;

/**
 * Evaluates a feature flag generically, returning an react-flavored queryable object.
 * The resolver method to use is based on the type of the defaultValue.
 * For type-specific hooks, use {@link useBooleanFlagValue}, {@link useBooleanFlagDetails} and equivalents.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @template {FlagValue} T A optional generic argument constraining the default.
 * @param {T} defaultValue the default value; used to determine what resolved type should be used.
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { FlagQuery } a queryable object containing useful information about the flag.
 */
export function useFlag<T extends FlagValue = FlagValue>(
  flagKey: string,
  defaultValue: T,
  options?: ReactFlagEvaluationOptions,
): FlagQuery<
T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : T extends JsonValue
        ? T
        : JsonValue
> {
  // use the default value to determine the resolver to call
  const query =
    typeof defaultValue === 'boolean'
      ? new HookFlagQuery<boolean>(useBooleanFlagDetails(flagKey, defaultValue, options))
      : typeof defaultValue === 'number'
        ? new HookFlagQuery<number>(useNumberFlagDetails(flagKey, defaultValue, options))
        : typeof defaultValue === 'string'
          ? new HookFlagQuery<string>(useStringFlagDetails(flagKey, defaultValue, options))
          : new HookFlagQuery<JsonValue>(useObjectFlagDetails(flagKey, defaultValue, options));
  // TS sees this as HookFlagQuery<JsonValue>, because the compiler isn't aware of the `typeof` checks above.
  return query as unknown as ConstrainedFlagQuery<T>;
}

/**
 * Evaluates a feature flag, returning a boolean.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @param {boolean} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useBooleanFlagValue(
  flagKey: string,
  defaultValue: boolean,
  options?: ReactFlagEvaluationOptions,
): boolean {
  return useBooleanFlagDetails(flagKey, defaultValue, options).value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @param {boolean} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<boolean>} a EvaluationDetails object for this evaluation
 */
export function useBooleanFlagDetails(
  flagKey: string,
  defaultValue: boolean,
  options?: ReactFlagEvaluationOptions,
): EvaluationDetails<boolean> {
  return attachHandlersAndResolve(
    flagKey,
    defaultValue,
    (client) => {
      return client.getBooleanDetails;
    },
    options,
  );
}

/**
 * Evaluates a feature flag, returning a string.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @template {string} [T=string] A optional generic argument constraining the string
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useStringFlagValue<T extends string = string>(
  flagKey: string,
  defaultValue: T,
  options?: ReactFlagEvaluationOptions,
): string {
  return useStringFlagDetails(flagKey, defaultValue, options).value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @template {string} [T=string] A optional generic argument constraining the string
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<string>} a EvaluationDetails object for this evaluation
 */
export function useStringFlagDetails<T extends string = string>(
  flagKey: string,
  defaultValue: T,
  options?: ReactFlagEvaluationOptions,
): EvaluationDetails<string> {
  return attachHandlersAndResolve(
    flagKey,
    defaultValue,
    (client) => {
      return client.getStringDetails<T>;
    },
    options,
  );
}

/**
 * Evaluates a feature flag, returning a number.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @template {number} [T=number] A optional generic argument constraining the number
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useNumberFlagValue<T extends number = number>(
  flagKey: string,
  defaultValue: T,
  options?: ReactFlagEvaluationOptions,
): number {
  return useNumberFlagDetails(flagKey, defaultValue, options).value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @template {number} [T=number] A optional generic argument constraining the number
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<number>} a EvaluationDetails object for this evaluation
 */
export function useNumberFlagDetails<T extends number = number>(
  flagKey: string,
  defaultValue: T,
  options?: ReactFlagEvaluationOptions,
): EvaluationDetails<number> {
  return attachHandlersAndResolve(
    flagKey,
    defaultValue,
    (client) => {
      return client.getNumberDetails<T>;
    },
    options,
  );
}

/**
 * Evaluates a feature flag, returning an object.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @template {JsonValue} [T=JsonValue] A optional generic argument describing the structure
 * @param {T} defaultValue the default value
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { boolean} a EvaluationDetails object for this evaluation
 */
export function useObjectFlagValue<T extends JsonValue = JsonValue>(
  flagKey: string,
  defaultValue: T,
  options?: ReactFlagEvaluationOptions,
): T {
  return useObjectFlagDetails<T>(flagKey, defaultValue, options).value;
}

/**
 * Evaluates a feature flag, returning evaluation details.
 * By default, components will re-render when the flag value changes.
 * For a generic hook returning a queryable interface, see {@link useFlag}.
 * @param {string} flagKey the flag identifier
 * @param {T} defaultValue the default value
 * @template {JsonValue} [T=JsonValue] A optional generic argument describing the structure
 * @param {ReactFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<T>} a EvaluationDetails object for this evaluation
 */
export function useObjectFlagDetails<T extends JsonValue = JsonValue>(
  flagKey: string,
  defaultValue: T,
  options?: ReactFlagEvaluationOptions,
): EvaluationDetails<T> {
  return attachHandlersAndResolve(
    flagKey,
    defaultValue,
    (client) => {
      return client.getObjectDetails<T>;
    },
    options,
  );
}

function attachHandlersAndResolve<T extends FlagValue>(
  flagKey: string,
  defaultValue: T,
  resolver: (client: Client) => (flagKey: string, defaultValue: T) => EvaluationDetails<T>,
  options?: ReactFlagEvaluationOptions,
): EvaluationDetails<T> {
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [, updateState] = useState<object | undefined>();
  const client = useOpenFeatureClient();
  const forceUpdate = () => {
    updateState({});
  };
  const suspendRef = () => {
    suspend(
      client,
      updateState,
      ProviderEvents.ContextChanged,
      ProviderEvents.ConfigurationChanged,
      ProviderEvents.Ready,
    );
  };

  useEffect(() => {
    if (client.providerStatus === ProviderStatus.NOT_READY) {
      // update when the provider is ready
      client.addHandler(ProviderEvents.Ready, forceUpdate);
      if (defaultedOptions.suspendUntilReady) {
        suspend(client, updateState, ProviderEvents.Ready);
      }
    }

    if (defaultedOptions.updateOnContextChanged) {
      // update when the context changes
      client.addHandler(ProviderEvents.ContextChanged, forceUpdate);
      if (defaultedOptions.suspendWhileReconciling) {
        client.addHandler(ProviderEvents.Reconciling, suspendRef);
      }
    }
    return () => {
      // cleanup the handlers
      client.removeHandler(ProviderEvents.Ready, forceUpdate);
      client.removeHandler(ProviderEvents.ContextChanged, forceUpdate);
      client.removeHandler(ProviderEvents.Reconciling, suspendRef);
    };
  }, []);

  useEffect(() => {
    if (defaultedOptions.updateOnConfigurationChanged) {
      // update when the provider configuration changes
      client.addHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    }
    return () => {
      // cleanup the handlers
      client.removeHandler(ProviderEvents.ConfigurationChanged, forceUpdate);
    };
  }, []);

  return resolver(client).call(client, flagKey, defaultValue);
}

/**
 * Suspend function. If this runs, components using the calling hook will be suspended.
 * @param {Client} client the OpenFeature client
 * @param {Function} updateState the state update function
 * @param {ProviderEvents[]} resumeEvents list of events which will resume the suspend
 */
function suspend(
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
 * @param {Promise<T>} promise to wrap
 * @template T flag type
 * @returns {Function} suspense-compliant lambda
 */
function suspenseWrapper<T>(promise: Promise<T>) {
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

// FlagQuery implementation, do not export
class HookFlagQuery<T extends FlagValue = FlagValue> implements FlagQuery {
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
