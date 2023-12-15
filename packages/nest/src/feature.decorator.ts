import { createParamDecorator, ExecutionContext, Inject } from '@nestjs/common';
import { EvaluationContext, FlagValue, JsonValue, OpenFeature } from '@openfeature/server-sdk';
import { getOpenFeatureClientToken } from './open-feature.module';
import { from, range } from 'rxjs';
import { asyncLocalStorage } from './feature.interceptor';
import 'reflect-metadata';

interface FeatureClientProps {
  name?: string;
}

export const FeatureClient = (props?: FeatureClientProps) => Inject(getOpenFeatureClientToken(props?.name));

interface FeatureProps<T extends FlagValue> {
  clientName?: string;
  flagKey: string;
  defaultValue: T;
  context?: EvaluationContext;
  contextFactory?: (executionContext: ExecutionContext) => EvaluationContext | undefined;
}

/**
 *
 * @param clientName
 * @param context
 */
function getClientForEvaluation(clientName?: string, context?: EvaluationContext) {
  //is context thread safe? setting it here might result in context from different requests mixing up
  return clientName ? OpenFeature.getClient(clientName, context) : OpenFeature.getClient(context);
}

const baseFeatureFlag = <T extends FlagValue>(method: 'getObjectDetails' | 'getBooleanDetails' | 'getStringDetails' | 'getNumberDetails') => createParamDecorator(
  (
    { clientName, flagKey, defaultValue, context, contextFactory }: FeatureProps<T>,
    executionContext: ExecutionContext,
  ) => {
    const injectedCtx = asyncLocalStorage.getStore();

    const client = getClientForEvaluation(clientName, context);
    return from((client as any)[method](flagKey, defaultValue, {
      ...(injectedCtx && injectedCtx),
      ...(contextFactory && contextFactory?.(executionContext))
    }));
  },
);

export const BooleanFeatureFlag = baseFeatureFlag<boolean>('getBooleanDetails');
export const StringFeatureFlag = baseFeatureFlag<string>('getStringDetails');
export const NumberFeatureFlag = baseFeatureFlag<number>('getNumberDetails');
export const ObjectFeatureFlag = baseFeatureFlag<JsonValue>('getObjectDetails');

const featureFlagMetadataKey = Symbol('feature-flag-metadata');

const featureFlagDetailsDecoratorFactory = <T extends FlagValue>() => ({ flag, defaultValue, clientName, aditionalContext }: { flag: string, defaultValue: T, clientName?: string; aditionalContext?: any }) => (target: Object, propertyKey: string | symbol, parameterIndex: number) => {
  const existingFeatureFlagParameters: any[] = Reflect.getOwnMetadata(featureFlagMetadataKey, target, propertyKey) || [];
  existingFeatureFlagParameters.push({
    flag,
    defaultValue,
    parameterIndex,
    clientName,
    aditionalContext,
  });
  Reflect.defineMetadata(featureFlagMetadataKey, existingFeatureFlagParameters, target, propertyKey);
};

export const BooleanFFlagDetails = featureFlagDetailsDecoratorFactory<boolean>();

export const ResolveFeatureFlags = (target: any, propertyName: string, descriptor: TypedPropertyDescriptor<any>) => {
  const method = descriptor.value!;

  descriptor.value = async function() {
    const featureFlagParameters: any[] = Reflect.getOwnMetadata(featureFlagMetadataKey, target, propertyName);
    const featureFlagsResolution: any[] = await Promise.all(featureFlagParameters.map(resolveFlagDetails));

    for (let i = 0; i < featureFlagParameters.length; i++) {
      const paramIdx = featureFlagParameters[i].parameterIndex;

      if (!arguments[paramIdx]) {
        arguments.length += 1;
      }

      arguments[paramIdx] = featureFlagsResolution[i];
    }

    return method.apply(this, arguments);
  };
};

const resolveFlagDetails = ({ flag, defaultValue, clientName, aditionalContext }: any) => {
  const client = OpenFeature.getClient(clientName);
  const ctxt = { ...asyncLocalStorage.getStore(), ...(aditionalContext && aditionalContext) };

  switch (typeof defaultValue) {
    case ('boolean'):
      return client.getBooleanDetails(flag, defaultValue, ctxt );
    case ('string'):
      return client.getStringDetails(flag, defaultValue, ctxt);
    case ('number'):
      return client.getNumberDetails(flag, defaultValue, ctxt);
    case ('object'):
      return client.getObjectDetails(flag, defaultValue, ctxt);
    default:
      return Promise.reject();
  }
};
