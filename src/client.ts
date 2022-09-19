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

  /**
   * Sets a logger on the client. This logger supersedes to the global logger
   * and is passed to various components in the SDK.
   *
   * @param {Logger} logger The logger to to be used
   * @returns {OpenFeatureClient} OpenFeature Client
   */
  setLogger(logger: Logger): OpenFeatureClient {
    this._clientLogger = new SafeLogger(logger);
    return this;
  }

  /**
   * Sets evaluation context that will be used during flag evaluations
   * on this client.
   *
   * @param {EvaluationContext} context Client evaluation context
   * @returns {OpenFeatureClient} OpenFeature Client
   */
  setContext(context: EvaluationContext): OpenFeatureClient {
    this._context = context;
    return this;
  }

  /**
   * Access the evaluation context set on the client.
   *
   * @returns {EvaluationContext} Client evaluation context
   */
  getContext(): EvaluationContext {
    return this._context;
  }

  /**
   * Adds hooks that will run during flag evaluations on this client. Client
   * hooks are executed in the order they were registered. Adding additional hooks
   * will not remove existing hooks.
   *
   * @param {Hook<FlagValue>[]} hooks A list of hooks that should always run
   * @returns {OpenFeatureClient} OpenFeature Client
   */
  addHooks(...hooks: Hook<FlagValue>[]): OpenFeatureClient {
    this._hooks = [...this._hooks, ...hooks];
    return this;
  }

  /**
   * Access all the hooks that are registered on this client.
   *
   * @returns {Hook<FlagValue>[]} A list of the client hooks
   */
  getHooks(): Hook<FlagValue>[] {
    return this._hooks;
  }

  /**
   * Clears all the hooks that are registered on this client.
   *
   * @returns {OpenFeatureClient} OpenFeature Client
   */
  clearHooks(): OpenFeatureClient {
    this._hooks = [];
    return this;
  }

  /**
   * Performs a flag evaluation that returns a boolean.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<boolean>} Flag evaluation response
   */
  async getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<boolean> {
    return (await this.getBooleanDetails(flagKey, defaultValue, context, options)).value;
  }

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<boolean>>} Flag evaluation details response
   */
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

  /**
   * Performs a flag evaluation that returns a string.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {string} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<string>} Flag evaluation response
   */
  async getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<string> {
    return (await this.getStringDetails(flagKey, defaultValue, context, options)).value;
  }

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<string>>} Flag evaluation details response
   */
  getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<string>> {
    return this.evaluate<string>(
      flagKey,
      this._provider.resolveStringEvaluation,
      defaultValue,
      'string',
      context,
      options
    );
  }

  /**
   * Performs a flag evaluation that returns a number.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {number} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<number>} Flag evaluation response
   */
  async getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<number> {
    return (await this.getNumberDetails(flagKey, defaultValue, context, options)).value;
  }

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {number} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<number>>} Flag evaluation details response
   */
  getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<number>> {
    return this.evaluate<number>(
      flagKey,
      this._provider.resolveNumberEvaluation,
      defaultValue,
      'number',
      context,
      options
    );
  }

  /**
   * Performs a flag evaluation that returns an object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {object} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<object>} Flag evaluation response
   */
  async getObjectValue<T extends object>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T> {
    return (await this.getObjectDetails(flagKey, defaultValue, context, options)).value;
  }

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {object} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<object>>} Flag evaluation details response
   */
  getObjectDetails<T extends object>(
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

  private get _provider() {
    return this.providerAccessor();
  }

  private get _logger() {
    return this._clientLogger || this.globalLogger();
  }
}
