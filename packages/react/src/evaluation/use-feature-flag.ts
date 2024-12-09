import type {
  Client,
  ClientProviderEvents,
  EvaluationDetails,
  EventHandler,
  FlagEvaluationOptions,
  FlagValue,
  JsonValue} from '@openfeature/web-sdk';
import {
  ProviderEvents,
  ProviderStatus,
} from '@openfeature/web-sdk';
import { useEffect, useRef, useState } from 'react';
import type { ReactFlagEvaluationOptions} from '../common';
import { DEFAULT_OPTIONS, isEqual, normalizeOptions, suspendUntilReady, useProviderOptions } from '../common';
import { useOpenFeatureClient } from '../provider/use-open-feature-client';
import { useOpenFeatureClientStatus } from '../provider/use-open-feature-client-status';
import type { FlagQuery } from '../query';
import { HookFlagQuery } from './hook-flag-query';

// This type is a bit wild-looking, but I think we need it.
// We have to use the conditional, because otherwise useFlag('key', false) would return false, not boolean (too constrained).
// We have a duplicate for the hook return below, this one is just used for casting because the name isn't as clear
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

// suspense options removed for the useSuspenseFlag hooks
type NoSuspenseOptions = Omit<ReactFlagEvaluationOptions, 'suspend' | 'suspendUntilReady' | 'suspendWhileReconciling'>;

/**
 * Evaluates a feature flag generically, returning an react-flavored queryable object.
 * The resolver method to use is based on the type of the defaultValue.
 * For type-specific hooks, use {@link useBooleanFlagValue}, {@link useBooleanFlagDetails} and equivalents.
 * By default, components will re-render when the flag value changes.
 * @param {string} flagKey the flag identifier
 * @template {FlagValue} T A optional generic argument constraining the default.
 * @param {T} defaultValue the default value; used to determine what resolved type should be used.
 * @param {ReactFlagEvaluationOptions} options for this evaluation
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

// alias to the return value of useFlag, used to keep useSuspenseFlag consistent
type UseFlagReturn<T extends FlagValue> = ReturnType<typeof useFlag<T>>;

/**
 * Equivalent to {@link useFlag} with `options: { suspend: true }`
 * @experimental Suspense is an experimental feature subject to change in future versions.
 * @param {string} flagKey the flag identifier
 * @template {FlagValue} T A optional generic argument constraining the default.
 * @param {T} defaultValue the default value; used to determine what resolved type should be used.
 * @param {NoSuspenseOptions} options for this evaluation
 * @returns { UseFlagReturn<T> } a queryable object containing useful information about the flag.
 */
export function useSuspenseFlag<T extends FlagValue = FlagValue>(
  flagKey: string,
  defaultValue: T,
  options?: NoSuspenseOptions,
): UseFlagReturn<T> {
  return useFlag(flagKey, defaultValue, { ...options, suspendUntilReady: true, suspendWhileReconciling: true });
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

// determines if a flag should be re-evaluated based on a list of changed flags
function shouldEvaluateFlag(flagKey: string, flagsChanged?: string[]): boolean {
  // if flagsChange is missing entirely, we don't know what to re-render
  return !flagsChanged || flagsChanged.includes(flagKey);
}

function attachHandlersAndResolve<T extends FlagValue>(
  flagKey: string,
  defaultValue: T,
  resolver: (
    client: Client,
  ) => (flagKey: string, defaultValue: T, options?: FlagEvaluationOptions) => EvaluationDetails<T>,
  options?: ReactFlagEvaluationOptions,
): EvaluationDetails<T> {
  // highest priority > evaluation hook options > provider options > default options > lowest priority
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...useProviderOptions(), ...normalizeOptions(options) };
  const client = useOpenFeatureClient();
  const status = useOpenFeatureClientStatus();

  // suspense
  if (defaultedOptions.suspendUntilReady && status === ProviderStatus.NOT_READY) {
    suspendUntilReady(client);
  }

  if (defaultedOptions.suspendWhileReconciling && status === ProviderStatus.RECONCILING) {
    suspendUntilReady(client);
  }

  const [evaluationDetails, setEvaluationDetails] = useState<EvaluationDetails<T>>(
    resolver(client).call(client, flagKey, defaultValue, options),
  );

  // Maintain a mutable reference to the evaluation details to have a up-to-date reference in the handlers.
  const evaluationDetailsRef = useRef<EvaluationDetails<T>>(evaluationDetails);
  useEffect(() => {
    evaluationDetailsRef.current = evaluationDetails;
  }, [evaluationDetails]);

  const updateEvaluationDetailsCallback = () => {
    const updatedEvaluationDetails = resolver(client).call(client, flagKey, defaultValue, options);

    /**
     * Avoid re-rendering if the value hasn't changed. We could expose a means
     * to define a custom comparison function if users require a more
     * sophisticated comparison in the future.
     */
    if (!isEqual(updatedEvaluationDetails.value, evaluationDetailsRef.current.value)) {
      setEvaluationDetails(updatedEvaluationDetails);
    }
  };

  const configurationChangeCallback: EventHandler<ClientProviderEvents.ConfigurationChanged> = (eventDetails) => {
    if (shouldEvaluateFlag(flagKey, eventDetails?.flagsChanged)) {
      updateEvaluationDetailsCallback();
    }
  };

  useEffect(() => {
    if (status === ProviderStatus.NOT_READY) {
      // update when the provider is ready
      client.addHandler(ProviderEvents.Ready, updateEvaluationDetailsCallback);
    }

    if (defaultedOptions.updateOnContextChanged) {
      // update when the context changes
      client.addHandler(ProviderEvents.ContextChanged, updateEvaluationDetailsCallback);
    }
    return () => {
      // cleanup the handlers
      client.removeHandler(ProviderEvents.Ready, updateEvaluationDetailsCallback);
      client.removeHandler(ProviderEvents.ContextChanged, updateEvaluationDetailsCallback);
    };
  }, []);

  useEffect(() => {
    if (defaultedOptions.updateOnConfigurationChanged) {
      // update when the provider configuration changes
      client.addHandler(ProviderEvents.ConfigurationChanged, configurationChangeCallback);
    }
    return () => {
      // cleanup the handlers
      client.removeHandler(ProviderEvents.ConfigurationChanged, configurationChangeCallback);
    };
  }, []);

  return evaluationDetails;
}
