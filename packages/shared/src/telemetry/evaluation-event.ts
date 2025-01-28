import { ErrorCode, StandardResolutionReasons, type EvaluationDetails, type FlagValue } from '../evaluation/evaluation';
import type { HookContext } from '../hooks/hooks';
import type { JsonValue } from '../types';
import { TELEMETRY_ATTRIBUTE } from './attributes';
import { TELEMETRY_FLAG_METADATA } from './flag-metadata';

export const EVENT_NAME = 'feature_flag.evaluation';

interface EvaluationEvent {
  name: string;
  attributes: Record<string, string | number | boolean>;
  data: Record<string, JsonValue>;
}

/**
 * Returns an OpenTelemetry compliant event for flag evaluation.
 * @param hookContext Contextual information about the flag evaluation
 * @param evaluationDetails The details of the flag evaluation
 * @returns An evaluation event object containing the event name and attributes
 */
export function createEvaluationEvent(
  hookContext: Readonly<HookContext<FlagValue>>,
  evaluationDetails: EvaluationDetails<FlagValue>,
): EvaluationEvent {
  const attributes: EvaluationEvent['attributes'] = {
    [TELEMETRY_ATTRIBUTE.KEY]: hookContext.flagKey,
    [TELEMETRY_ATTRIBUTE.PROVIDER]: hookContext.providerMetadata.name,
    [TELEMETRY_ATTRIBUTE.REASON]: (evaluationDetails.reason ?? StandardResolutionReasons.UNKNOWN).toLowerCase(),
  };
  const data: EvaluationEvent['data'] = {};

  if (evaluationDetails.variant) {
    attributes[TELEMETRY_ATTRIBUTE.VARIANT] = evaluationDetails.variant;
  } else {
    data[TELEMETRY_ATTRIBUTE.VALUE] = evaluationDetails.value;
  }

  const contextId =
    evaluationDetails.flagMetadata[TELEMETRY_FLAG_METADATA.CONTEXT_ID] || hookContext.context.targetingKey;
  if (contextId) {
    attributes[TELEMETRY_ATTRIBUTE.CONTEXT_ID] = contextId;
  }

  const setId = evaluationDetails.flagMetadata[TELEMETRY_FLAG_METADATA.SET_ID];
  if (setId) {
    attributes[TELEMETRY_ATTRIBUTE.SET_ID] = setId;
  }

  const version = evaluationDetails.flagMetadata[TELEMETRY_FLAG_METADATA.VERSION];
  if (version) {
    attributes[TELEMETRY_ATTRIBUTE.VERSION] = version;
  }

  if (evaluationDetails.reason === StandardResolutionReasons.ERROR) {
    attributes[TELEMETRY_ATTRIBUTE.ERROR_CODE] = (evaluationDetails.errorCode ?? ErrorCode.GENERAL).toLowerCase();
    if (evaluationDetails.errorMessage) {
      attributes[TELEMETRY_ATTRIBUTE.ERROR_MESSAGE] = evaluationDetails.errorMessage;
    }
  }

  return {
    name: EVENT_NAME,
    attributes,
    data,
  };
}
