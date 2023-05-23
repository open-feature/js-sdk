import {
  BeforeHookContext,
  ClientMetadata,
  CommonProvider,
  EvaluationContext,
  EvaluationDetails,
  FlagValue,
  HookContext,
  HookHints,
  JsonValue,
  Logger,
  ManageContext,
  ManageLogger,
  ManageTransactionContextPropagator,
  ProviderMetadata,
  ResolutionDetails,
} from '@openfeature/shared';

/**
 * Interface that providers must implement to resolve flag values for their particular
 * backend or vendor.
 *
 * Implementation for resolving all the required flag types must be defined.
 */
export interface Provider extends CommonProvider {
  /**
   * A provider hook exposes a mechanism for provider authors to register hooks
   * to tap into various stages of the flag evaluation lifecycle. These hooks can
   * be used to perform side effects and mutate the context for purposes of the
   * provider. Provider hooks are not configured or controlled by the application author.
   */
  readonly hooks?: Hook[];

  /**
   * Resolve a boolean flag and its evaluation details.
   */
  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<boolean>>;

  /**
   * Resolve a string flag and its evaluation details.
   */
  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<string>>;

  /**
   * Resolve a numeric flag and its evaluation details.
   */
  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<number>>;

  /**
   * Resolve and parse an object flag and its evaluation details.
   */
  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<T>>;
}

export interface Hook<T extends FlagValue = FlagValue> {
  /**
   * Runs before flag values are resolved from the provider.
   * If an EvaluationContext is returned, it will be merged with the pre-existing EvaluationContext.
   *
   * @param hookContext
   * @param hookHints
   */
  before?(
    hookContext: BeforeHookContext,
    hookHints?: HookHints
  ): Promise<EvaluationContext | void> | EvaluationContext | void;

  /**
   * Runs after flag values are successfully resolved from the provider.
   *
   * @param hookContext
   * @param evaluationDetails
   * @param hookHints
   */
  after?(
    hookContext: Readonly<HookContext<T>>,
    evaluationDetails: EvaluationDetails<T>,
    hookHints?: HookHints
  ): Promise<void> | void;

  /**
   * Runs in the event of an unhandled error or promise rejection during flag resolution, or any attached hooks.
   *
   * @param hookContext
   * @param error
   * @param hookHints
   */
  error?(hookContext: Readonly<HookContext<T>>, error: unknown, hookHints?: HookHints): Promise<void> | void;

  /**
   * Runs after all other hook stages, regardless of success or error.
   * Errors thrown here are unhandled by the client and will surface in application code.
   *
   * @param hookContext
   * @param hookHints
   */
  finally?(hookContext: Readonly<HookContext<T>>, hookHints?: HookHints): Promise<void> | void;
}

interface EvaluationLifeCycle<T> {
  /**
   * Adds hooks that will run during flag evaluations on this receiver.
   * Hooks are executed in the order they were registered. Adding additional hooks
   * will not remove existing hooks.
   * Hooks registered on the global API object run with all evaluations.
   * Hooks registered on the client run with all evaluations on that client.
   *
   * @template T The type of the receiver
   * @param {Hook<FlagValue>[]} hooks A list of hooks that should always run
   * @returns {T} The receiver (this object)
   */
  addHooks(...hooks: Hook[]): T;

  /**
   * Access all the hooks that are registered on this receiver.
   *
   * @returns {Hook<FlagValue>[]} A list of the client hooks
   */
  getHooks(): Hook[];

  /**
   * Clears all the hooks that are registered on this receiver.
   *
   * @template T The type of the receiver
   * @returns {T} The receiver (this object)
   */
  clearHooks(): T;
}

export interface FlagEvaluationOptions {
  hooks?: Hook[];
  hookHints?: HookHints;
}

export interface Features {
  /**
   * Performs a flag evaluation that returns a boolean.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<boolean>} Flag evaluation response
   */
  getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<boolean>;

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
  ): Promise<EvaluationDetails<boolean>>;

  /**
   * Performs a flag evaluation that returns a string.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<string>;

  getStringValue<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<string>>;

  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>>;

  /**
   * Performs a flag evaluation that returns a number.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<number>;

  getNumberValue<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<number>>;

  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>>;

  /**
   * Performs a flag evaluation that returns an object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getObjectValue(
    flagKey: string,
    defaultValue: JsonValue,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<JsonValue>;

  getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T>;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {EvaluationContext} context The evaluation context used on an individual flag evaluation
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getObjectDetails(
    flagKey: string,
    defaultValue: JsonValue,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<JsonValue>>;

  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<T>>;
}

export interface Client extends EvaluationLifeCycle<Client>, Features, ManageContext<Client>, ManageLogger<Client> {
  readonly metadata: ClientMetadata;
}

export interface GlobalApi
  extends EvaluationLifeCycle<GlobalApi>,
    ManageContext<GlobalApi>,
    ManageLogger<GlobalApi>,
    ManageTransactionContextPropagator<GlobalApi> {
  readonly providerMetadata: ProviderMetadata;

  /**
   * A factory function for creating new unnamed OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * All unnamed clients use the same provider set via {@link this.setProvider setProvider}.
   *
   * @param {string} name The name of the client
   * @param {string} version The version of the client (only used for metadata)
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(context?: EvaluationContext): Client;

  /**
   * A factory function for creating new named OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that name.
   *
   * @param {string} name The name of the client
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(name: string, context?: EvaluationContext): Client;

  /**
   * A factory function for creating new named OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * If there is already a provider bound to this name via {@link this.setProvider setProvider}, this provider will be used.
   * Otherwise, the default provider is used until a provider is assigned to that name.
   *
   * @param {string} name The name of the client
   * @param {string} version The version of the client (only used for metadata)
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(name: string, version: string, context?: EvaluationContext): Client;

  getClient(
    nameOrContext?: string | EvaluationContext,
    versionOrContext?: string | EvaluationContext,
    contextOrUndefined?: EvaluationContext
  ): Client;

  getClient(name?: string, version?: string, context?: EvaluationContext): Client;

  /**
   * Sets the provider that OpenFeature will use for flag evaluations of clients without a name.
   * Setting a provider supersedes the current provider used in new and existing clients without a name.
   *
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {GlobalApi} OpenFeature API
   */
  setProvider(provider: Provider): GlobalApi;

  /**
   * Sets the provider that OpenFeature will use for flag evaluations of clients with the given name.
   * Setting a provider supersedes the current provider used in new and existing clients with that name.
   *
   * @param {string} client The name to identify the client
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {GlobalApi} OpenFeature API
   */
  setProvider(client: string, provider: Provider): GlobalApi;

  setProvider(clientOrProvider?: string | Provider, providerOrUndefined?: Provider): GlobalApi;
}
