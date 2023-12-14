import {
  EvaluationContext,
  FlagNotFoundError,
  FlagValueType,
  GeneralError,
  JsonValue,
  Logger,
  OpenFeatureError,
  ResolutionDetails,
  StandardResolutionReasons,
  TypeMismatchError,
  ProviderStatus,
} from '@openfeature/core';
import { Provider } from '../provider';
import { OpenFeatureEventEmitter, ProviderEvents } from '../../events';
import { FlagConfiguration, Flag } from './flag-configuration';
import { VariantNotFoundError } from './variant-not-found-error';

/**
 * A simple OpenFeature provider intended for demos and as a test stub.
 */
export class InMemoryProvider implements Provider {
  public readonly events = new OpenFeatureEventEmitter();
  public readonly runsOn = 'client';
  status: ProviderStatus = ProviderStatus.NOT_READY;
  readonly metadata = {
    name: 'in-memory',
  } as const;
  private _flagConfiguration: FlagConfiguration;
  private _context: EvaluationContext | undefined;

  constructor(flagConfiguration: FlagConfiguration = {}) {
    this._flagConfiguration = { ...flagConfiguration };
  }

  async initialize(context?: EvaluationContext | undefined): Promise<void> {
    try {

      for (const key in this._flagConfiguration) {
        this.resolveFlagWithReason(key, context);
      }

      this._context = context;
      // set the provider's state, but don't emit events manually;
      // the SDK does this based on the resolution/rejection of the init promise
      this.status = ProviderStatus.READY;
    } catch (error) {
      this.status = ProviderStatus.ERROR;
      throw error;
    }
  }

  /**
   * Overwrites the configured flags.
   * @param { FlagConfiguration } flagConfiguration new flag configuration
   */
  async putConfiguration(flagConfiguration: FlagConfiguration) {
    const flagsChanged = Object.entries(flagConfiguration)
      .filter(([key, value]) => this._flagConfiguration[key] !== value)
      .map(([key]) => key);

    this.status = ProviderStatus.STALE;
    this.events.emit(ProviderEvents.Stale);

    this._flagConfiguration = { ...flagConfiguration };
    this.events.emit(ProviderEvents.ConfigurationChanged, { flagsChanged });

    try {
      await this.initialize(this._context);
      // we need to emit our own events in this case, since it's not part of the init flow.
      this.events.emit(ProviderEvents.Ready);
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

  private resolveAndCheckFlag<T extends JsonValue | FlagValueType>(flagKey: string,
    defaultValue: T, context?: EvaluationContext, logger?: Logger): ResolutionDetails<T> {
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

    const evalReason = isContextEval ? StandardResolutionReasons.TARGETING_MATCH : StandardResolutionReasons.STATIC;

    const reason = this.status === ProviderStatus.STALE ? StandardResolutionReasons.CACHED : evalReason;

    return {
      value: value as T,
      ...(variant && { variant }),
      reason,
    };
  }
}
