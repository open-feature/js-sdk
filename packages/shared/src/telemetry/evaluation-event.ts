import { ErrorCode, StandardResolutionReasons, type EvaluationDetails, type FlagValue } from '../evaluation/evaluation';
import type { HookContext } from '../hooks/hooks';
import type { JsonValue } from '../types';
import { TelemetryAttribute } from './attributes';
import { TelemetryEvaluationData } from './evaluation-data';
import { TelemetryFlagMetadata } from './flag-metadata';

type EvaluationEvent = {
  name: string;
  attributes: Record<string, string | number | boolean>;
  body: Record<string, JsonValue>;
};

const FLAG_EVALUATION_EVENT_NAME = 'feature_flag.evaluation';

/**
 * Returns an OpenTelemetry compliant event for flag evaluation.
 * @param {HookContext} hookContext Contextual information about the flag evaluation
 * @param {EvaluationDetails} evaluationDetails The details of the flag evaluation
 * @returns {EvaluationEvent} An evaluation event object containing the event name and attributes
 */
export function createEvaluationEvent(
  hookContext: Readonly<HookContext<FlagValue>>,
  evaluationDetails: EvaluationDetails<FlagValue>,
): EvaluationEvent {
  const attributes: EvaluationEvent['attributes'] = {
    [TelemetryAttribute.KEY]: hookContext.flagKey,
    [TelemetryAttribute.PROVIDER]: hookContext.providerMetadata.name,
    [TelemetryAttribute.REASON]: (evaluationDetails.reason ?? StandardResolutionReasons.UNKNOWN).toLowerCase(),
  };
  const body: EvaluationEvent['body'] = {};

  if (evaluationDetails.variant) {
    attributes[TelemetryAttribute.VARIANT] = evaluationDetails.variant;
  } else {
    body[TelemetryEvaluationData.VALUE] = evaluationDetails.value;
  }

  const contextId =
    evaluationDetails.flagMetadata[TelemetryFlagMetadata.CONTEXT_ID] || hookContext.context.targetingKey;
  if (contextId) {
    attributes[TelemetryAttribute.CONTEXT_ID] = contextId;
  }

  const setId = evaluationDetails.flagMetadata[TelemetryFlagMetadata.FLAG_SET_ID];
  if (setId) {
    attributes[TelemetryAttribute.FLAG_SET_ID] = setId;
  }

  const version = evaluationDetails.flagMetadata[TelemetryFlagMetadata.VERSION];
  if (version) {
    attributes[TelemetryAttribute.VERSION] = version;
  }

  if (evaluationDetails.reason === StandardResolutionReasons.ERROR) {
    attributes[TelemetryAttribute.ERROR_CODE] = (evaluationDetails.errorCode ?? ErrorCode.GENERAL).toLowerCase();
    if (evaluationDetails.errorMessage) {
      attributes[TelemetryAttribute.ERROR_MESSAGE] = evaluationDetails.errorMessage;
    }
  }

  return {
    name: FLAG_EVALUATION_EVENT_NAME,
    attributes,
    body,
  };
}
