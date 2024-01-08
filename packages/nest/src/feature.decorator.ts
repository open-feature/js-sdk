import { createParamDecorator, Inject } from '@nestjs/common';
import { EvaluationContext, FlagValue, JsonValue, OpenFeature, Client } from '@openfeature/server-sdk';
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
}

/**
 * Returns an OpenFeature client with the given context.
 * @param {string} clientName The name of the OpenFeature client.
 * @param {EvaluationContext} context The evaluation context of the client.
 * @returns {Client} The OpenFeature client.
 */
function getClientForEvaluation(clientName?: string, context?: EvaluationContext) {
  return clientName ? OpenFeature.getClient(clientName, context) : OpenFeature.getClient(context);
}

export const BooleanFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue, context }: FeatureProps<boolean>) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getBooleanDetails(flagKey, defaultValue));
  },
);

export const StringFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue, context }: FeatureProps<string>) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getStringDetails(flagKey, defaultValue));
  },
);

export const NumberFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue, context }: FeatureProps<number>) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getNumberDetails(flagKey, defaultValue));
  },
);

export const ObjectFeatureFlag = createParamDecorator(
  ({ clientName, flagKey, defaultValue, context }: FeatureProps<JsonValue>) => {
    const client = getClientForEvaluation(clientName, context);
    return from(client.getObjectDetails(flagKey, defaultValue));
  },
);
