import {
  BeforeHookContext,
  ClientMetadata,
  CommonProvider,
  EvaluationContext,
  EvaluationDetails,
  Eventing,
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

  // client vs global context?
  onContextChange?(oldContext: EvaluationContext, newContext: EvaluationContext): Promise<void>

  // TODO: move to common Provider type when we want close in server
  onClose?(): Promise<void>;

  // TODO: move to common Provider type when we want close in server
  initialize?(context: EvaluationContext): Promise<void>;

  /**
   * Resolve a boolean flag and its evaluation details.
   */
  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<boolean>;

  /**
   * Resolve a string flag and its evaluation details.
   */
  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<string>;

  /**
   * Resolve a numeric flag and its evaluation details.
   */
  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<number>;

  /**
   * Resolve and parse an object flag and its evaluation details.
   */
  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
    logger: Logger
  ): ResolutionDetails<T>;
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
  ): EvaluationContext | void;

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
  ): void;

  /**
   * Runs in the event of an unhandled error or promise rejection during flag resolution, or any attached hooks.
   *
   * @param hookContext
   * @param error
   * @param hookHints
   */
  error?(hookContext: Readonly<HookContext<T>>, error: unknown, hookHints?: HookHints): void;

  /**
   * Runs after all other hook stages, regardless of success or error.
   * Errors thrown here are unhandled by the client and will surface in application code.
   *
   * @param hookContext
   * @param hookHints
   */
  finally?(hookContext: Readonly<HookContext<T>>, hookHints?: HookHints): void;
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
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {boolean} Flag evaluation response
   */
  getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    options?: FlagEvaluationOptions
  ): boolean;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @param {boolean} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {EvaluationDetails<boolean>} Flag evaluation details response
   */
  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<boolean>;

  /**
   * Performs a flag evaluation that returns a string.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {T} Flag evaluation response
   */
  getStringValue(
    flagKey: string,
    defaultValue: string,
    options?: FlagEvaluationOptions
  ): string;
  getStringValue<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {string} T A optional generic argument constraining the string
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {EvaluationDetails<T>} Flag evaluation details response
   */
  getStringDetails(
    flagKey: string,
    defaultValue: string,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<string>;
  getStringDetails<T extends string = string>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<T>;

  /**
   * Performs a flag evaluation that returns a number.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {T} Flag evaluation response
   */
  getNumberValue(
    flagKey: string,
    defaultValue: number,
    options?: FlagEvaluationOptions
  ): number
  getNumberValue<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {number} T A optional generic argument constraining the number
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getNumberDetails(
    flagKey: string,
    defaultValue: number,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<number>;
  getNumberDetails<T extends number = number>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<T>;

  /**
   * Performs a flag evaluation that returns an object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<T>} Flag evaluation response
   */
  getObjectValue(
    flagKey: string,
    defaultValue: JsonValue,
    options?: FlagEvaluationOptions
  ): JsonValue;
  getObjectValue<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): T;

  /**
   * Performs a flag evaluation that a returns an evaluation details object.
   *
   * @param {string} flagKey The flag key uniquely identifies a particular flag
   * @template {JsonValue} T A optional generic argument describing the structure
   * @param {T} defaultValue The value returned if an error occurs
   * @param {FlagEvaluationOptions} options Additional flag evaluation options
   * @returns {Promise<EvaluationDetails<T>>} Flag evaluation details response
   */
  getObjectDetails(
    flagKey: string,
    defaultValue: JsonValue,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<JsonValue>;
  getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    options?: FlagEvaluationOptions
  ): EvaluationDetails<T>;
}

export interface Client
  extends EvaluationLifeCycle<Client>,
    Features,
    ManageLogger<Client>,
    Eventing {
  readonly metadata: ClientMetadata;
}

export interface GlobalApi
  extends EvaluationLifeCycle<GlobalApi>,
    ManageContext<GlobalApi>,
    ManageLogger<GlobalApi>,
    ManageTransactionContextPropagator<GlobalApi> {
  readonly providerMetadata: ProviderMetadata;
  /**
   * A factory function for creating new OpenFeature clients. Clients can contain
   * their own state (e.g. logger, hook, context). Multiple clients can be used
   * to segment feature flag configuration.
   *
   * @param {string} name The name of the client
   * @param {string} version The version of the client
   * @param {EvaluationContext} context Evaluation context that should be set on the client to used during flag evaluations
   * @returns {Client} OpenFeature Client
   */
  getClient(name?: string, version?: string, context?: EvaluationContext): Client;

  /**
   * Sets the provider that OpenFeature will use for flag evaluations. Setting
   * a provider supersedes the current provider used in new and existing clients.
   *
   * @param {Provider} provider The provider responsible for flag evaluations.
   * @returns {GlobalApi} OpenFeature API
   */
  setProvider(provider: Provider): GlobalApi;
}

// export interface EventProvider {
//   readonly ready: boolean;
// }