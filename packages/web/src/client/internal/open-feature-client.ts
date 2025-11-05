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
  MapHookData,
} from '@openfeature/core';
import type { FlagEvaluationOptions } from '../../evaluation';
import { EvaluationDetailsWithSubscription } from '../../evaluation';
import { ProviderEvents } from '../../events';
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
    return this.evaluateWithSubscription<boolean>(
      flagKey,
      this._provider.resolveBooleanEvaluation,
      defaultValue,
      'boolean',
      options,
    );
  }

  getStringValue<T extends string = string>(flagKey: string, defaultValue: T, options?: FlagEvaluationOptions): T {
    return this.getStringDetails<T>(flagKey, defaultValue, options).value;
  }

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions,
  ): EvaluationDetails<T> {
    return this.evaluateWithSubscription<T>(
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
    return this.evaluateWithSubscription<T>(
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
    return this.evaluateWithSubscription<T>(
      flagKey,
      this._provider.resolveObjectEvaluation,
      defaultValue,
      'object',
      options,
    );
  }

  onBooleanContextChanged(
    flagKey: string,
    defaultValue: boolean,
    callback: (newDetails: EvaluationDetails<boolean>, oldDetails: EvaluationDetails<boolean>) => void,
    options?: FlagEvaluationOptions,
  ): () => void {
    return this.subscribeToContextChanges(flagKey, defaultValue, 'boolean', callback, options);
  }

  onStringContextChanged(
    flagKey: string,
    defaultValue: string,
    callback: (newDetails: EvaluationDetails<string>, oldDetails: EvaluationDetails<string>) => void,
    options?: FlagEvaluationOptions,
  ): () => void {
    return this.subscribeToContextChanges(flagKey, defaultValue, 'string', callback, options);
  }

  onNumberContextChanged(
    flagKey: string,
    defaultValue: number,
    callback: (newDetails: EvaluationDetails<number>, oldDetails: EvaluationDetails<number>) => void,
    options?: FlagEvaluationOptions,
  ): () => void {
    return this.subscribeToContextChanges(flagKey, defaultValue, 'number', callback, options);
  }

  onObjectContextChanged<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    callback: (newDetails: EvaluationDetails<T>, oldDetails: EvaluationDetails<T>) => void,
    options?: FlagEvaluationOptions,
  ): () => void {
    return this.subscribeToContextChanges(flagKey, defaultValue, 'object', callback, options);
  }

  private subscribeToContextChanges<T extends FlagValue>(
    flagKey: string,
    defaultValue: T,
    flagType: FlagValueType,
    callback: (newDetails: EvaluationDetails<T>, oldDetails: EvaluationDetails<T>) => void,
    options?: FlagEvaluationOptions,
  ): () => void {
    let currentDetails: EvaluationDetails<T>;

    switch (flagType) {
      case 'boolean':
        currentDetails = this.getBooleanDetails(flagKey, defaultValue as boolean, options) as EvaluationDetails<T>;
        break;
      case 'string':
        currentDetails = this.getStringDetails(flagKey, defaultValue as string, options) as EvaluationDetails<T>;
        break;
      case 'number':
        currentDetails = this.getNumberDetails(flagKey, defaultValue as number, options) as EvaluationDetails<T>;
        break;
      case 'object':
        currentDetails = this.getObjectDetails(flagKey, defaultValue as JsonValue, options) as EvaluationDetails<T>;
        break;
      default:
        throw new Error(`Unsupported flag type: ${flagType}`);
    }

    callback(currentDetails, { ...currentDetails });

    const handler = () => {
      const oldDetails = { ...currentDetails };
      let newDetails: EvaluationDetails<T>;

      switch (flagType) {
        case 'boolean':
          newDetails = this.getBooleanDetails(flagKey, defaultValue as boolean, options) as EvaluationDetails<T>;
          break;
        case 'string':
          newDetails = this.getStringDetails(flagKey, defaultValue as string, options) as EvaluationDetails<T>;
          break;
        case 'number':
          newDetails = this.getNumberDetails(flagKey, defaultValue as number, options) as EvaluationDetails<T>;
          break;
        case 'object':
          newDetails = this.getObjectDetails(flagKey, defaultValue as JsonValue, options) as EvaluationDetails<T>;
          break;
        default:
          return;
      }

      currentDetails = newDetails;
      callback(newDetails, oldDetails);
    };

    this.addHandler(ProviderEvents.ContextChanged, handler, {});

    return () => {
      this.removeHandler(ProviderEvents.ContextChanged, handler);
    };
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

  private evaluateWithSubscription<T extends FlagValue>(
    flagKey: string,
    resolver: (flagKey: string, defaultValue: T, context: EvaluationContext, logger: Logger) => ResolutionDetails<T>,
    defaultValue: T,
    flagType: FlagValueType,
    options: FlagEvaluationOptions = {},
  ): EvaluationDetails<T> {
    const details = this.evaluate<T>(flagKey, resolver, defaultValue, flagType, options);
    return new EvaluationDetailsWithSubscription(this, flagKey, defaultValue, flagType, details, options);
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

    // Create hook context instances for each hook (stable object references for the entire evaluation)
    // This ensures hooks can use WeakMaps with hookContext as keys across lifecycle methods
    // NOTE: Uses the reversed order to reduce the number of times we have to calculate the index.
    const hookContexts = allHooksReversed.map<HookContext>(() =>
      Object.freeze({
        flagKey,
        defaultValue,
        flagValueType: flagType,
        clientMetadata: this.metadata,
        providerMetadata: this._provider.metadata,
        context,
        logger: this._logger,
        hookData: new MapHookData(),
      }),
    );

    let evaluationDetails: EvaluationDetails<T>;

    try {
      this.beforeHooks(allHooks, hookContexts, options);

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
        this.errorHooks(allHooksReversed, hookContexts, err, options);
        evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err, resolutionDetails.flagMetadata);
      } else {
        this.afterHooks(allHooksReversed, hookContexts, resolutionDetails, options);
        evaluationDetails = resolutionDetails;
      }
    } catch (err: unknown) {
      this.errorHooks(allHooksReversed, hookContexts, err, options);
      evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err);
    }
    this.finallyHooks(allHooksReversed, hookContexts, evaluationDetails, options);
    return evaluationDetails;
  }

  private beforeHooks(hooks: Hook[], hookContexts: HookContext[], options: FlagEvaluationOptions) {
    for (const [index, hook] of hooks.entries()) {
      const hookContextIndex = hooks.length - 1 - index; // reverse index for before hooks
      const hookContext = hookContexts[hookContextIndex];
      Object.freeze(hookContext);
      Object.freeze(hookContext.context);
      hook?.before?.(hookContext, Object.freeze(options.hookHints));
    }
  }

  private afterHooks(
    hooks: Hook[],
    hookContexts: HookContext[],
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions,
  ) {
    // run "after" hooks sequentially
    for (const [index, hook] of hooks.entries()) {
      const hookContext = hookContexts[index];
      hook?.after?.(hookContext, evaluationDetails, options.hookHints);
    }
  }

  private errorHooks(hooks: Hook[], hookContexts: HookContext[], err: unknown, options: FlagEvaluationOptions) {
    // run "error" hooks sequentially
    for (const [index, hook] of hooks.entries()) {
      try {
        const hookContext = hookContexts[index];
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
    hookContexts: HookContext[],
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions,
  ) {
    // run "finally" hooks sequentially
    for (const [index, hook] of hooks.entries()) {
      try {
        const hookContext = hookContexts[index];
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
