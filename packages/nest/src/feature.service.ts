import { EvaluationContext, EvaluationDetails, OpenFeatureClient, OpenFeature, FlagEvaluationOptions, JsonValue } from '@openfeature/server-sdk';
import { ContextAsyncStorage } from './async-storage';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OpenFeatureContextService {
  constructor(private asyncLocalStorage: ContextAsyncStorage) {}

  public getContext(): EvaluationContext | undefined {
    return this.asyncLocalStorage.getStore()?.context;
  }
}

interface IOpenFeatureClientService extends Pick<OpenFeatureClient, 'getBooleanDetails' | 'getStringDetails' | 'getNumberDetails' | 'getObjectDetails' | 'getBooleanValue' | 'getStringValue' | 'getNumberValue' | 'getObjectValue'> { }

export class OpenFeatureClientService implements IOpenFeatureClientService {
  constructor(private readonly openFeatureContextService: OpenFeatureContextService, private readonly provider: string) { }

  getBooleanDetails(flagKey: string, defaultValue: boolean, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<EvaluationDetails<boolean>> {
    const client = OpenFeature.getClient(this.provider);

    return client.getBooleanDetails(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }

  getBooleanValue(flagKey: string, defaultValue: boolean, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<boolean> {
    const client = OpenFeature.getClient(this.provider);

    return client.getBooleanValue(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }

  getNumberDetails<T extends number = number>(flagKey: string, defaultValue: T, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<EvaluationDetails<T>> {
    const client = OpenFeature.getClient(this.provider);

    return client.getNumberDetails<T>(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }

  getNumberValue<T extends number = number>(flagKey: string, defaultValue: T, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<T> {
    const client = OpenFeature.getClient(this.provider);

    return client.getNumberValue<T>(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }

  getStringDetails<T extends string=string>(flagKey: string, defaultValue: T, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<EvaluationDetails<T>> {
    const client = OpenFeature.getClient(this.provider);

    return client.getStringDetails<T>(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }

  getStringValue<T extends string=string>(flagKey: string, defaultValue: T, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<T> {
    const client = OpenFeature.getClient(this.provider);

    return client.getStringValue<T>(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }


  getObjectDetails<T extends JsonValue = JsonValue>(flagKey: string, defaultValue: T, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<EvaluationDetails<T>> {
    const client = OpenFeature.getClient(this.provider);

    return client.getObjectDetails<T>(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }

  getObjectValue<T extends JsonValue = JsonValue>(flagKey: string, defaultValue: T, aditionalContext?: EvaluationContext | undefined, options?: FlagEvaluationOptions | undefined): Promise<T> {
    const client = OpenFeature.getClient(this.provider);

    return client.getObjectValue<T>(flagKey, defaultValue, { ...this.openFeatureContextService.getContext(), ...aditionalContext }, options);
  }

}
