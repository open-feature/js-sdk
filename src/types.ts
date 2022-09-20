type PrimitiveValue = null | boolean | string | number ;

export type JsonObject = { [key: string]: JsonValue };

export type JsonArray = JsonValue[];

/**
 * Represents a JSON node value.
 */
export type JsonValue = PrimitiveValue | JsonObject | JsonArray;

/**
 * Represents a JSON node value, or Date.
 */
export type EvaluationContextValue = PrimitiveValue | Date | { [key: string]: EvaluationContextValue } | EvaluationContextValue[];

/**
 * A container for arbitrary contextual data that can be used as a basis for dynamic evaluation
 */
export type EvaluationContext = {
  /**
   * A string uniquely identifying the subject (end-user, or client service) of a flag evaluation.
   * Providers may require this field for fractional flag evaluation, rules, or overrides targeting specific users.
   * Such providers may behave unpredictably if a targeting key is not specified at flag resolution.
   */
  targetingKey?: string;
} & Record<string, EvaluationContextValue>;

export type FlagValue = boolean | string | number | JsonValue;

export type FlagValueType = 'boolean' | 'string' | 'number' | 'object';

export interface FlagEvaluationOptions {
  hooks?: Hook[];
  hookHints?: HookHints;
}

export interface Logger {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
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

/**
 * Interface that providers must implement to resolve flag values for their particular
 * backend or vendor.
 *
 * Implementation for resolving all the required flag types must be defined.
 */
export interface Provider {
  readonly metadata: ProviderMetadata;
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

export enum StandardResolutionReasons {
  /**
   * Indicates that the feature flag is targeting
   * 100% of the targeting audience,
   * e.g. 100% rollout percentage
   */
  TARGETING_MATCH = 'TARGETING_MATCH',
  /**
   * Indicates that the feature flag is targeting
   * a subset of the targeting audience,
   * e.g. less than 100% rollout percentage
   */
  SPLIT = 'SPLIT',
  /**
   * Indicates that the feature flag is disabled
   */
  DISABLED = 'DISABLED',
  /**
   * Indicates that the feature flag evaluated to the
   * default value as passed in getBooleanValue/getBooleanValueDetails and
   * similar functions in the Client
   */
  DEFAULT = 'DEFAULT',
  /**
   * Indicates that the feature flag evaluated to a
   * static value, for example, the default value for the flag
   *
   * Note: Typically means that no dynamic evaluation has been
   * executed for the feature flag
   */
  STATIC = 'STATIC',
  /**
   * Indicates an unknown issue occurred during evaluation
   */
  UNKNOWN = 'UNKNOWN',
  /**
   * Indicates that an error occurred during evaluation
   *
   * Note: The `errorCode`-field contains the details of this error
   */
  ERROR = 'ERROR',
}
export type ResolutionReason = keyof typeof StandardResolutionReasons | (string & Record<never, never>);

export type ResolutionDetails<U> = {
  value: U;
  variant?: string;
  reason?: ResolutionReason;
  errorCode?: string;
};

export type EvaluationDetails<T extends FlagValue> = {
  flagKey: string;
} & ResolutionDetails<T>;

export interface Client extends EvaluationLifeCycle<Client>, Features, ManageContext<Client>, ManageLogger<Client> {
  readonly metadata: ClientMetadata;
}

export interface GlobalApi extends EvaluationLifeCycle<GlobalApi>, ManageContext<GlobalApi>, ManageLogger<GlobalApi> {
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
   * @returns {OpenFeatureAPI} OpenFeature API
   */
   setProvider(provider: Provider): GlobalApi
}

interface EvaluationLifeCycle<T> {
  /**
   * Adds hooks that will run during flag evaluations on this receiver.
   * Hooks are executed in the order they were registered. Adding additional hooks
   * will not remove existing hooks.
   * Hooks registered on the global API object run with all evaluations.
   * Hooks registered on the client run with all evaluations on that client.
   *
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
   * @returns {T} The receiver (this object)
   */
  clearHooks(): T;
}

interface ManageContext<T> {
  /**
   * Access the evaluation context set on the receiver.
   *
   * @returns {EvaluationContext} Evaluation context
   */
  getContext(): EvaluationContext;

  /**
   * Sets evaluation context that will be used during flag evaluations
   * on this receiver.
   *
   * @param {EvaluationContext} context Evaluation context
   * @returns {T} The receiver (this object)
   */
  setContext(context: EvaluationContext): T;
}

interface ManageLogger<T> {
  /**
   * Sets a logger on this receiver. This logger supersedes to the global logger
   * and is passed to various components in the SDK.
   * The logger configured on the global API object will be used for all evaluations,
   * unless overridden in a particular client.
   *
   * @param {Logger} logger The logger to to be used
   * @returns {T} The receiver (this object)
   */
  setLogger(logger: Logger): T;
}

export type HookHints = Readonly<Record<string, unknown>>;

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface Metadata {}

export interface ClientMetadata extends Metadata {
  readonly version?: string;
  readonly name?: string;
}

export interface ProviderMetadata extends Metadata {
  readonly name: string;
}

export interface HookContext<T extends FlagValue = FlagValue> {
  readonly flagKey: string;
  readonly defaultValue: T;
  readonly flagValueType: FlagValueType;
  readonly context: Readonly<EvaluationContext>;
  readonly clientMetadata: ClientMetadata;
  readonly providerMetadata: ProviderMetadata;
  readonly logger: Logger;
}

export interface BeforeHookContext extends HookContext {
  context: EvaluationContext;
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
