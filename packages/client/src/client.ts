import { EvaluationContext, OpenFeatureError } from '@openfeature/shared';
import { SafeLogger } from '@openfeature/shared';
import {
  ApiEvents,
  ClientMetadata,
  ErrorCode,
  EvaluationDetails,
  FlagValue,
  FlagValueType,
  Handler,
  HookContext,
  JsonValue,
  Logger,
  ProviderEvents,
  ResolutionDetails,
  StandardResolutionReasons
} from '@openfeature/shared';
import { OpenFeatureEventEmitter } from '.';
import { OpenFeature } from './open-feature';
import { Client, FlagEvaluationOptions, Hook, Provider } from './types';

type OpenFeatureClientOptions = {
  name?: string;
  version?: string;
};

type HandlerWrapper = {
  eventType: string;
  handler: Handler;
}

export class OpenFeatureClient implements Client {
  readonly metadata: ClientMetadata;
  private _hooks: Hook[] = [];
  private _clientLogger?: Logger;
  private _handlerWrappers: HandlerWrapper[] = [];

  constructor(
    // functions are passed here to make sure that these values are always up to date,
    // and so we don't have to make these public properties on the API class. 
    private readonly providerAccessor: () => Provider,
    private readonly providerReady: () => boolean,
    apiEvents: () => OpenFeatureEventEmitter,
    private readonly globalLogger: () => Logger,
    options: OpenFeatureClientOptions,
  ) {
    this.metadata = {
      name: options.name,
      version: options.version,
    } as const;

    this.attachListeners();
    apiEvents().on(ApiEvents.ProviderChanged, () => {
      this.attachListeners();      
    });
  }

  addHandler(eventType: ProviderEvents, handler: Handler): void {
    this._handlerWrappers.push({eventType, handler});
    if (eventType === ProviderEvents.Ready && this.providerReady()) {
      // run immediately, we're ready.
      handler();
    }
  }

  setLogger(logger: Logger): OpenFeatureClient {
    this._clientLogger = new SafeLogger(logger);
    return this;
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

  getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    options?: FlagEvaluationOptions
  ): boolean {
    return this.getBooleanDetails(flagKey, defaultValue, options).value;
  }

  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<boolean> {
    return this.evaluate<boolean>(
      flagKey,
      this._provider.resolveBooleanEvaluation,
      defaultValue,
      'boolean',
      options
    );
  }

  getStringValue<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): T {
    return this.getStringDetails<T>(flagKey, defaultValue, options).value;
  }

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<T> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted string generic argument.
      this._provider.resolveStringEvaluation as () => EvaluationDetails<T>,
      defaultValue,
      'string',
      options
    );
  }

  getNumberValue<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): T {
    return this.getNumberDetails(flagKey, defaultValue, options).value;
  }

  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<T> {
    return this.evaluate<T>(
      flagKey,
      // this isolates providers from our restricted number generic argument.
      this._provider.resolveNumberEvaluation as () => EvaluationDetails<T>,
      defaultValue,
      'number',
      options
    );
  }

  getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): T {
    return this.getObjectDetails(flagKey, defaultValue, options).value;
  }

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<T> {
    return this.evaluate<T>(flagKey, this._provider.resolveObjectEvaluation, defaultValue, 'object', options);
  }

  private evaluate<T extends FlagValue>(
    flagKey: string,
    resolver: (
      flagKey: string,
      defaultValue: T,
      context: EvaluationContext,
      logger: Logger
    ) => ResolutionDetails<T>,
    defaultValue: T,
    flagType: FlagValueType,
    options: FlagEvaluationOptions = {}
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
      ...OpenFeature.getContext(),
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
        flagKey,
      };
    } finally {
      this.finallyHooks(allHooksReversed, hookContext, options);
    }
  }

  private beforeHooks(hooks: Hook[], hookContext: HookContext, options: FlagEvaluationOptions) {
    for (const hook of hooks) {
      // freeze the hookContext
      Object.freeze(hookContext);

      // use Object.assign to avoid modification of frozen hookContext
      Object.assign(hookContext.context, {
        ...hookContext.context,
        ...hook?.before?.(hookContext, Object.freeze(options.hookHints)),
      });
    }

    // after before hooks, freeze the EvaluationContext.
    return Object.freeze(hookContext.context);
  }

  private afterHooks(
    hooks: Hook[],
    hookContext: HookContext,
    evaluationDetails: EvaluationDetails<FlagValue>,
    options: FlagEvaluationOptions
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

  private attachListeners() {
    // iterate over the event types
    Object.values(ProviderEvents)
      .forEach(eventType => this._provider.events?.on(eventType, () => {
        // on each event type, fire the associated handlers
        this._handlerWrappers
          .filter(wrapper => wrapper.eventType === eventType)
          .forEach(wrapper => wrapper.handler());
      }));
  }
}
