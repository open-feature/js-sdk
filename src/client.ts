import { ERROR_REASON, GENERAL_ERROR } from './constants';
import { OpenFeature } from './open-feature';
import {
  Client,
  EvaluationContext,
  EvaluationDetails,
  FlagEvaluationOptions,
  FlagValue,
  Hook,
  ResolutionDetails,
  TransformingProvider,
} from './types';

type OpenFeatureClientOptions = {
  name?: string;
  version?: string;
};

export class OpenFeatureClient implements Client {
  name?: string | undefined;
  version?: string | undefined;
  readonly context: EvaluationContext;

  constructor(private readonly api: OpenFeature, options: OpenFeatureClientOptions, context: EvaluationContext = {}) {
    this.name = options.name;
    this.version = options.version;
    this.context = context;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  addHooks(...hooks: Hook<FlagValue>[]): void {
    throw new Error('Method not implemented.');
  }

  get hooks(): Hook<FlagValue>[] {
    throw new Error('Method not implemented.');
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
    return this.evaluate<boolean>(flagKey, this.provider.resolveBooleanEvaluation, defaultValue, context, options);
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
    return this.evaluate<string>(flagKey, this.provider.resolveStringEvaluation, defaultValue, context, options);
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
    return this.evaluate<number>(flagKey, this.provider.resolveNumberEvaluation, defaultValue, context, options);
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
    return this.evaluate<T>(flagKey, this.provider.resolveObjectEvaluation, defaultValue, context, options);
  }

  private async evaluate<T extends FlagValue>(
    flagKey: string,
    resolver: (
      flagKey: string,
      defaultValue: T,
      transformedContext: unknown,
      options: FlagEvaluationOptions | undefined
    ) => Promise<ResolutionDetails<T>>,
    defaultValue: T,
    context: EvaluationContext = {},
    options: FlagEvaluationOptions = {}
  ): Promise<EvaluationDetails<T>> {
    // merge global, client, and evaluation context
    const mergedContext = {
      ...this.api.context,
      ...this.context,
      ...context,
    };

    try {
      // if a transformer is defined, run it to prepare the context.
      const transformedContext =
        typeof this.provider.contextTransformer === 'function'
          ? await this.provider.contextTransformer(mergedContext)
          : mergedContext;

      // run the referenced resolver, binding the provider.
      const resolution = await resolver.call(this.provider, flagKey, defaultValue, transformedContext, options);
      return {
        ...resolution,
        flagKey,
      };
    } catch (err: unknown) {
      const errorCode = (!!err && (err as { code: string }).code) || GENERAL_ERROR;
      return {
        errorCode,
        value: defaultValue,
        reason: ERROR_REASON,
        flagKey,
      };
    }
  }

  private get provider() {
    return OpenFeature.instance.provider as TransformingProvider<unknown>;
  }
}
