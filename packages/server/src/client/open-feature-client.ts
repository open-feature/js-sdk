import {
  ClientMetadata,
  ErrorCode,
  EvaluationContext,
  EvaluationDetails,
  EventHandler,
  FlagValue,
  FlagValueType,
  Hook,
  HookContext,
  InternalEventEmitter,
  JsonValue,
  Logger,
  ManageContext,
  OpenFeatureError,
  ProviderEvents,
  ResolutionDetails,
  SafeLogger,
  StandardResolutionReasons,
  statusMatchesEvent
} from '@openfeature/core';
import { FlagEvaluationOptions } from '../evaluation';
import { OpenFeature } from '../open-feature';
import { Provider } from '../provider';
import { Client } from './client';

type OpenFeatureClientOptions = {
  name?: string;
  version?: string;
};

export class OpenFeatureClient implements Client, ManageContext<OpenFeatureClient> {
  private _context: EvaluationContext;
  private _hooks: Hook[] = [];
  private _clientLogger?: Logger;

  constructor(
    // we always want the client to use the current provider,
    // so pass a function to always access the currently registered one.
    private readonly providerAccessor: () => Provider,
    private readonly emitterAccessor: () => InternalEventEmitter,
    private readonly globalLogger: () => Logger,
    private readonly options: OpenFeatureClientOptions,
    context: EvaluationContext = {}
  ) {
    this._context = context;
  }

  get metadata(): ClientMetadata {
    return {
      name: this.options.name,
      version: this.options.version,
      providerMetadata: this.providerAccessor().metadata,
    };
  }

  addHandler<T extends ProviderEvents>(eventType: T, handler: EventHandler<T>): void {
    this.emitterAccessor().addHandler(eventType, handler);
    const shouldRunNow = statusMatchesEvent(eventType, this._provider.status);

    if (shouldRunNow) {
      // run immediately, we're in the matching state
      try {
        handler({ clientName: this.metadata.name, providerName: this._provider.metadata.name });
      } catch (err) {
        this._logger?.error('Error running event handler:', err);
      }
    }
  }

  removeHandler<T extends ProviderEvents>(eventType: T, handler: EventHandler<T>) {
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

  addHooks(...hooks: Hook<FlagValue>[]): OpenFeatureClient {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  getHooks(): Hook<FlagValue>[] {
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
    options?: FlagEvaluationOptions
  ): Promise<boolean> {
    return (await this.getBooleanDetails(flagKey, defaultValue, context, options)).value;
  }

  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<boolean>> {
    return this.evaluate<boolean>(
      flagKey,
      this._provider.resolveBooleanEvaluation,
      defaultValue,
      'boolean',
      context,
      options
    );
  }

  async getStringValue<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T> {
    return (await this.getStringDetails<T>(flagKey, defaultValue, context, options)).value;
  }

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted string generic argument.
      this._provider.resolveStringEvaluation as () => Promise<EvaluationDetails<T>>,
      defaultValue,
      'string',
      context,
      options
    );
  }

  async getNumberValue<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T> {
    return (await this.getNumberDetails(flagKey, defaultValue, context, options)).value;
  }

  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted number generic argument.
      this._provider.resolveNumberEvaluation as () => Promise<EvaluationDetails<T>>,
      defaultValue,
      'number',
      context,
      options
    );
  }

  async getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T> {
    return (await this.getObjectDetails(flagKey, defaultValue, context, options)).value;
  }

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>> {
    return this.evaluate<T>(flagKey, this._provider.resolveObjectEvaluation, defaultValue, 'object', context, options);
  }

  private async evaluate<T extends FlagValue>(
    flagKey: string,
    resolver: (
      flagKey: string,
      defaultValue: T,
      context: EvaluationContext,
      logger: Logger
    ) => Promise<ResolutionDetails<T>>,
    defaultValue: T,
    flagType: FlagValueType,
    invocationContext: EvaluationContext = {},
    options: FlagEvaluationOptions = {}
  ): Promise<EvaluationDetails<T>> {
    // merge global, client, and evaluation context

    const allHooks = [
      ...OpenFeature.getHooks(),
      ...this.getHooks(),
      ...(options.hooks || []),
      ...(this._provider.hooks || []),
    ];
    const allHooksReversed = [...allHooks].reverse();

    // merge global and client contexts
    const mergedContext = {
      ...OpenFeature.getContext(),
      ...OpenFeature.getTransactionContext(),
      ...this._context,
      ...invocationContext,
    };

    // this reference cannot change during the course of evaluation
    // it may be used as a key in WeakMaps
    const hookContext: Readonly<HookContext> = {
      flagKey,
      defaultValue,
      flagValueType: flagType,
      clientMetadata: this.metadata,
      providerMetadata: OpenFeature.providerMetadata,
      context: mergedContext,
      logger: this._logger,
    };

    try {
      const frozenContext = await this.beforeHooks(allHooks, hookContext, options);

      // run the referenced resolver, binding the provider.
      const resolution = await resolver.call(this._provider, flagKey, defaultValue, frozenContext, this._logger);

      const evaluationDetails = {
        ...resolution,
        flagMetadata: Object.freeze(resolution.flagMetadata ?? {}),
        flagKey,
      };

      await this.afterHooks(allHooksReversed, hookContext, evaluationDetails, options);

      return evaluationDetails;
    } catch (err: unknown) {
      const errorMessage: string = (err as Error)?.message;
      const errorCode: ErrorCode = (err as OpenFeatureError)?.code || ErrorCode.GENERAL;

      await this.errorHooks(allHooksReversed, hookContext, err, options);

      return {
        errorCode,
        errorMessage,
        value: defaultValue,
        reason: StandardResolutionReasons.ERROR,
        flagMetadata: Object.freeze({}),
        flagKey,
      };
    } finally {
      await this.finallyHooks(allHooksReversed, hookContext, options);
    }
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
    options: FlagEvaluationOptions
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

  private async finallyHooks(hooks: Hook[], hookContext: HookContext, options: FlagEvaluationOptions) {
    // run "finally" hooks sequentially
    for (const hook of hooks) {
      try {
        await hook?.finally?.(hookContext, options.hookHints);
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
