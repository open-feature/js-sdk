import type { EvaluationContext, FlagValueType, JsonValue, Logger, ResolutionDetails } from '@openfeature/core';
import {
  FlagNotFoundError,
  GeneralError,
  OpenFeatureError,
  StandardResolutionReasons,
  TypeMismatchError,
} from '@openfeature/core';
import type { Provider } from '../provider';
import { OpenFeatureEventEmitter, ProviderEvents } from '../../events';
import type { FlagConfiguration, Flag, FlagVariants } from './flag-configuration';
import { VariantNotFoundError } from './variant-not-found-error';

/**
 * A simple OpenFeature provider intended for demos and as a test stub.
 */
export class InMemoryProvider<
  T extends Record<string, FlagVariants<string>> = Record<string, FlagVariants<string>>,
> implements Provider {
  public readonly events = new OpenFeatureEventEmitter();
  public readonly runsOn = 'client';
  readonly metadata = {
    name: 'in-memory',
  } as const;
  private _flagConfiguration: FlagConfiguration;
  private _context: EvaluationContext | undefined;

  constructor(flagConfiguration: FlagConfiguration<T> = {} as FlagConfiguration<T>) {
    this._flagConfiguration = { ...flagConfiguration };
  }

  /**
   * Overwrites the configured flags.
   * @param { FlagConfiguration } flagConfiguration new flag configuration
   */
  async putConfiguration<U extends Record<string, FlagVariants<string>> = Record<string, FlagVariants<string>>>(
    flagConfiguration: FlagConfiguration<U>,
  ) {
    try {
      const flagsChanged = Object.entries({ ...flagConfiguration, ...this._flagConfiguration }).map(([key]) => key);

      this._flagConfiguration = { ...flagConfiguration };
      this.events.emit(ProviderEvents.ConfigurationChanged, { flagsChanged });
    } catch (err) {
      this.events.emit(ProviderEvents.Error);
      throw err;
    }
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<boolean> {
    return this.resolveAndCheckFlag<boolean>(flagKey, defaultValue, context || this._context, logger);
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<number> {
    return this.resolveAndCheckFlag<number>(flagKey, defaultValue, context || this._context, logger);
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<string> {
    return this.resolveAndCheckFlag<string>(flagKey, defaultValue, context || this._context, logger);
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<T> {
    return this.resolveAndCheckFlag<T>(flagKey, defaultValue, context || this._context, logger);
  }

  private resolveAndCheckFlag<T extends JsonValue | FlagValueType>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<T> {
    if (!(flagKey in this._flagConfiguration)) {
      const message = `no flag found with key ${flagKey}`;
      logger?.debug(message);
      throw new FlagNotFoundError(message);
    }

    if (this._flagConfiguration[flagKey].disabled) {
      return { value: defaultValue, reason: StandardResolutionReasons.DISABLED };
    }

    const resolvedFlag = this.resolveFlagWithReason(flagKey, context) as ResolutionDetails<T>;

    if (resolvedFlag.value === undefined) {
      const message = `no value associated with variant provided for ${flagKey} found`;
      logger?.error(message);
      throw new VariantNotFoundError(message);
    }

    if (typeof resolvedFlag.value != typeof defaultValue) {
      throw new TypeMismatchError();
    }

    return resolvedFlag;
  }

  private resolveFlagWithReason<T extends JsonValue | FlagValueType>(
    flagKey: string,
    ctx?: EvaluationContext,
  ): ResolutionDetails<T> {
    try {
      const resolutionResult = this.lookupFlagValue<T>(flagKey, ctx);

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
    ctx?: EvaluationContext,
  ): ResolutionDetails<T> {
    const flagSpec: Flag = this._flagConfiguration[flagKey];

    const isContextEval = ctx && flagSpec?.contextEvaluator;
    const variant = isContextEval ? flagSpec.contextEvaluator?.(ctx) : flagSpec.defaultVariant;

    const value = variant && flagSpec?.variants[variant];

    const reason = isContextEval ? StandardResolutionReasons.TARGETING_MATCH : StandardResolutionReasons.STATIC;

    return {
      value: value as T,
      ...(variant && { variant }),
      reason,
    };
  }
}
