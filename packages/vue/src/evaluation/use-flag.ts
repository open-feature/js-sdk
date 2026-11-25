import type {
  BooleanFlagKey,
  Client,
  ClientProviderEvents,
  ConstrainedFlagKey,
  EvaluationDetails,
  EventHandler,
  FlagEvaluationOptions,
  FlagValue,
  JsonValue,
  NumberFlagKey,
  ObjectFlagKey,
  StringFlagKey,
} from '@openfeature/web-sdk';
import { ErrorCode, ProviderEvents, ProviderStatus, StandardResolutionReasons } from '@openfeature/web-sdk';
import type { MaybeRefOrGetter } from 'vue';
import { computed, onScopeDispose, shallowRef, toValue, watchEffect } from 'vue';
import type { AwaitableRef } from '../internal/awaitable-ref';
import { isEqual } from '../internal/is-equal';
import { makeAwaitableRef } from '../internal/make-awaitable-ref';
import { shouldWaitForProvider, waitForProviderReady } from '../internal/wait-for-provider-ready';
import type { NormalizedOptions, VueFlagEvaluationOptions } from '../options';
import { DEFAULT_OPTIONS, normalizeOptions } from '../options';
import { useClientRef } from '../provider/use-open-feature-client';
import { createFlagQuery } from '../query/create-flag-query';
import type { AwaitableFlagQuery } from '../query/query';
import { useOpenFeatureContext } from '../internal/context';

type EvaluationResolver<T extends FlagValue> = (
  client: Client,
) => (flagKey: string, defaultValue: T, options?: FlagEvaluationOptions) => EvaluationDetails<T>;

type EvaluationInputs<T extends FlagValue> = {
  client: Client;
  flagKey: string;
  defaultValue: T;
  resolver: EvaluationResolver<T>;
  options?: VueFlagEvaluationOptions;
  normalizedOptions: NormalizedOptions;
};

type UseFlagDetailsResult<T extends FlagValue> = {
  details: AwaitableRef<EvaluationDetails<T>>;
  settled: Promise<EvaluationDetails<T>>;
};

type ConstrainedFlagQuery<T> = T extends boolean
  ? boolean
  : T extends number
    ? number
    : T extends string
      ? string
      : T extends JsonValue
        ? T
        : JsonValue;

function createErrorDetails<T extends FlagValue>(inputs: EvaluationInputs<T>, message?: string): EvaluationDetails<T> {
  return {
    flagKey: inputs.flagKey,
    flagMetadata: Object.freeze({}),
    value: inputs.defaultValue,
    reason: StandardResolutionReasons.ERROR,
    errorCode: inputs.client.providerStatus === ProviderStatus.FATAL ? ErrorCode.PROVIDER_FATAL : ErrorCode.GENERAL,
    errorMessage: message,
  };
}

function evaluateInputs<T extends FlagValue>(inputs: EvaluationInputs<T>): EvaluationDetails<T> {
  if (inputs.client.providerStatus === ProviderStatus.ERROR || inputs.client.providerStatus === ProviderStatus.FATAL) {
    return createErrorDetails(inputs);
  }

  return inputs.resolver(inputs.client).call(inputs.client, inputs.flagKey, inputs.defaultValue, inputs.options);
}

function useFlagDetailsInternal<T extends FlagValue>(
  flagKey: MaybeRefOrGetter<string>,
  defaultValue: MaybeRefOrGetter<T>,
  resolver: EvaluationResolver<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): UseFlagDetailsResult<T> {
  const clientRef = useClientRef();
  const context = useOpenFeatureContext();
  const readInputs = (): EvaluationInputs<T> => {
    const providerOptions = context.value.options;
    const evaluationOptions = toValue(options);

    return {
      client: clientRef.value,
      flagKey: toValue(flagKey),
      defaultValue: toValue(defaultValue),
      resolver,
      options: evaluationOptions,
      normalizedOptions: {
        ...DEFAULT_OPTIONS,
        ...normalizeOptions(providerOptions),
        ...normalizeOptions(evaluationOptions),
      },
    };
  };

  let latestInputs = readInputs();
  let latestDetails = evaluateInputs(latestInputs);
  const details = shallowRef(latestDetails);
  let activeController: AbortController | undefined;
  let disposed = false;
  const cleanups: Array<() => void> = [];

  onScopeDispose(() => {
    disposed = true;
    activeController?.abort();
    cleanups.splice(0).forEach((cleanup) => cleanup());
  });

  const setDetails = (updatedDetails: EvaluationDetails<T>) => {
    if (!isEqual(updatedDetails, latestDetails)) {
      latestDetails = updatedDetails;
      details.value = updatedDetails;
    }
  };
  const updateEvaluation = () => setDetails(evaluateInputs(latestInputs));

  let firstEffect = true;
  watchEffect((onCleanup) => {
    latestInputs = readInputs();

    if (firstEffect) {
      firstEffect = false;
    } else {
      updateEvaluation();
    }

    const controller = new AbortController();
    activeController = controller;
    const client = latestInputs.client;
    const configurationChangedCallback: EventHandler<ClientProviderEvents.ConfigurationChanged> = (eventDetails) => {
      const flagsChanged = eventDetails?.flagsChanged;
      if (!flagsChanged || flagsChanged.includes(latestInputs.flagKey)) {
        updateEvaluation();
      }
    };
    const errorCallback: EventHandler<ClientProviderEvents.Error> = (eventDetails) => {
      setDetails(createErrorDetails(latestInputs, eventDetails?.message));
    };

    client.addHandler(ProviderEvents.Error, errorCallback, { signal: controller.signal });
    client.addHandler(ProviderEvents.Stale, updateEvaluation, { signal: controller.signal });

    if (client.providerStatus === ProviderStatus.READY) {
      let initialReadyNotification = true;
      client.addHandler(
        ProviderEvents.Ready,
        () => {
          if (initialReadyNotification) {
            initialReadyNotification = false;
            return;
          }
          updateEvaluation();
        },
        { signal: controller.signal },
      );
    } else {
      client.addHandler(ProviderEvents.Ready, updateEvaluation, { signal: controller.signal });
    }

    if (latestInputs.normalizedOptions.updateOnContextChanged) {
      client.addHandler(ProviderEvents.ContextChanged, updateEvaluation, { signal: controller.signal });
    }

    if (latestInputs.normalizedOptions.updateOnConfigurationChanged) {
      client.addHandler(ProviderEvents.ConfigurationChanged, configurationChangedCallback, {
        signal: controller.signal,
      });
    }

    onCleanup(() => {
      controller.abort();
      if (activeController === controller) {
        activeController = undefined;
      }
    });
  });

  const initialClient = clientRef.value;
  const shouldWait = shouldWaitForProvider(initialClient);
  const readiness = shouldWait
    ? waitForProviderReady(
        initialClient,
        () => {
          updateEvaluation();
          return latestDetails;
        },
        (message) => createErrorDetails(latestInputs, message),
        (cleanup) => cleanups.push(cleanup),
      )
    : Promise.resolve(latestDetails);
  const settled = (
    shouldWait
      ? readiness.then((resolvedDetails) => {
          if (!disposed) {
            latestDetails = resolvedDetails;
            details.value = resolvedDetails;
          }

          return resolvedDetails;
        })
      : readiness
  ).catch(() => latestDetails);

  return { details: makeAwaitableRef(details, settled), settled };
}

function useFlagValueInternal<T extends FlagValue>(
  flagKey: MaybeRefOrGetter<string>,
  defaultValue: MaybeRefOrGetter<T>,
  resolver: EvaluationResolver<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
) {
  const result = useFlagDetailsInternal(flagKey, defaultValue, resolver, options);
  const value = computed(() => result.details.value.value);
  const settled = result.settled.then((details) => details.value);

  return { value: makeAwaitableRef<T>(value, settled), settled };
}

export function useFlag<T extends FlagValue = FlagValue>(
  flagKey: MaybeRefOrGetter<ConstrainedFlagKey<T>>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableFlagQuery<ConstrainedFlagQuery<T>> {
  const defaultRef = computed(() => toValue(defaultValue));
  const currentDefault = defaultRef.value;

  if (typeof currentDefault === 'boolean') {
    const result = useFlagDetailsInternal<boolean>(
      flagKey,
      defaultRef as MaybeRefOrGetter<boolean>,
      (client) => client.getBooleanDetails,
      options,
    );
    return createFlagQuery(result.details, result.settled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
  }

  if (typeof currentDefault === 'number') {
    const result = useFlagDetailsInternal<number>(
      flagKey,
      defaultRef as MaybeRefOrGetter<number>,
      (client) => client.getNumberDetails,
      options,
    );
    return createFlagQuery(result.details, result.settled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
  }

  if (typeof currentDefault === 'string') {
    const result = useFlagDetailsInternal<string>(
      flagKey,
      defaultRef as MaybeRefOrGetter<string>,
      (client) => client.getStringDetails,
      options,
    );
    return createFlagQuery(result.details, result.settled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
  }

  const result = useFlagDetailsInternal<JsonValue>(
    flagKey,
    defaultRef as MaybeRefOrGetter<JsonValue>,
    (client) => client.getObjectDetails,
    options,
  );
  return createFlagQuery(result.details, result.settled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
}

export function useBooleanFlagValue(
  flagKey: MaybeRefOrGetter<BooleanFlagKey>,
  defaultValue: MaybeRefOrGetter<boolean>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<boolean> {
  return useFlagValueInternal<boolean>(flagKey, defaultValue, (client) => client.getBooleanDetails, options).value;
}

export function useBooleanFlagDetails(
  flagKey: MaybeRefOrGetter<BooleanFlagKey>,
  defaultValue: MaybeRefOrGetter<boolean>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<boolean>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getBooleanDetails, options).details;
}

export function useStringFlagValue<T extends string = string>(
  flagKey: MaybeRefOrGetter<StringFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<T> {
  return useFlagValueInternal<T>(flagKey, defaultValue, (client) => client.getStringDetails<T>, options).value;
}

export function useStringFlagDetails<T extends string = string>(
  flagKey: MaybeRefOrGetter<StringFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<T>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getStringDetails<T>, options).details;
}

export function useNumberFlagValue<T extends number = number>(
  flagKey: MaybeRefOrGetter<NumberFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<T> {
  return useFlagValueInternal<T>(flagKey, defaultValue, (client) => client.getNumberDetails<T>, options).value;
}

export function useNumberFlagDetails<T extends number = number>(
  flagKey: MaybeRefOrGetter<NumberFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<T>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getNumberDetails<T>, options).details;
}

export function useObjectFlagValue<T extends JsonValue = JsonValue>(
  flagKey: MaybeRefOrGetter<ObjectFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<T> {
  return useFlagValueInternal<T>(flagKey, defaultValue, (client) => client.getObjectDetails<T>, options).value;
}

export function useObjectFlagDetails<T extends JsonValue = JsonValue>(
  flagKey: MaybeRefOrGetter<ObjectFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<T>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getObjectDetails<T>, options).details;
}
