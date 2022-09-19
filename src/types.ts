/**
 * Represents a JSON value of a JSON object
 */
export type JSONValue = null | string | number | boolean | Date | { [x: string]: JSONValue } | Array<JSONValue>;

export type EvaluationContext = {
  /**
   * A string uniquely identifying the subject (end-user, or client service) of a flag evaluation.
   * Providers may require this field for fractional flag evaluation, rules, or overrides targeting specific users. Such providers may behave unpredictably if a targeting key is not specified at flag resolution.
   */
  targetingKey?: string;
} & Record<string, JSONValue>;

export type FlagValue = boolean | string | number | object;

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
   * Get a boolean flag value.
   */
  getBooleanValue(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<boolean>;

  /**
   * Get a boolean flag with additional details.
   */
  getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<boolean>>;

  /**
   * Get a string flag value.
   */
  getStringValue(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<string>;

  /**
   * Get a string flag with additional details.
   */
  getStringDetails(
    flagKey: string,
    defaultValue: string,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<string>>;

  /**
   * Get a number flag value.
   */
  getNumberValue(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<number>;

  /**
   * Get a number flag with additional details.
   */
  getNumberDetails(
    flagKey: string,
    defaultValue: number,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<EvaluationDetails<number>>;

  /**
   * Get an object (JSON) flag value.
   */
  getObjectValue<T extends object>(
    flagKey: string,
    defaultValue: T,
    context?: EvaluationContext,
    options?: FlagEvaluationOptions
  ): Promise<T>;

  /**
   * Get an object (JSON) flag with additional details.
   */
  getObjectDetails<T extends object>(
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
  resolveObjectEvaluation<U extends object>(
    flagKey: string,
    defaultValue: U,
    context: EvaluationContext,
    logger: Logger
  ): Promise<ResolutionDetails<U>>;
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
}

interface EvaluationLifeCycle<T> {
  addHooks(...hooks: Hook[]): T;
  getHooks(): Hook[];
  clearHooks(): T;
}

interface ManageContext<T> {
  getContext(): EvaluationContext;
  setContext(context: EvaluationContext): T;
}

interface ManageLogger<T> {
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
