import {
  EvaluationContext,
  FlagNotFoundError,
  FlagValueType,
  GeneralError,
  JsonValue,
  Logger,
  OpenFeatureError,
  OpenFeatureEventEmitter,
  ProviderEvents,
  ResolutionDetails,
  StandardResolutionReasons,
  TypeMismatchError
} from '@openfeature/core';
import { Provider } from '../provider';
import { Flag, FlagConfiguration } from './flag-configuration';
import { VariantFoundError } from './variant-not-found-error';

/**
 * A simple OpenFeature provider intended for demos and as a test stub.
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
