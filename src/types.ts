export type PrimitiveValue = null | boolean | string | number;

export type JsonObject = { [key: string]: JsonValue };

export type JsonArray = JsonValue[];

/**
 * Represents a JSON node value.
 */
export type JsonValue = PrimitiveValue | JsonObject | JsonArray;

/**
 * Represents a JSON node value, or Date.
 */
export type EvaluationContextValue =
  | PrimitiveValue
  | Date
  | { [key: string]: EvaluationContextValue }
  | EvaluationContextValue[];

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

export const StandardResolutionReasons = {
  /**
   * The resolved value was the result of a dynamic evaluation, such as a rule or specific user-targeting.
   */
  TARGETING_MATCH: 'TARGETING_MATCH',

  /**
   * The resolved value was the result of pseudorandom assignment.
   */
  SPLIT: 'SPLIT',

  /**
   * The resolved value was the result of the flag being disabled in the management system.
   */
  DISABLED: 'DISABLED',

  /**
   * 	The resolved value was configured statically, or otherwise fell back to a pre-configured value.
   */
  DEFAULT: 'DEFAULT',

  /**
   * The reason for the resolved value could not be determined.
   */
  UNKNOWN: 'UNKNOWN',
  
  /**
   * The resolved value is static (no dynamic evaluation).
   */
  STATIC: 'STATIC',
  
  /**
   * The resolved value was retrieved from cache.
   */
  CACHED: 'CACHED',

  /**
   * The resolved value was the result of an error.
   *
   * Note: The `errorCode` and `errorMessage` fields may contain additional details of this error.
   */
  ERROR: 'ERROR',
} as const;

export enum ErrorCode {
  /**
   * The value was resolved before the provider was ready.
   */
  PROVIDER_NOT_READY = 'PROVIDER_NOT_READY',

  /**
   * The flag could not be found.
   */
  FLAG_NOT_FOUND = 'FLAG_NOT_FOUND',

  /**
   * An error was encountered parsing data, such as a flag configuration.
   */
  PARSE_ERROR = 'PARSE_ERROR',

  /**
   * The type of the flag value does not match the expected type.
   */
  TYPE_MISMATCH = 'TYPE_MISMATCH',

  /**
   * The provider requires a targeting key and one was not provided in the evaluation context.
   */
  TARGETING_KEY_MISSING = 'TARGETING_KEY_MISSING',

  /**
   * The evaluation context does not meet provider requirements.
   */
  INVALID_CONTEXT = 'INVALID_CONTEXT',

  /**
   * An error with an unspecified code.
   */
  GENERAL = 'GENERAL',
}

export type ResolutionReason = keyof typeof StandardResolutionReasons | (string & Record<never, never>);

export type ResolutionDetails<U> = {
  value: U;
  variant?: string;
  reason?: ResolutionReason;
  errorCode?: ErrorCode;
  errorMessage?: string;
};

export type EvaluationDetails<T extends FlagValue> = {
  flagKey: string;
} & ResolutionDetails<T>;

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
   * @template T The type of the receiver
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
   * @template T The type of the receiver
   * @param {Logger} logger The logger to be used
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

/**
 * Transaction context is a mechanism for adding transaction specific context that
 * is merged with evaluation context prior to flag evaluation. Examples of potential
 * transaction specific context include: a user id, user agent, or request path.
 */
export type TransactionContext = EvaluationContext;

interface ManageTransactionContextPropagator<T> extends TransactionContextPropagator {
  /**
   * EXPERIMENTAL: Transaction context propagation is experimental and subject to change.
   * The OpenFeature Enhancement Proposal regarding transaction context can be found [here](https://github.com/open-feature/ofep/pull/32).
   *
   * Sets a transaction context propagator on this receiver. The transaction context
   * propagator is responsible for persisting context for the duration of a single
   * transaction.
   *
   * @experimental
   * @template T The type of the receiver
   * @param {TransactionContextPropagator} transactionContextPropagator The context propagator to be used
   * @returns {T} The receiver (this object)
   */
  setTransactionContextPropagator(transactionContextPropagator: TransactionContextPropagator): T;
}

export interface TransactionContextPropagator {
  /**
   * EXPERIMENTAL: Transaction context propagation is experimental and subject to change.
   * The OpenFeature Enhancement Proposal regarding transaction context can be found [here](https://github.com/open-feature/ofep/pull/32).
   *
   * Returns the currently defined transaction context using the registered transaction
   * context propagator.
   *
   * @experimental
   * @returns {TransactionContext} The current transaction context
   */
  getTransactionContext(): TransactionContext;

  /**
   * EXPERIMENTAL: Transaction context propagation is experimental and subject to change.
   * The OpenFeature Enhancement Proposal regarding transaction context can be found [here](https://github.com/open-feature/ofep/pull/32).
   *
   * Sets the transaction context using the registered transaction context propagator.
   *
   * @experimental
   * @template R The return value of the callback
   * @param {TransactionContext} transactionContext The transaction specific context
   * @param {(...args: unknown[]) => R} callback Callback function used to set the transaction context on the stack
   * @param {...unknown[]} args Optional arguments that are passed to the callback function
   */
  setTransactionContext<R>(
    transactionContext: TransactionContext,
    callback: (...args: unknown[]) => R,
    ...args: unknown[]
  ): void;
}
