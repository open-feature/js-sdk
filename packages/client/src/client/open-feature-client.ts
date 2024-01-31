import {
  ClientMetadata,
  ErrorCode,
  EvaluationContext,
  EvaluationDetails,
  EventHandler,
  FlagValue,
  FlagValueType,
  HookContext,
  JsonValue,
  Logger,
  OpenFeatureError,
  ProviderStatus,
  ResolutionDetails,
  SafeLogger,
  StandardResolutionReasons,
  statusMatchesEvent
} from '@openfeature/core';
import { FlagEvaluationOptions } from '../evaluation';
import { ProviderEvents } from '../events';
import { InternalEventEmitter } from '../events/internal/internal-event-emitter';
import { Hook } from '../hooks';
import { OpenFeature } from '../open-feature';
import { Provider } from '../provider';
import { Client } from './client';

type OpenFeatureClientOptions = {
  /**
   * @deprecated Use `domain` instead.
   */
  name?: string;
  domain?: string;
  version?: string;
};

export class OpenFeatureClient implements Client {
  private _hooks: Hook[] = [];
  private _clientLogger?: Logger;

  constructor(
    // functions are passed here to make sure that these values are always up to date,
    // and so we don't have to make these public properties on the API class.
    private readonly providerAccessor: () => Provider,
    private readonly emitterAccessor: () => InternalEventEmitter,
    private readonly globalLogger: () => Logger,
    private readonly options: OpenFeatureClientOptions,
  ) {}

  get metadata(): ClientMetadata {
    return {
      // Use domain if name is not provided
      name: this.options.name ?? this.options.domain,
      domain: this.options.domain,
      version: this.options.version,
      providerMetadata: this.providerAccessor().metadata,
    };
  }

  get providerStatus(): ProviderStatus {
    return this.providerAccessor()?.status || ProviderStatus.READY;
  }

  addHandler(eventType: ProviderEvents, handler: EventHandler): void {
    this.emitterAccessor().addHandler(eventType, handler);
    const shouldRunNow = statusMatchesEvent(eventType, this._provider.status);

    if (shouldRunNow) {
      // run immediately, we're in the matching state
      try {
        handler({
          clientName: this.metadata.name,
          domain: this.metadata.domain,
          providerName: this._provider.metadata.name,
        });
      } catch (err) {
        this._logger?.error('Error running event handler:', err);
      }
    }
  }

  removeHandler(notificationType: ProviderEvents, handler: EventHandler): void {
    this.emitterAccessor().removeHandler(notificationType, handler);
  }

  getHandlers(eventType: ProviderEvents) {
    return this.emitterAccessor().getHandlers(eventType);
  }

  setLogger(logger: Logger): this {
    this._clientLogger = new SafeLogger(logger);
    return this;
  }

  addHooks(...hooks: Hook[]): this {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  getHooks(): Hook[] {
    return this._hooks;
  }

  clearHooks(): this {
    this._hooks = [];
    return this;
  }

  getBooleanValue(flagKey: string, defaultValue: boolean, options?: FlagEvaluationOptions): boolean {
    return this.getBooleanDetails(flagKey, defaultValue, options).value;
  }

  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<boolean> {
    return this.evaluate<boolean>(flagKey, this._provider.resolveBooleanEvaluation, defaultValue, 'boolean', options);
  }

  getStringValue<T extends string = string>(flagKey: string, defaultValue: T, options?: FlagEvaluationOptions): T {
    return this.getStringDetails<T>(flagKey, defaultValue, options).value;
  }

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted string generic argument.
      this._provider.resolveStringEvaluation as () => EvaluationDetails<T>,
      defaultValue,
      'string',
      options,
    );
  }

  getNumberValue<T extends number = number>(flagKey: string, defaultValue: T, options?: FlagEvaluationOptions): T {
    return this.getNumberDetails(flagKey, defaultValue, options).value;
  }

  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted number generic argument.
      this._provider.resolveNumberEvaluation as () => EvaluationDetails<T>,
      defaultValue,
      'number',
      options,
    );
  }

  getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): T {
    return this.getObjectDetails(flagKey, defaultValue, options).value;
  }

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T> {
    return this.evaluate<T>(flagKey, this._provider.resolveObjectEvaluation, defaultValue, 'object', options);
  }

  private evaluate<T extends FlagValue>(
    flagKey: string,
    resolver: (flagKey: string, defaultValue: T, context: EvaluationContext, logger: Logger) => ResolutionDetails<T>,
    defaultValue: T,
    flagType: FlagValueType,
    options: FlagEvaluationOptions = {},
  ): EvaluationDetails<T> {
    // merge global, client, and evaluation context

    const allHooks = [
      ...OpenFeature.getHooks(),
      ...this.getHooks(),
      ...(options.hooks || []),
      ...(this._provider.hooks || []),
    ];
    const allHooksReversed = [...allHooks].reverse();

    const context = {
      ...OpenFeature.getContext(this?.options?.domain),
    };

    // this reference cannot change during the course of evaluation
    // it may be used as a key in WeakMaps
    const hookContext: Readonly<HookContext> = {
      flagKey,
      defaultValue,
      flagValueType: flagType,
      clientMetadata: this.metadata,
      providerMetadata: OpenFeature.providerMetadata,
      context,
      logger: this._logger,
    };

    try {
      this.beforeHooks(allHooks, hookContext, options);

      // run the referenced resolver, binding the provider.
      const resolution = resolver.call(this._provider, flagKey, defaultValue, context, this._logger);

      const evaluationDetails = {
        ...resolution,
        flagMetadata: Object.freeze(resolution.flagMetadata ?? {}),
        flagKey,
      };

      this.afterHooks(allHooksReversed, hookContext, evaluationDetails, options);

      return evaluationDetails;
    } catch (err: unknown) {
      const errorMessage: string = (err as Error)?.message;
      const errorCode: ErrorCode = (err as OpenFeatureError)?.code || ErrorCode.GENERAL;

      this.errorHooks(allHooksReversed, hookContext, err, options);

      return {
        errorCode,
        errorMessage,
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        flagMetadata: Object.freeze({}),
        flagKey,
      };
    } finally {
      this.finallyHooks(allHooksReversed, hookContext, options);
    }
  }

  private beforeHooks(hooks: Hook[], hookContext: HookContext, options: FlagEvaluationOptions) {
    Object.freeze(hookContext);
    Object.freeze(hookContext.context);

    for (const hook of hooks) {
      hook?.before?.(hookContext, Object.freeze(options.hookHints));
    }
  }

  private afterHooks(
    hooks: Hook[],
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions,
  ) {
    // run "after" hooks sequentially
    for (const hook of hooks) {
      hook?.after?.(hookContext, evaluationDetails, options.hookHints);
    }
  }

  private errorHooks(hooks: Hook[], hookContext: HookContext, err: unknown, options: FlagEvaluationOptions) {
    // run "error" hooks sequentially
    for (const hook of hooks) {
      try {
        hook?.error?.(hookContext, err, options.hookHints);
      } catch (err) {
        this._logger.error(`Unhandled error during 'error' hook: ${err}`);
        if (err instanceof Error) {
          this._logger.error(err.stack);
        }
        this._logger.error((err as Error)?.stack);
      }
    }
  }

  private finallyHooks(hooks: Hook[], hookContext: HookContext, options: FlagEvaluationOptions) {
    // run "finally" hooks sequentially
    for (const hook of hooks) {
      try {
        hook?.finally?.(hookContext, options.hookHints);
      } catch (err) {
        this._logger.error(`Unhandled error during 'finally' hook: ${err}`);
        if (err instanceof Error) {
          this._logger.error(err.stack);
        }
        this._logger.error((err as Error)?.stack);
      }
    }
  }

  private get _provider(): Provider {
    return this.providerAccessor();
  }

  private get _logger() {
    return this._clientLogger || this.globalLogger();
  }
}
