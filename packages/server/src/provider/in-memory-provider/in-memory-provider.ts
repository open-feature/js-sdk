import type { EvaluationContext, FlagValueType, JsonValue, Logger, ResolutionDetails } from '@openfeature/core';
import {
  FlagNotFoundError,
  GeneralError,
  OpenFeatureError,
  StandardResolutionReasons,
  TypeMismatchError,
} from '@openfeature/core';
import type { Provider } from '../provider';
import type { Flag, FlagConfiguration, FlagVariants } from './flag-configuration';
import { VariantFoundError } from './variant-not-found-error';
import { OpenFeatureEventEmitter, ProviderEvents } from '../..';

/**
 * A simple OpenFeature provider intended for demos and as a test stub.
 * @deprecated Use {@link TypedInMemoryProvider} for type-safe flag configuration.
 */
export class InMemoryProvider implements Provider {
  public readonly events = new OpenFeatureEventEmitter();
  public readonly runsOn = 'server';
  readonly metadata = {
    name: 'in-memory',
  } as const;
  private _flagConfiguration: FlagConfiguration;

  constructor(flagConfiguration: FlagConfiguration = {}) {
    this._flagConfiguration = { ...flagConfiguration };
  }

  /**
   * Overwrites the configured flags.
   * @param { FlagConfiguration } flagConfiguration new flag configuration
   */
  putConfiguration(flagConfiguration: FlagConfiguration) {
    const flagsChanged = Object.entries(flagConfiguration)
      .filter(([key, value]) => this._flagConfiguration[key] !== value)
      .map(([key]) => key);

    this._flagConfiguration = { ...flagConfiguration };
    this.events.emit(ProviderEvents.ConfigurationChanged, { flagsChanged });
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<boolean>> {
    return this.resolveFlagWithReason<boolean>(flagKey, defaultValue, context, logger);
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<number>> {
    return this.resolveFlagWithReason<number>(flagKey, defaultValue, context, logger);
  }

  async resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<string>> {
    return this.resolveFlagWithReason<string>(flagKey, defaultValue, context, logger);
  }

  async resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<T>> {
    return this.resolveFlagWithReason<T>(flagKey, defaultValue, context, logger);
  }

  private async resolveFlagWithReason<T extends JsonValue | FlagValueType>(
    flagKey: string,
    defaultValue: T,
    ctx?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<T>> {
    try {
      const resolutionResult = this.lookupFlagValue(flagKey, defaultValue, ctx, logger);

      if (typeof resolutionResult?.value != typeof defaultValue) {
        throw new TypeMismatchError();
      }

      return resolutionResult;
    } catch (error: unknown) {
      if (!(error instanceof OpenFeatureError)) {
        throw new GeneralError((error as Error)?.message || 'unknown error');
      }
      throw error;
    }
  }

  private lookupFlagValue<T extends JsonValue | FlagValueType>(
    flagKey: string,
    defaultValue: T,
    ctx?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<T> {
    if (!(flagKey in this._flagConfiguration)) {
      const message = `no flag found with key ${flagKey}`;
      logger?.debug(message);
      throw new FlagNotFoundError(message);
    }
    const flagSpec: Flag = this._flagConfiguration[flagKey];

    if (flagSpec.disabled) {
      return { value: defaultValue, reason: StandardResolutionReasons.DISABLED };
    }

    const isContextEval = ctx && flagSpec?.contextEvaluator;
    const variant = isContextEval ? flagSpec.contextEvaluator?.(ctx) : flagSpec.defaultVariant;

    const value = variant && flagSpec?.variants[variant];

    if (value === undefined) {
      const message = `no value associated with variant ${variant}`;
      logger?.error(message);
      throw new VariantFoundError(message);
    }

    return {
      value: value as T,
      ...(variant && { variant }),
      reason: isContextEval ? StandardResolutionReasons.TARGETING_MATCH : StandardResolutionReasons.STATIC,
    };
  }
}

/**
 * A simple OpenFeature provider intended for demos and as a test stub.
 * @example
 * ```
 * const provider = new TypedInMemoryProvider({
 *   'my-flag': {
 *     variants: { on: true, off: false },
 *     defaultVariant: 'on',
 *     contextEvaluator: (ctx) => ctx?.user?.id === '123' ? 'on' : 'off',
 *     disabled: false,
 *   },
 * });
 *
 * const flags = {
 *   'my-flag': {
 *     variants: { on: true, off: false },
 *     defaultVariant: 'on',
 *     contextEvaluator: (ctx) => ctx?.user?.id === '123' ? 'on' : 'off',
 *     disabled: false,
 *   },
 * } as const; // 'as const' needed to preserve the `defaultVariant` narrow literal type rather than `string`
 * const provider = new TypedInMemoryProvider(flags);
 * ```
 */
export class TypedInMemoryProvider<
  T extends Record<string, FlagVariants<string>> = Record<string, FlagVariants<string>>,
> extends InMemoryProvider {
  constructor(flagConfiguration: FlagConfiguration<T> = {} as FlagConfiguration<T>) {
    super(flagConfiguration);
  }

  /**
   * Overwrites the configured flags.
   * @param { FlagConfiguration } flagConfiguration new flag configuration
   * @example
   * ```
   * provider.putConfiguration({
   *   'my-flag': {
   *     variants: { on: true, off: false },
   *     defaultVariant: 'on',
   *     contextEvaluator: (ctx) => ctx?.user?.id === '123' ? 'on' : 'off',
   *     disabled: false,
   *   },
   * });
   *
   * const flags = {
   *   'my-flag': {
   *     variants: { on: true, off: false },
   *     defaultVariant: 'on',
   *     contextEvaluator: (ctx) => ctx?.user?.id === '123' ? 'on' : 'off',
   *     disabled: false,
   *   },
   * } as const; // 'as const' needed to preserve the `defaultVariant` narrow literal type rather than `string`
   * provider.putConfiguration(flags);
   * ```
   */
  override putConfiguration<U extends Record<string, FlagVariants<string>> = Record<string, FlagVariants<string>>>(
    flagConfiguration: FlagConfiguration<U>,
  ) {
    super.putConfiguration(flagConfiguration);
  }
}

/**
 * The variants object for a flag in the {@link TypedInMemoryProvider}, containing all possible variants and their associated values.
 *
 * Can be used in combination with {@link InMemoryFlagConfiguration} to preserve type-safety when extending the provider class.
 * @example
 * ```
 * export class CustomInMemoryProvider<
 *   T extends Record<string, InMemoryFlagVariants<string>> = Record<string, InMemoryFlagVariants<string>>,
 * > extends TypedInMemoryProvider<T> {
 *   constructor(flagConfiguration: InMemoryFlagConfiguration<T>) {
 *     super(flagConfiguration);
 *     // custom logic ...
 *   }
 *
 *   override putConfiguration<
 *     U extends Record<string, InMemoryFlagVariants<string>> = Record<string, InMemoryFlagVariants<string>>,
 *   >(flagConfiguration: InMemoryFlagConfiguration<U>) {
 *     super.putConfiguration(flagConfiguration);
 *     // custom logic ...
 *   }
 * }
 * ```
 */
export type InMemoryFlagVariants<T extends string> = FlagVariants<T>;

/**
 * The configuration object for the {@link TypedInMemoryProvider}, containing all flags and their specifications.
 *
 * Can be used in combination with {@link InMemoryFlagVariants} to preserve type-safety when extending the provider class.
 *
 * The generic ensures that the keys of the `variants` object in each flag specification are consistent with the `defaultVariant` and the return type of `contextEvaluator`.
 * @example
 * ```
 * export class CustomInMemoryProvider<
 *   T extends Record<string, InMemoryFlagVariants<string>> = Record<string, InMemoryFlagVariants<string>>,
 * > extends TypedInMemoryProvider<T> {
 *   constructor(flagConfiguration: InMemoryFlagConfiguration<T>) {
 *     super(flagConfiguration);
 *     // custom logic ...
 *   }
 *
 *   override putConfiguration<
 *     U extends Record<string, InMemoryFlagVariants<string>> = Record<string, InMemoryFlagVariants<string>>,
 *   >(flagConfiguration: InMemoryFlagConfiguration<U>) {
 *     super.putConfiguration(flagConfiguration);
 *     // custom logic ...
 *   }
 * }
 * ```
 */
export type InMemoryFlagConfiguration<
  T extends Record<string, FlagVariants<string>> = Record<string, FlagVariants<string>>,
> = FlagConfiguration<T>;
