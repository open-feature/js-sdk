import { createParamDecorator, ExecutionContext, Inject } from '@nestjs/common';
import { EvaluationContext, FlagValue, JsonValue, OpenFeature } from '@openfeature/server-sdk';
import { getOpenFeatureClientToken } from './open-feature.module';
import { from } from 'rxjs';

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

function getClientForEvaluation(clientName?: string, context?: EvaluationContext) {
  return clientName ? OpenFeature.getClient(clientName, context) : OpenFeature.getClient(context);
}

export const BooleanFeatureFlag = createParamDecorator(
  (
    { clientName, flagKey, defaultValue, context, contextFactory }: FeatureProps<boolean>,
    executionContext: ExecutionContext,
  ) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getBooleanDetails(flagKey, defaultValue, contextFactory?.(executionContext)));
  },
);

export const StringFeatureFlag = createParamDecorator(
  (
    { clientName, flagKey, defaultValue, context, contextFactory }: FeatureProps<string>,
    executionContext: ExecutionContext,
  ) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getStringDetails(flagKey, defaultValue, contextFactory?.(executionContext)));
  },
);

export const NumberFeatureFlag = createParamDecorator(
  (
    { clientName, flagKey, defaultValue, context, contextFactory }: FeatureProps<number>,
    executionContext: ExecutionContext,
  ) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getNumberDetails(flagKey, defaultValue, contextFactory?.(executionContext)));
  },
);

export const ObjectFeatureFlag = createParamDecorator(
  (
    { clientName, flagKey, defaultValue, context, contextFactory }: FeatureProps<JsonValue>,
    executionContext: ExecutionContext,
  ) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getObjectDetails(flagKey, defaultValue, contextFactory?.(executionContext)));
  },
);
