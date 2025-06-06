import type {
  ClientMetadata,
  EvaluationContext,
  EvaluationDetails,
  EventHandler,
  FlagValue,
  FlagValueType,
  HookContext,
  JsonValue,
  Logger,
  TrackingEventDetails,
  OpenFeatureError,
  FlagMetadata,
  ResolutionDetails,
  EventOptions,
} from '@openfeature/core';
import {
  ErrorCode,
  ProviderFatalError,
  ProviderNotReadyError,
  SafeLogger,
  StandardResolutionReasons,
  instantiateErrorByErrorCode,
  statusMatchesEvent,
  DefaultHookData,
} from '@openfeature/core';
import type { FlagEvaluationOptions } from '../../evaluation';
import type { ProviderEvents } from '../../events';
import type { InternalEventEmitter } from '../../events/internal/internal-event-emitter';
import type { Hook } from '../../hooks';
import type { Provider } from '../../provider';
import { ProviderStatus } from '../../provider';
import type { Client } from './../client';

type OpenFeatureClientOptions = {
  /**
   * @deprecated Use `domain` instead.
   */
  name?: string;
  domain?: string;
  version?: string;
};

/**
 * This implementation of the {@link Client} is meant to only be instantiated by the SDK.
 * It should not be used outside the SDK and so should not be exported.
 * @internal
 */
export class OpenFeatureClient implements Client {
  private _hooks: Hook[] = [];
  private _clientLogger?: Logger;

  constructor(
    // functions are passed here to make sure that these values are always up to date,
    // and so we don't have to make these public properties on the API class.
    private readonly providerAccessor: () => Provider,
    private readonly providerStatusAccessor: () => ProviderStatus,
    private readonly emitterAccessor: () => InternalEventEmitter,
    private readonly apiContextAccessor: (domain?: string) => EvaluationContext,
    private readonly apiHooksAccessor: () => Hook[],
    private readonly globalLogger: () => Logger,
    private readonly options: OpenFeatureClientOptions,
  ) {}

  get metadata(): ClientMetadata {
    return {
      // Use domain if name is not provided
      name: this.options.domain ?? this.options.name,
      domain: this.options.domain ?? this.options.name,
      version: this.options.version,
      providerMetadata: this.providerAccessor().metadata,
    };
  }

  get providerStatus(): ProviderStatus {
    return this.providerStatusAccessor();
  }

  addHandler(eventType: ProviderEvents, handler: EventHandler, options: EventOptions): void {
    this.emitterAccessor().addHandler(eventType, handler);
    const shouldRunNow = statusMatchesEvent(eventType, this.providerStatus);

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

    if (options?.signal && typeof options.signal.addEventListener === 'function') {
      options.signal.addEventListener('abort', () => {
        this.removeHandler(eventType, handler);
      });
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

  track(occurrenceKey: string, occurrenceDetails: TrackingEventDetails = {}): void {
    try {
      this.shortCircuitIfNotReady();

      if (typeof this._provider.track === 'function') {
        // copy and freeze the context
        const frozenContext = Object.freeze({
          ...this.apiContextAccessor(this?.options?.domain),
        });
        return this._provider.track?.(occurrenceKey, frozenContext, occurrenceDetails);
      } else {
        this._logger.debug('Provider does not support the track function; will no-op.');
      }
    } catch (err) {
      this._logger.debug('Error recording tracking event.', err);
    }
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
      ...this.apiHooksAccessor(),
      ...this.getHooks(),
      ...(options.hooks || []),
      ...(this._provider.hooks || []),
    ];
    const allHooksReversed = [...allHooks].reverse();

    const context = {
      ...this.apiContextAccessor(this?.options?.domain),
    };

    // Create hook data instances for each hook
    const hookDataMap = new WeakMap<Hook, DefaultHookData>();
    for (const hook of allHooks) {
      hookDataMap.set(hook, new DefaultHookData());
    }

    // Create hook context instances for each hook (stable object references for the entire evaluation)
    // This ensures hooks can use WeakMaps with hookContext as keys across lifecycle methods
    const hookContextMap = new WeakMap<Hook, HookContext>();
    for (const hook of allHooks) {
      const hookContext: HookContext = {
        flagKey,
        defaultValue,
        flagValueType: flagType,
        clientMetadata: this.metadata,
        providerMetadata: this._provider.metadata,
        context,
        logger: this._logger,
        hookData: hookDataMap.get(hook)!,
      };
      hookContextMap.set(hook, hookContext);
    }

    // Function to get the stable hook context for a given hook
    const getHookContext = (hook: Hook) => hookContextMap.get(hook)!;

    let evaluationDetails: EvaluationDetails<T>;

    try {
      this.beforeHooks(allHooks, getHookContext, options);

      this.shortCircuitIfNotReady();

      // run the referenced resolver, binding the provider.
      const resolution = resolver.call(this._provider, flagKey, defaultValue, context, this._logger);

      const resolutionDetails = {
        ...resolution,
        flagMetadata: Object.freeze(resolution.flagMetadata ?? {}),
        flagKey,
      };

      if (resolutionDetails.errorCode) {
        const err = instantiateErrorByErrorCode(resolutionDetails.errorCode, resolutionDetails.errorMessage);
        this.errorHooks(allHooksReversed, getHookContext, err, options);
        evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err, resolutionDetails.flagMetadata);
      } else {
        this.afterHooks(allHooksReversed, getHookContext, resolutionDetails, options);
        evaluationDetails = resolutionDetails;
      }
    } catch (err: unknown) {
      this.errorHooks(allHooksReversed, getHookContext, err, options);
      evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err);
    }
    this.finallyHooks(allHooksReversed, getHookContext, evaluationDetails, options);
    return evaluationDetails;
  }

  private beforeHooks(
    hooks: Hook[], 
    getHookContext: (hook: Hook) => HookContext,
    options: FlagEvaluationOptions
  ) {
    for (const hook of hooks) {
      const hookContext = getHookContext(hook);
      Object.freeze(hookContext);
      Object.freeze(hookContext.context);
      hook?.before?.(hookContext, Object.freeze(options.hookHints));
    }
  }

  private afterHooks(
    hooks: Hook[],
    getHookContext: (hook: Hook) => HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions,
  ) {
    // run "after" hooks sequentially
    for (const hook of hooks) {
      const hookContext = getHookContext(hook);
      hook?.after?.(hookContext, evaluationDetails, options.hookHints);
    }
  }

  private errorHooks(
    hooks: Hook[], 
    getHookContext: (hook: Hook) => HookContext,
    err: unknown, 
    options: FlagEvaluationOptions
  ) {
    // run "error" hooks sequentially
    for (const hook of hooks) {
      try {
        const hookContext = getHookContext(hook);
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

  private finallyHooks(
    hooks: Hook[],
    getHookContext: (hook: Hook) => HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions,
  ) {
    // run "finally" hooks sequentially
    for (const hook of hooks) {
      try {
        const hookContext = getHookContext(hook);
        hook?.finally?.(hookContext, evaluationDetails, options.hookHints);
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

  private shortCircuitIfNotReady() {
    // short circuit evaluation entirely if provider is in a bad state
    if (this.providerStatus === ProviderStatus.NOT_READY) {
      throw new ProviderNotReadyError('provider has not yet initialized');
    } else if (this.providerStatus === ProviderStatus.FATAL) {
      throw new ProviderFatalError('provider is in an irrecoverable error state');
    }
  }

  private getErrorEvaluationDetails<T extends FlagValue>(
    flagKey: string,
    defaultValue: T,
    err: unknown,
    flagMetadata: FlagMetadata = {},
  ): EvaluationDetails<T> {
    const errorMessage: string = (err as Error)?.message;
    const errorCode: ErrorCode = (err as OpenFeatureError)?.code || ErrorCode.GENERAL;

    return {
      errorCode,
      errorMessage,
      value: defaultValue,
      reason: StandardResolutionReasons.ERROR,
      flagMetadata: Object.freeze(flagMetadata),
      flagKey,
    };
  }
}
