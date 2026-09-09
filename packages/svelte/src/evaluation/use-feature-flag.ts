import type {
  BooleanFlagKey,
  ConstrainedFlagKey,
  EvaluationDetails,
  FlagValue,
  JsonValue,
  NumberFlagKey,
  ObjectFlagKey,
  StringFlagKey,
} from '@openfeature/web-sdk';
import { DEFAULT_OPTIONS, normalizeOptions } from '../internal';
import { resolveClient, resolveScopeOptions } from '../internal/client';
import { ReactiveFlagQuery } from '../internal/flag-query';
import type { EvaluationResolver } from '../internal/reactive-evaluation';
import { ReactiveEvaluationDetails } from '../internal/reactive-evaluation';
import type { SvelteFlagEvaluationOptions } from '../options';
import type { FlagQuery } from '../query';
import type { ReactiveValue } from '../reactive';

// This type is a bit wild-looking, but I think we need it.
// We have to use the conditional, because otherwise useFlag('key', false) would return false, not boolean (too constrained).
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
 * Evaluates a feature flag generically, returning a reactive, queryable object.
 * The resolver method to use is based on the type of the defaultValue.
 * For type-specific functions, use {@link useBooleanFlagValue}, {@link useBooleanFlagDetails} and equivalents.
 * By default, templates and effects reading the result update when the flag value changes.
 * @param {ConstrainedFlagKey<T>} flagKey the flag identifier
 * @template {FlagValue} T A optional generic argument constraining the default.
 * @param {T} defaultValue the default value; used to determine what resolved type should be used.
 * @param {SvelteFlagEvaluationOptions} options for this evaluation
 * @returns { FlagQuery } a reactive, queryable object containing useful information about the flag.
 */
export function useFlag<T extends FlagValue = FlagValue>(
  flagKey: ConstrainedFlagKey<T>,
  defaultValue: T,
  options?: SvelteFlagEvaluationOptions,
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
      ? new ReactiveFlagQuery<boolean>(useBooleanFlagDetails(flagKey, defaultValue, options))
      : typeof defaultValue === 'number'
        ? new ReactiveFlagQuery<number>(useNumberFlagDetails(flagKey, defaultValue, options))
        : typeof defaultValue === 'string'
          ? new ReactiveFlagQuery<string>(useStringFlagDetails(flagKey, defaultValue, options))
          : new ReactiveFlagQuery<JsonValue>(useObjectFlagDetails(flagKey, defaultValue, options));
  // TS sees this as ReactiveFlagQuery<JsonValue>, because the compiler isn't aware of the `typeof` checks above.
  return query as unknown as ConstrainedFlagQuery<T>;
}

/**
 * Evaluates a feature flag, returning a reactive boolean.
 * By default, templates and effects reading `current` update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {BooleanFlagKey} flagKey the flag identifier
 * @param {boolean} defaultValue the default value
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { ReactiveValue<boolean>} a reactive boolean for this evaluation
 */
export function useBooleanFlagValue(
  flagKey: BooleanFlagKey,
  defaultValue: boolean,
  options?: SvelteFlagEvaluationOptions,
): ReactiveValue<boolean> {
  return toReactiveValue(useBooleanFlagDetails(flagKey, defaultValue, options));
}

/**
 * Evaluates a feature flag, returning reactive evaluation details.
 * By default, templates and effects reading the details update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {BooleanFlagKey} flagKey the flag identifier
 * @param {boolean} defaultValue the default value
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<boolean>} a reactive EvaluationDetails object for this evaluation
 */
export function useBooleanFlagDetails(
  flagKey: BooleanFlagKey,
  defaultValue: boolean,
  options?: SvelteFlagEvaluationOptions,
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
 * Evaluates a feature flag, returning a reactive string.
 * By default, templates and effects reading `current` update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {StringFlagKey} flagKey the flag identifier
 * @template {string} [T=string] A optional generic argument constraining the string
 * @param {T} defaultValue the default value
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { ReactiveValue<string>} a reactive string for this evaluation
 */
export function useStringFlagValue<T extends string = string>(
  flagKey: StringFlagKey,
  defaultValue: T,
  options?: SvelteFlagEvaluationOptions,
): ReactiveValue<string> {
  return toReactiveValue(useStringFlagDetails(flagKey, defaultValue, options));
}

/**
 * Evaluates a feature flag, returning reactive evaluation details.
 * By default, templates and effects reading the details update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {StringFlagKey} flagKey the flag identifier
 * @template {string} [T=string] A optional generic argument constraining the string
 * @param {T} defaultValue the default value
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<string>} a reactive EvaluationDetails object for this evaluation
 */
export function useStringFlagDetails<T extends string = string>(
  flagKey: StringFlagKey,
  defaultValue: T,
  options?: SvelteFlagEvaluationOptions,
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
 * Evaluates a feature flag, returning a reactive number.
 * By default, templates and effects reading `current` update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {NumberFlagKey} flagKey the flag identifier
 * @template {number} [T=number] A optional generic argument constraining the number
 * @param {T} defaultValue the default value
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { ReactiveValue<number>} a reactive number for this evaluation
 */
export function useNumberFlagValue<T extends number = number>(
  flagKey: NumberFlagKey,
  defaultValue: T,
  options?: SvelteFlagEvaluationOptions,
): ReactiveValue<number> {
  return toReactiveValue(useNumberFlagDetails(flagKey, defaultValue, options));
}

/**
 * Evaluates a feature flag, returning reactive evaluation details.
 * By default, templates and effects reading the details update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {NumberFlagKey} flagKey the flag identifier
 * @template {number} [T=number] A optional generic argument constraining the number
 * @param {T} defaultValue the default value
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<number>} a reactive EvaluationDetails object for this evaluation
 */
export function useNumberFlagDetails<T extends number = number>(
  flagKey: NumberFlagKey,
  defaultValue: T,
  options?: SvelteFlagEvaluationOptions,
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
 * Evaluates a feature flag, returning a reactive object.
 * By default, templates and effects reading `current` update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {ObjectFlagKey} flagKey the flag identifier
 * @template {JsonValue} [T=JsonValue] A optional generic argument describing the structure
 * @param {T} defaultValue the default value
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { ReactiveValue<T>} a reactive object for this evaluation
 */
export function useObjectFlagValue<T extends JsonValue = JsonValue>(
  flagKey: ObjectFlagKey,
  defaultValue: T,
  options?: SvelteFlagEvaluationOptions,
): ReactiveValue<T> {
  return toReactiveValue(useObjectFlagDetails<T>(flagKey, defaultValue, options));
}

/**
 * Evaluates a feature flag, returning reactive evaluation details.
 * By default, templates and effects reading the details update when the flag value changes.
 * For a generic function returning a queryable interface, see {@link useFlag}.
 * @param {ObjectFlagKey} flagKey the flag identifier
 * @param {T} defaultValue the default value
 * @template {JsonValue} [T=JsonValue] A optional generic argument describing the structure
 * @param {SvelteFlagEvaluationOptions} options options for this evaluation
 * @returns { EvaluationDetails<T>} a reactive EvaluationDetails object for this evaluation
 */
export function useObjectFlagDetails<T extends JsonValue = JsonValue>(
  flagKey: ObjectFlagKey,
  defaultValue: T,
  options?: SvelteFlagEvaluationOptions,
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

function toReactiveValue<T extends FlagValue>(details: EvaluationDetails<T>): ReactiveValue<T> {
  return {
    get current() {
      return details.value;
    },
  };
}

function attachHandlersAndResolve<T extends FlagValue>(
  flagKey: string,
  defaultValue: T,
  resolver: EvaluationResolver<T>,
  options?: SvelteFlagEvaluationOptions,
): EvaluationDetails<T> {
  // highest priority > evaluation options > scope options > default options > lowest priority
  const defaultedOptions = { ...DEFAULT_OPTIONS, ...resolveScopeOptions(), ...normalizeOptions(options) };
  return new ReactiveEvaluationDetails(resolveClient(), flagKey, defaultValue, resolver, options, defaultedOptions);
}
