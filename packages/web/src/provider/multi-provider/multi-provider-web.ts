import type {
  EvaluationContext,
  FlagValueType,
  Hook,
  HookContext,
  HookHints,
  JsonValue,
  Logger,
  Provider,
  ProviderMetadata,
  BeforeHookContext,
  ResolutionDetails,
  FlagMetadata,
  EvaluationDetails,
  FlagValue,
  OpenFeatureError,
  TrackingEventDetails,
} from '@openfeature/web-sdk';
import {
  DefaultLogger,
  GeneralError,
  OpenFeatureEventEmitter,
  ErrorCode,
  StandardResolutionReasons,
} from '@openfeature/web-sdk';
import { HookExecutor } from './hook-executor';
import { constructAggregateError, throwAggregateErrorFromPromiseResults } from './errors';
import type { BaseEvaluationStrategy, ProviderResolutionResult } from './strategies';
import { FirstMatchStrategy } from './strategies';
import { StatusTracker } from './status-tracker';
import type { ProviderEntryInput, RegisteredProvider } from './types';

export class WebMultiProvider implements Provider {
  readonly runsOn = 'client';

  public readonly events = new OpenFeatureEventEmitter();

  private hookContexts: WeakMap<EvaluationContext, HookContext> = new WeakMap<EvaluationContext, HookContext>();
  private hookHints: WeakMap<EvaluationContext, HookHints> = new WeakMap<EvaluationContext, HookHints>();

  metadata: ProviderMetadata;

  providerEntries: RegisteredProvider[] = [];
  private providerEntriesByName: Record<string, RegisteredProvider> = {};

  private hookExecutor: HookExecutor;
  private statusTracker = new StatusTracker(this.events);

  constructor(
    readonly constructorProviders: ProviderEntryInput[],
    private readonly evaluationStrategy: BaseEvaluationStrategy = new FirstMatchStrategy(),
    private readonly logger: Logger = new DefaultLogger(),
  ) {
    this.hookExecutor = new HookExecutor(this.logger);

    this.registerProviders(constructorProviders);

    const aggregateMetadata = Object.keys(this.providerEntriesByName).reduce((acc, name) => {
      return { ...acc, [name]: this.providerEntriesByName[name].provider.metadata };
    }, {});

    this.metadata = {
      ...aggregateMetadata,
      name: WebMultiProvider.name,
    };
  }

  private registerProviders(constructorProviders: ProviderEntryInput[]) {
    const providersByName: Record<string, Provider[]> = {};

    for (const constructorProvider of constructorProviders) {
      const providerName = constructorProvider.provider.metadata.name;
      const candidateName = constructorProvider.name ?? providerName;

      if (constructorProvider.name && providersByName[constructorProvider.name]) {
        throw new Error('Provider names must be unique');
      }

      providersByName[candidateName] ??= [];
      providersByName[candidateName].push(constructorProvider.provider);
    }

    for (const name of Object.keys(providersByName)) {
      const useIndexedNames = providersByName[name].length > 1;
      for (let i = 0; i < providersByName[name].length; i++) {
        const indexedName = useIndexedNames ? `${name}-${i + 1}` : name;
        this.providerEntriesByName[indexedName] = { provider: providersByName[name][i], name: indexedName };
        this.providerEntries.push(this.providerEntriesByName[indexedName]);
        this.statusTracker.wrapEventHandler(this.providerEntriesByName[indexedName]);
      }
    }

    // just make sure we don't accidentally modify these later
    Object.freeze(this.providerEntries);
    Object.freeze(this.providerEntriesByName);
  }

  async initialize(context?: EvaluationContext): Promise<void> {
    const result = await Promise.allSettled(
      this.providerEntries.map((provider) => provider.provider.initialize?.(context)),
    );
    throwAggregateErrorFromPromiseResults(result, this.providerEntries);
  }

  async onClose() {
    const result = await Promise.allSettled(this.providerEntries.map((provider) => provider.provider.onClose?.()));
    throwAggregateErrorFromPromiseResults(result, this.providerEntries);
  }

  async onContextChange(oldContext: EvaluationContext, newContext: EvaluationContext) {
    for (const providerEntry of this.providerEntries) {
      await providerEntry.provider.onContextChange?.(oldContext, newContext);
    }
  }

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    context: EvaluationContext,
  ): ResolutionDetails<boolean> {
    return this.flagResolutionProxy<boolean>(flagKey, 'boolean', defaultValue, context);
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    context: EvaluationContext,
  ): ResolutionDetails<string> {
    return this.flagResolutionProxy(flagKey, 'string', defaultValue, context);
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    context: EvaluationContext,
  ): ResolutionDetails<number> {
    return this.flagResolutionProxy(flagKey, 'number', defaultValue, context);
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
  ): ResolutionDetails<T> {
    return this.flagResolutionProxy(flagKey, 'object', defaultValue, context);
  }

  track(trackingEventName: string, context: EvaluationContext, trackingEventDetails: TrackingEventDetails): void {
    for (const providerEntry of this.providerEntries) {
      if (!providerEntry.provider.track) {
        continue;
      }

      const strategyContext = {
        provider: providerEntry.provider,
        providerName: providerEntry.name,
        providerStatus: this.statusTracker.providerStatus(providerEntry.name),
      };

      if (
        this.evaluationStrategy.shouldTrackWithThisProvider(
          strategyContext,
          context,
          trackingEventName,
          trackingEventDetails,
        )
      ) {
        try {
          providerEntry.provider.track?.(trackingEventName, context, trackingEventDetails);
        } catch (error) {
          this.logger.error(
            `Error tracking event "${trackingEventName}" with provider "${providerEntry.name}":`,
            error,
          );
        }
      }
    }
  }

  private flagResolutionProxy<T extends boolean | string | number | JsonValue>(
    flagKey: string,
    flagType: FlagValueType,
    defaultValue: T,
    context: EvaluationContext,
  ): ResolutionDetails<T> {
    const hookContext = this.hookContexts.get(context);
    const hookHints = this.hookHints.get(context);

    if (!hookContext || !hookHints) {
      throw new GeneralError('Hook context not available for evaluation');
    }

    const results = [] as (ProviderResolutionResult<T> | null)[];

    for (const providerEntry of this.providerEntries) {
      const [shouldEvaluateNext, result] = this.evaluateProviderEntry(
        flagKey,
        flagType,
        defaultValue,
        providerEntry,
        hookContext,
        hookHints,
        context,
      );

      results.push(result);

      if (!shouldEvaluateNext) {
        break;
      }
    }

    const resolutions = results.filter((r): r is ProviderResolutionResult<T> => Boolean(r));
    const finalResult = this.evaluationStrategy.determineFinalResult({ flagKey, flagType }, context, resolutions);

    if (finalResult.errors?.length) {
      throw constructAggregateError(finalResult.errors);
    }

    if (!finalResult.details) {
      throw new GeneralError('No result was returned from any provider');
    }

    return finalResult.details;
  }

  private evaluateProviderEntry<T extends boolean | string | number | JsonValue>(
    flagKey: string,
    flagType: FlagValueType,
    defaultValue: T,
    providerEntry: RegisteredProvider,
    hookContext: HookContext,
    hookHints: HookHints,
    context: EvaluationContext,
  ): [shouldEvaluateNext: boolean, ProviderResolutionResult<T> | null] {
    let evaluationResult: ResolutionDetails<T> | undefined = undefined;
    const provider = providerEntry.provider;
    const strategyContext = {
      flagKey,
      flagType,
      provider,
      providerName: providerEntry.name,
      providerStatus: this.statusTracker.providerStatus(providerEntry.name),
    };

    if (!this.evaluationStrategy.shouldEvaluateThisProvider(strategyContext, context)) {
      return [true, null];
    }

    let resolution: ProviderResolutionResult<T>;

    try {
      evaluationResult = this.evaluateProviderAndHooks(flagKey, defaultValue, provider, hookContext, hookHints);
      resolution = {
        details: evaluationResult,
        provider: provider,
        providerName: providerEntry.name,
      };
    } catch (error: unknown) {
      resolution = {
        thrownError: error,
        provider: provider,
        providerName: providerEntry.name,
      };
    }

    return [this.evaluationStrategy.shouldEvaluateNextProvider(strategyContext, context, resolution), resolution];
  }

  private evaluateProviderAndHooks<T extends boolean | string | number | JsonValue>(
    flagKey: string,
    defaultValue: T,
    provider: Provider,
    hookContext: HookContext,
    hookHints: HookHints,
  ) {
    let evaluationDetails: EvaluationDetails<T>;

    try {
      this.hookExecutor.beforeHooks(provider.hooks, hookContext, hookHints);

      const resolutionDetails = this.callProviderResolve<T>(
        provider,
        flagKey,
        defaultValue,
        hookContext.context,
      ) as ResolutionDetails<T>;

      evaluationDetails = {
        ...resolutionDetails,
        flagMetadata: Object.freeze(resolutionDetails.flagMetadata ?? {}),
        flagKey,
      };

      this.hookExecutor.afterHooks(provider.hooks, hookContext, evaluationDetails, hookHints);
    } catch (error: unknown) {
      this.hookExecutor.errorHooks(provider.hooks, hookContext, error, hookHints);
      evaluationDetails = this.getErrorEvaluationDetails(flagKey, defaultValue, error);
    }
    this.hookExecutor.finallyHooks(provider.hooks, hookContext, evaluationDetails, hookHints);
    return evaluationDetails;
  }

  private callProviderResolve<T extends boolean | string | number | JsonValue>(
    provider: Provider,
    flagKey: string,
    defaultValue: T,
    context: EvaluationContext,
  ) {
    switch (typeof defaultValue) {
      case 'string':
        return provider.resolveStringEvaluation(flagKey, defaultValue, context, this.logger);
      case 'number':
        return provider.resolveNumberEvaluation(flagKey, defaultValue, context, this.logger);
      case 'object':
        return provider.resolveObjectEvaluation(flagKey, defaultValue, context, this.logger);
      case 'boolean':
        return provider.resolveBooleanEvaluation(flagKey, defaultValue, context, this.logger);
      default:
        throw new GeneralError('Invalid flag evaluation type');
    }
  }

  public get hooks(): Hook[] {
    return [
      {
        before: (hookContext: BeforeHookContext, hints: HookHints): EvaluationContext => {
          this.hookContexts.set(hookContext.context, hookContext);
          this.hookHints.set(hookContext.context, hints ?? {});
          return hookContext.context;
        },
      },
    ];
  }

  private getErrorEvaluationDetails<T extends FlagValue>(
    flagKey: string,
    defaultValue: T,
    err: unknown,
    flagMetadata: FlagMetadata = {},
  ): EvaluationDetails<T> {
    const errorMessage: string = (err as Error)?.message;
    const errorCode: ErrorCode = (err as OpenFeatureError)?.code || ErrorCode.GENERAL;

    return {
      errorCode,
      errorMessage,
      value: defaultValue,
      reason: StandardResolutionReasons.ERROR,
      flagMetadata: Object.freeze(flagMetadata),
      flagKey,
    };
  }
}
