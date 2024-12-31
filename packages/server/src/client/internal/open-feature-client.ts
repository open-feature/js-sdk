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
} from '@openfeature/core';
import {
  ErrorCode,
  ProviderFatalError,
  ProviderNotReadyError,
  SafeLogger,
  StandardResolutionReasons,
  instantiateErrorByErrorCode,
  statusMatchesEvent,
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
  private _context: EvaluationContext;
  private _hooks: Hook[] = [];
  private _clientLogger?: Logger;

  constructor(
    // we always want the client to use the current provider,
    // so pass a function to always access the currently registered one.
    private readonly providerAccessor: () => Provider,
    private readonly providerStatusAccessor: () => ProviderStatus,
    private readonly emitterAccessor: () => InternalEventEmitter,
    private readonly apiContextAccessor: () => EvaluationContext,
    private readonly apiHooksAccessor: () => Hook[],
    private readonly transactionContextAccessor: () => EvaluationContext,
    private readonly globalLogger: () => Logger,
    private readonly options: OpenFeatureClientOptions,
    context: EvaluationContext = {},
  ) {
    this._context = context;
  }

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

  addHandler(eventType: ProviderEvents, handler: EventHandler): void {
    this.emitterAccessor().addHandler(eventType, handler);
    const shouldRunNow = statusMatchesEvent(eventType, this._providerStatus);

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

  removeHandler(eventType: ProviderEvents, handler: EventHandler) {
    this.emitterAccessor().removeHandler(eventType, handler);
  }

  getHandlers(eventType: ProviderEvents) {
    return this.emitterAccessor().getHandlers(eventType);
  }

  setLogger(logger: Logger): OpenFeatureClient {
    this._clientLogger = new SafeLogger(logger);
    return this;
  }

  setContext(context: EvaluationContext): OpenFeatureClient {
    this._context = context;
    return this;
  }

  getContext(): EvaluationContext {
    return this._context;
  }

  addHooks(...hooks: Hook[]): OpenFeatureClient {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  getHooks(): Hook[] {
    return this._hooks;
  }

  clearHooks(): OpenFeatureClient {
    this._hooks = [];
    return this;
  }

  async getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<boolean> {
    return (await this.getBooleanDetails(flagKey, defaultValue, context, options)).value;
  }

  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<boolean>> {
    return this.evaluate<boolean>(
      flagKey,
      this._provider.resolveBooleanEvaluation,
      defaultValue,
      'boolean',
      context,
      options,
    );
  }

  async getStringValue<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<T> {
    return (await this.getStringDetails<T>(flagKey, defaultValue, context, options)).value;
  }

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<T>> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted string generic argument.
      this._provider.resolveStringEvaluation as () => Promise<EvaluationDetails<T>>,
      defaultValue,
      'string',
      context,
      options,
    );
  }

  async getNumberValue<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<T> {
    return (await this.getNumberDetails(flagKey, defaultValue, context, options)).value;
  }

  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<T>> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted number generic argument.
      this._provider.resolveNumberEvaluation as () => Promise<EvaluationDetails<T>>,
      defaultValue,
      'number',
      context,
      options,
    );
  }

  async getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<T> {
    return (await this.getObjectDetails(flagKey, defaultValue, context, options)).value;
  }

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions,
  ): Promise<EvaluationDetails<T>> {
    return this.evaluate<T>(flagKey, this._provider.resolveObjectEvaluation, defaultValue, 'object', context, options);
  }

  track(occurrenceKey: string, context: EvaluationContext = {}, occurrenceDetails: TrackingEventDetails = {}): void {
    try {
      this.shortCircuitIfNotReady();

      if (typeof this._provider.track === 'function') {
        // freeze the merged context
        const frozenContext = Object.freeze(this.mergeContexts(context));
        return this._provider.track?.(occurrenceKey, frozenContext, occurrenceDetails);
      } else {
        this._logger.debug('Provider does not support the track function; will no-op.');
      }
    } catch (err) {
      this._logger.debug('Error recording tracking event.', err);
    }
  }

  private async evaluate<T extends FlagValue>(
    flagKey: string,
    resolver: (
      flagKey: string,
      defaultValue: T,
      context: EvaluationContext,
      logger: Logger,
    ) => Promise<ResolutionDetails<T>>,
    defaultValue: T,
    flagType: FlagValueType,
    invocationContext: EvaluationContext = {},
    options: FlagEvaluationOptions = {},
  ): Promise<EvaluationDetails<T>> {
    // merge global, client, and evaluation context

    const allHooks = [
      ...this.apiHooksAccessor(),
      ...this.getHooks(),
      ...(options.hooks || []),
      ...(this._provider.hooks || []),
    ];
    const allHooksReversed = [...allHooks].reverse();

    const mergedContext = this.mergeContexts(invocationContext);

    // this reference cannot change during the course of evaluation
    // it may be used as a key in WeakMaps
    const hookContext: Readonly<HookContext> = {
      flagKey,
      defaultValue,
      flagValueType: flagType,
      clientMetadata: this.metadata,
      providerMetadata: this._provider.metadata,
      context: mergedContext,
      logger: this._logger,
    };

    let evaluationDetails: EvaluationDetails<T>;

    try {
      const frozenContext = await this.beforeHooks(allHooks, hookContext, options);

      this.shortCircuitIfNotReady();

      // run the referenced resolver, binding the provider.
      const resolution = await resolver.call(this._provider, flagKey, defaultValue, frozenContext, this._logger);

      const resolutionDetails = {
        ...resolution,
        flagMetadata: Object.freeze(resolution.flagMetadata ?? {}),
        flagKey,
      };

      if (resolutionDetails.errorCode) {
        const err = instantiateErrorByErrorCode(resolutionDetails.errorCode);
        await this.errorHooks(allHooksReversed, hookContext, err, options);
        evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err, resolutionDetails.flagMetadata);
      } else {
        await this.afterHooks(allHooksReversed, hookContext, resolutionDetails, options);
        evaluationDetails = resolutionDetails;
      }
    } catch (err: unknown) {
      await this.errorHooks(allHooksReversed, hookContext, err, options);
      evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, err);
    }

    await this.finallyHooks(allHooksReversed, hookContext, evaluationDetails, options);
    return evaluationDetails;
  }

  private async beforeHooks(hooks: Hook[], hookContext: HookContext, options: FlagEvaluationOptions) {
    for (const hook of hooks) {
      // freeze the hookContext
      Object.freeze(hookContext);

      // use Object.assign to avoid modification of frozen hookContext
      Object.assign(hookContext.context, {
        ...hookContext.context,
        ...(await hook?.before?.(hookContext, Object.freeze(options.hookHints))),
      });
    }

    // after before hooks, freeze the EvaluationContext.
    return Object.freeze(hookContext.context);
  }

  private async afterHooks(
    hooks: Hook[],
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions,
  ) {
    // run "after" hooks sequentially
    for (const hook of hooks) {
      await hook?.after?.(hookContext, evaluationDetails, options.hookHints);
    }
  }

  private async errorHooks(hooks: Hook[], hookContext: HookContext, err: unknown, options: FlagEvaluationOptions) {
    // run "error" hooks sequentially
    for (const hook of hooks) {
      try {
        await hook?.error?.(hookContext, err, options.hookHints);
      } catch (err) {
        this._logger.error(`Unhandled error during 'error' hook: ${err}`);
        if (err instanceof Error) {
          this._logger.error(err.stack);
        }
        this._logger.error((err as Error)?.stack);
      }
    }
  }

  private async finallyHooks(
    hooks: Hook[],
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions,
  ) {
    // run "finally" hooks sequentially
    for (const hook of hooks) {
      try {
        await hook?.finally?.(hookContext, evaluationDetails, options.hookHints);
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

  private get _providerStatus(): ProviderStatus {
    return this.providerStatusAccessor();
  }

  private get _logger() {
    return this._clientLogger || this.globalLogger();
  }

  private mergeContexts(invocationContext: EvaluationContext) {
    // merge global and client contexts
    return {
      ...this.apiContextAccessor(),
      ...this.transactionContextAccessor(),
      ...this._context,
      ...invocationContext,
    };
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
