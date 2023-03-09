export type PrimitiveValue = null | boolean | string | number;

export enum ProviderEvents {
  Ready = 'PROVIDER_READY',
  Error = 'PROVIDER_ERROR',
  ConfigurationChanged = 'PROVIDER_CONFIGURATION_CHANGED',
  Shutdown = 'PROVIDER_SHUTDOWN',
};

export interface EventData {
  flagKeysChanged?: string[],
  changeMetadata?: { [key: string]: boolean | string } // similar to flag metadata
}

export enum ApiEvents {
  ProviderChanged = 'providerChanged',
}

export interface Eventing {
  addHandler(notificationType: string, handler: Handler): void
}

export type EventContext = {
  notificationType: string;
  [key: string]: unknown;
}

export type Handler = (eventContext?: EventContext) => void

export type EventCallbackMessage = (eventContext: EventContext) => void

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


export interface Logger {
  error(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  info(...args: unknown[]): void;
  debug(...args: unknown[]): void;
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

export interface ManageContext<T> {
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

export interface ManageLogger<T> {
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

/**
 * Transaction context is a mechanism for adding transaction specific context that
 * is merged with evaluation context prior to flag evaluation. Examples of potential
 * transaction specific context include: a user id, user agent, or request path.
 */
export type TransactionContext = EvaluationContext;

export interface ManageTransactionContextPropagator<T> extends TransactionContextPropagator {
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

export interface CommonProvider {
  readonly metadata: ProviderMetadata;
  // TODO: move close from client Provider here once we want it in server
}