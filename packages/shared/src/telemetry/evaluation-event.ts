import { ErrorCode, StandardResolutionReasons, type EvaluationDetails, type FlagValue } from '../evaluation/evaluation';
import type { HookContext } from '../hooks/hooks';
import type { JsonValue } from '../types';
import {
  TELEMETRY_ATTR_FEATURE_FLAG_CONTEXT_ID,
  TELEMETRY_ATTR_FEATURE_FLAG_ERROR_MESSAGE,
  TELEMETRY_ATTR_FEATURE_FLAG_ERROR_TYPE,
  TELEMETRY_ATTR_FEATURE_FLAG_KEY,
  TELEMETRY_ATTR_FEATURE_FLAG_PROVIDER,
  TELEMETRY_ATTR_FEATURE_FLAG_REASON,
  TELEMETRY_ATTR_FEATURE_FLAG_SET_ID,
  TELEMETRY_ATTR_FEATURE_FLAG_VARIANT,
  TELEMETRY_ATTR_FEATURE_FLAG_VERSION,
} from './attributes';
import { TELEMETRY_EVAL_DATA_VALUE } from './evaluation-data';
import {
  TELEMETRY_FLAG_METADATA_CONTEXT_ID,
  TELEMETRY_FLAG_METADATA_SET_ID,
  TELEMETRY_FLAG_METADATA_VERSION,
} from './flag-metadata';

type EvaluationEvent = {
  name: string;
  attributes: Record<string, string | number | boolean>;
  data: Record<string, JsonValue>;
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
    [TELEMETRY_ATTR_FEATURE_FLAG_KEY]: hookContext.flagKey,
    [TELEMETRY_ATTR_FEATURE_FLAG_PROVIDER]: hookContext.providerMetadata.name,
    [TELEMETRY_ATTR_FEATURE_FLAG_REASON]: (evaluationDetails.reason ?? StandardResolutionReasons.UNKNOWN).toLowerCase(),
  };
  const data: EvaluationEvent['data'] = {};

  if (evaluationDetails.variant) {
    attributes[TELEMETRY_ATTR_FEATURE_FLAG_VARIANT] = evaluationDetails.variant;
  } else {
    data[TELEMETRY_EVAL_DATA_VALUE] = evaluationDetails.value;
  }

  const contextId =
    evaluationDetails.flagMetadata[TELEMETRY_FLAG_METADATA_CONTEXT_ID] || hookContext.context.targetingKey;
  if (contextId) {
    attributes[TELEMETRY_ATTR_FEATURE_FLAG_CONTEXT_ID] = contextId;
  }

  const setId = evaluationDetails.flagMetadata[TELEMETRY_FLAG_METADATA_SET_ID];
  if (setId) {
    attributes[TELEMETRY_ATTR_FEATURE_FLAG_SET_ID] = setId;
  }

  const version = evaluationDetails.flagMetadata[TELEMETRY_FLAG_METADATA_VERSION];
  if (version) {
    attributes[TELEMETRY_ATTR_FEATURE_FLAG_VERSION] = version;
  }

  if (evaluationDetails.reason === StandardResolutionReasons.ERROR) {
    attributes[TELEMETRY_ATTR_FEATURE_FLAG_ERROR_TYPE] = (
      evaluationDetails.errorCode ?? ErrorCode.GENERAL
    ).toLowerCase();
    if (evaluationDetails.errorMessage) {
      attributes[TELEMETRY_ATTR_FEATURE_FLAG_ERROR_MESSAGE] = evaluationDetails.errorMessage;
    }
  }

  return {
    name: FLAG_EVALUATION_EVENT_NAME,
    attributes,
    data,
  };
}
