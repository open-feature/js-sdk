import { ERROR_REASON, GENERAL_ERROR } from './constants';
import { OpenFeature } from './open-feature';
import { SafeLogger } from './logger';
import {
  Client,
  ClientMetadata,
  EvaluationContext,
  EvaluationDetails,
  FlagEvaluationOptions,
  FlagValue,
  FlagValueType,
  Hook,
  HookContext,
  Logger,
  Provider,
  ResolutionDetails,
} from './types';

type OpenFeatureClientOptions = {
  name?: string;
  version?: string;
};

export class OpenFeatureClient implements Client {
  readonly metadata: ClientMetadata;
  private _context: EvaluationContext;
  private _hooks: Hook[] = [];
  private _clientLogger?: Logger;

  constructor(
    // we always want the client to use the current provider,
    // so pass a function to always access the currently registered one.
    private readonly providerAccessor: () => Provider,
    private readonly globalLogger: () => Logger,
    options: OpenFeatureClientOptions,
    context: EvaluationContext = {}
  ) {
    this.metadata = {
      name: options.name,
      version: options.version,
    } as const;
    this._context = context;
  }

  set logger(logger: Logger) {
    this._clientLogger = new SafeLogger(logger);
  }

  get logger(): Logger {
    return this._clientLogger || this.globalLogger();
  }

  set context(context: EvaluationContext) {
    this._context = context;
  }

  get context(): EvaluationContext {
    return this._context;
  }

  addHooks(...hooks: Hook<FlagValue>[]): void {
    this._hooks = [...this._hooks, ...hooks];
  }

  get hooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  clearHooks(): void {
    this._hooks = [];
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
      this.provider.resolveBooleanEvaluation,
      defaultValue,
      'boolean',
      context,
      options
    );
  }

  async getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<string> {
    return (await this.getStringDetails(flagKey, defaultValue, context, options)).value;
  }

  getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<string>> {
    return this.evaluate<string>(
      flagKey,
      this.provider.resolveStringEvaluation,
      defaultValue,
      'string',
      context,
      options
    );
  }

  async getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<number> {
    return (await this.getNumberDetails(flagKey, defaultValue, context, options)).value;
  }

  getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<number>> {
    return this.evaluate<number>(
      flagKey,
      this.provider.resolveNumberEvaluation,
      defaultValue,
      'number',
      context,
      options
    );
  }

  async getObjectValue<T extends object>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T> {
    return (await this.getObjectDetails(flagKey, defaultValue, context, options)).value;
  }

  getObjectDetails<T extends object>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>> {
    return this.evaluate<T>(flagKey, this.provider.resolveObjectEvaluation, defaultValue, 'object', context, options);
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

    const allHooks = [...OpenFeature.hooks, ...this.hooks, ...(options.hooks || []), ...(this.provider.hooks || [])];
    const allHooksReversed = [...allHooks].reverse();

    // merge global and client contexts
    const mergedContext = {
      ...OpenFeature.context,
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
      logger: this.logger,
    };

    try {
      const frozenContext = await this.beforeHooks(allHooks, hookContext, options);

      // run the referenced resolver, binding the provider.
      const resolution = await resolver.call(this.provider, flagKey, defaultValue, frozenContext, this.logger);

      const evaluationDetails = {
        ...resolution,
        flagKey,
      };

      await this.afterHooks(allHooksReversed, hookContext, evaluationDetails, options);

      return evaluationDetails;
    } catch (err: unknown) {
      const errorCode = (!!err && (err as { code: string }).code) || GENERAL_ERROR;

      await this.errorHooks(allHooksReversed, hookContext, err, options);

      return {
        errorCode,
        value: defaultValue,
        reason: ERROR_REASON,
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
        this.logger.error(`Unhandled error during 'error' hook: ${err}`);
<<<<<<< HEAD
        if (err instanceof Error) {
          this.logger.error(err.stack);
        }
=======
        this.logger.error((err as Error)?.stack);
>>>>>>> add logger
      }
    }
  }

  private async finallyHooks(hooks: Hook[], hookContext: HookContext, options: FlagEvaluationOptions) {
    // run "finally" hooks sequentially
    for (const hook of hooks) {
      try {
        await hook?.finally?.(hookContext, options.hookHints);
      } catch (err) {
        this.logger.error(`Unhandled error during 'finally' hook: ${err}`);
<<<<<<< HEAD
        if (err instanceof Error) {
          this.logger.error(err.stack);
        }
=======
        this.logger.error((err as Error)?.stack);
>>>>>>> add logger
      }
    }
  }

  private get provider() {
    return this.providerAccessor();
  }
}
