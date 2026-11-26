import type {
  BooleanFlagKey,
  Client,
  ClientProviderEvents,
  ConstrainedFlagKey,
  EvaluationDetails,
  EventHandler,
  FlagEvaluationOptions,
  FlagValue,
  FlagValueType,
  JsonValue,
  NumberFlagKey,
  ObjectFlagKey,
  StringFlagKey,
} from '@openfeature/web-sdk';
import { DefaultLogger, GeneralError, MapHookData, ProviderFatalError } from '@openfeature/core';
import { OpenFeature, ProviderEvents, ProviderStatus, StandardResolutionReasons } from '@openfeature/web-sdk';
import type { MaybeRefOrGetter } from 'vue';
import { computed, onScopeDispose, shallowRef, toValue, watch, watchEffect } from 'vue';
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
  flagValueType: FlagValueType;
  options?: VueFlagEvaluationOptions;
  normalizedOptions: NormalizedOptions;
};

type UseFlagDetailsResult<T extends FlagValue> = {
  details: AwaitableRef<EvaluationDetails<T>>;
  getSettled: () => Promise<EvaluationDetails<T>>;
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

function createErrorDetails<T extends FlagValue>(
  inputs: EvaluationInputs<T>,
  message?: string,
  runHooks = true,
): EvaluationDetails<T> {
  const error =
    inputs.client.providerStatus === ProviderStatus.FATAL ? new ProviderFatalError(message) : new GeneralError(message);
  const details: EvaluationDetails<T> = {
    flagKey: inputs.flagKey,
    flagMetadata: Object.freeze({}),
    value: inputs.defaultValue,
    reason: StandardResolutionReasons.ERROR,
    errorCode: error.code,
    errorMessage: error.message,
  };

  if (!runHooks) {
    return details;
  }

  const domain = inputs.client.metadata.domain;
  const provider = OpenFeature.getProvider(domain);
  const hooks = [
    ...OpenFeature.getHooks(),
    ...inputs.client.getHooks(),
    ...(inputs.options?.hooks ?? []),
    ...(provider.hooks ?? []),
  ];
  const logger = new DefaultLogger();
  const context = Object.freeze({ ...OpenFeature.getContext(domain) });
  const hookHints = Object.freeze(inputs.options?.hookHints ?? {});
  const hookContexts = hooks.map(() =>
    Object.freeze({
      flagKey: inputs.flagKey,
      defaultValue: inputs.defaultValue,
      flagValueType: inputs.flagValueType,
      context,
      clientMetadata: inputs.client.metadata,
      providerMetadata: provider.metadata,
      logger,
      hookData: new MapHookData(),
    }),
  );
  let hookError: unknown = error;

  try {
    for (const [index, hook] of hooks.entries()) {
      hook.before?.(hookContexts[index], hookHints);
    }
  } catch (caughtError) {
    hookError = caughtError;
  }

  for (const [index, hook] of [...hooks].reverse().entries()) {
    try {
      hook.error?.(hookContexts[hooks.length - index - 1], hookError, hookHints);
    } catch (caughtError) {
      logger.error('Unhandled error in error hook:', caughtError);
    }
  }

  for (const [index, hook] of [...hooks].reverse().entries()) {
    try {
      hook.finally?.(hookContexts[hooks.length - index - 1], details, hookHints);
    } catch (caughtError) {
      logger.error('Unhandled error in finally hook:', caughtError);
    }
  }

  return details;
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
  flagValueType: FlagValueType,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): UseFlagDetailsResult<T> {
  const clientRef = useClientRef();
  const context = useOpenFeatureContext();
  const readInputs = (): EvaluationInputs<T> => {
    const providerOptions = context.value.options;
    const evaluationOptions = toValue(options);
    const hooks = [...(providerOptions.hooks ?? []), ...(evaluationOptions?.hooks ?? [])];
    const hookHints = evaluationOptions?.hookHints ?? providerOptions.hookHints;

    return {
      client: clientRef.value,
      flagKey: toValue(flagKey),
      defaultValue: toValue(defaultValue),
      resolver,
      flagValueType,
      options: hooks.length || hookHints ? { hooks, hookHints } : undefined,
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
  let cancelReadiness: (() => void) | undefined;
  let readinessGeneration = 0;
  let currentSettled: Promise<EvaluationDetails<T>> | undefined;
  let disposed = false;

  onScopeDispose(() => {
    disposed = true;
    readinessGeneration++;
    activeController?.abort();
    cancelReadiness?.();
    cancelReadiness = undefined;
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

  const startReadiness = (client: Client) => {
    const generation = ++readinessGeneration;
    cancelReadiness?.();
    cancelReadiness = undefined;
    const generationInputs = { ...latestInputs };

    if (!shouldWaitForProvider(client)) {
      currentSettled = undefined;
      return generation;
    }

    const readiness = waitForProviderReady(
      client,
      () => {
        updateEvaluation();
        return latestDetails;
      },
      (message) =>
        createErrorDetails(generation === readinessGeneration ? latestInputs : generationInputs, message, false),
      (cleanup) => {
        cancelReadiness = cleanup;
      },
    );
    currentSettled = readiness
      .catch(() => latestDetails)
      .then((resolvedDetails) => {
        if (!disposed && generation === readinessGeneration) {
          setDetails(resolvedDetails);
          currentSettled = undefined;
        }

        return resolvedDetails;
      });

    return generation;
  };

  watch(
    clientRef,
    (client, _previousClient, onCleanup) => {
      const generation = startReadiness(client);
      onCleanup(() => {
        if (generation === readinessGeneration) {
          readinessGeneration++;
          cancelReadiness?.();
          cancelReadiness = undefined;
        }
      });
    },
    { immediate: true },
  );

  const getSettled = () => currentSettled ?? Promise.resolve(latestDetails);

  return { details: makeAwaitableRef(details, getSettled), getSettled };
}

function useFlagValueInternal<T extends FlagValue>(
  flagKey: MaybeRefOrGetter<string>,
  defaultValue: MaybeRefOrGetter<T>,
  resolver: EvaluationResolver<T>,
  flagValueType: FlagValueType,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
) {
  const result = useFlagDetailsInternal(flagKey, defaultValue, resolver, flagValueType, options);
  const value = computed(() => result.details.value.value);
  const getSettled = () => result.getSettled().then((details) => details.value);

  return { value: makeAwaitableRef<T>(value, getSettled), getSettled };
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
      'boolean',
      options,
    );
    return createFlagQuery(result.details, result.getSettled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
  }

  if (typeof currentDefault === 'number') {
    const result = useFlagDetailsInternal<number>(
      flagKey,
      defaultRef as MaybeRefOrGetter<number>,
      (client) => client.getNumberDetails,
      'number',
      options,
    );
    return createFlagQuery(result.details, result.getSettled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
  }

  if (typeof currentDefault === 'string') {
    const result = useFlagDetailsInternal<string>(
      flagKey,
      defaultRef as MaybeRefOrGetter<string>,
      (client) => client.getStringDetails,
      'string',
      options,
    );
    return createFlagQuery(result.details, result.getSettled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
  }

  const result = useFlagDetailsInternal<JsonValue>(
    flagKey,
    defaultRef as MaybeRefOrGetter<JsonValue>,
    (client) => client.getObjectDetails,
    'object',
    options,
  );
  return createFlagQuery(result.details, result.getSettled) as AwaitableFlagQuery<ConstrainedFlagQuery<T>>;
}

export function useBooleanFlagValue(
  flagKey: MaybeRefOrGetter<BooleanFlagKey>,
  defaultValue: MaybeRefOrGetter<boolean>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<boolean> {
  return useFlagValueInternal<boolean>(flagKey, defaultValue, (client) => client.getBooleanDetails, 'boolean', options)
    .value;
}

export function useBooleanFlagDetails(
  flagKey: MaybeRefOrGetter<BooleanFlagKey>,
  defaultValue: MaybeRefOrGetter<boolean>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<boolean>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getBooleanDetails, 'boolean', options)
    .details;
}

export function useStringFlagValue<T extends string = string>(
  flagKey: MaybeRefOrGetter<StringFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<T> {
  return useFlagValueInternal<T>(flagKey, defaultValue, (client) => client.getStringDetails<T>, 'string', options)
    .value;
}

export function useStringFlagDetails<T extends string = string>(
  flagKey: MaybeRefOrGetter<StringFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<T>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getStringDetails<T>, 'string', options)
    .details;
}

export function useNumberFlagValue<T extends number = number>(
  flagKey: MaybeRefOrGetter<NumberFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<T> {
  return useFlagValueInternal<T>(flagKey, defaultValue, (client) => client.getNumberDetails<T>, 'number', options)
    .value;
}

export function useNumberFlagDetails<T extends number = number>(
  flagKey: MaybeRefOrGetter<NumberFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<T>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getNumberDetails<T>, 'number', options)
    .details;
}

export function useObjectFlagValue<T extends JsonValue = JsonValue>(
  flagKey: MaybeRefOrGetter<ObjectFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<T> {
  return useFlagValueInternal<T>(flagKey, defaultValue, (client) => client.getObjectDetails<T>, 'object', options)
    .value;
}

export function useObjectFlagDetails<T extends JsonValue = JsonValue>(
  flagKey: MaybeRefOrGetter<ObjectFlagKey>,
  defaultValue: MaybeRefOrGetter<T>,
  options?: MaybeRefOrGetter<VueFlagEvaluationOptions>,
): AwaitableRef<EvaluationDetails<T>> {
  return useFlagDetailsInternal(flagKey, defaultValue, (client) => client.getObjectDetails<T>, 'object', options)
    .details;
}
