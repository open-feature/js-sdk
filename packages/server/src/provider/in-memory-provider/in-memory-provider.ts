import {
  ErrorCode,
  EvaluationContext,
  FlagNotFoundError,
  FlagValueType,
  GeneralError,
  JsonValue,
  Logger,
  OpenFeatureEventEmitter,
  ProviderEvents,
  ResolutionDetails,
  StandardResolutionReasons,
  TypeMismatchError,
} from '@openfeature/shared';
import { FlagConfiguration, Flag } from './flag-configuration';
import { Provider } from '../provider';

/**
 * A simple OpenFeature provider, intended for simple demos and as a test stub.
 */
export class InMemoryProvider implements Provider {
  public readonly events = new OpenFeatureEventEmitter();
  public readonly runsOn = 'server';
  readonly metadata = {
    name: 'In-Memory Provider',
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
    return Promise.resolve(this.resolveFlagWithReason<boolean>(flagKey, defaultValue, context, logger));
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<number>> {
    return Promise.resolve(this.resolveFlagWithReason<number>(flagKey, defaultValue, context, logger));
  }

  async resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<string>> {
    return Promise.resolve(this.resolveFlagWithReason<string>(flagKey, defaultValue, context, logger));
  }

  async resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    logger?: Logger,
  ): Promise<ResolutionDetails<T>> {
    return Promise.resolve(this.resolveFlagWithReason<T>(flagKey, defaultValue, context, logger));
  }

  private resolveFlagWithReason<T extends JsonValue | FlagValueType>(
    flagKey: string,
    defaultValue: T,
    ctx?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<T> {
    try {
      const resolutionResult = this.lookupFlagValue(flagKey, defaultValue, ctx, logger);

      if (typeof resolutionResult?.value != typeof defaultValue) {
        throw new TypeMismatchError();
      }

      return resolutionResult;
    } catch (error: unknown) {
      let errorCode;
      switch (true) {
        case error instanceof TypeMismatchError:
          errorCode = ErrorCode.TYPE_MISMATCH;
          break;
        case error instanceof FlagNotFoundError:
          errorCode = ErrorCode.FLAG_NOT_FOUND;
          break;
        case error instanceof GeneralError:
          errorCode = ErrorCode.PARSE_ERROR;
          break;
      }

      return {
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        errorCode,
      };
    }
  }

  private lookupFlagValue<T>(
    flagKey: string,
    defaultValue: T,
    ctx?: EvaluationContext,
    logger?: Logger,
  ): ResolutionDetails<any> {
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
      throw new GeneralError(message);
    }

    return {
      value,
      ...(variant && { variant }),
      reason: isContextEval ? StandardResolutionReasons.TARGETING_MATCH : StandardResolutionReasons.STATIC,
    };
  }
}
