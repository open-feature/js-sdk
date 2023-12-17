import { createParamDecorator, Inject } from '@nestjs/common';
import { EvaluationContext, FlagValue, JsonValue, OpenFeature } from '@openfeature/server-sdk';
import { getOpenFeatureClientToken } from './open-feature.module';
import { from } from 'rxjs';
import { OpenFeatureContextService } from './feature.service';
import { SharedAsyncLocalStorage } from './async-storage';

interface FeatureClientProps {
  name?: string;
}

export const FeatureClient = (props?: FeatureClientProps) => Inject(getOpenFeatureClientToken(props?.name));
export const FeatureContextService = () => Inject(OpenFeatureContextService);

interface FeatureProps<T extends FlagValue> {
  clientName?: string;
  flagKey: string;
  defaultValue: T;
  context?: EvaluationContext;
}

function getClientForEvaluation(clientName?: string, context?: EvaluationContext) {
  return clientName ? OpenFeature.getClient(clientName, context) : OpenFeature.getClient(context);
}

export const BooleanFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue }: FeatureProps<boolean>) => {
    const client = getClientForEvaluation(clientName);
    return from(client.getBooleanDetails(flagKey, defaultValue, SharedAsyncLocalStorage.getStore()?.context));
  },
);

export const StringFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue, context }: FeatureProps<string>) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getStringDetails(flagKey, defaultValue, SharedAsyncLocalStorage.getStore()?.context));
  },
);

export const NumberFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue, context }: FeatureProps<number>) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getNumberDetails(flagKey, defaultValue, SharedAsyncLocalStorage.getStore()?.context));
  },
);

export const ObjectFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue, context }: FeatureProps<JsonValue>) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getObjectDetails(flagKey, defaultValue, SharedAsyncLocalStorage.getStore()?.context));
  },
);
