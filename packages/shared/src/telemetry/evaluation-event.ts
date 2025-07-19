import { ErrorCode, StandardResolutionReasons, type EvaluationDetails, type FlagValue } from '../evaluation/evaluation';
import type { HookContext } from '../hooks/hooks';
import { TelemetryAttribute } from './attributes';
import { TelemetryFlagMetadata } from './flag-metadata';

type EvaluationEvent = {
  /**
   * The name of the feature flag evaluation event.
   */
  name: string;
  /**
   * The attributes of an OpenTelemetry compliant event for flag evaluation.
   * @experimental The attributes are subject to change.
   * @see https://opentelemetry.io/docs/specs/semconv/feature-flags/feature-flags-logs/
   */
  attributes: Record<string, string | number | boolean | FlagValue>;
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

  if (evaluationDetails.variant) {
    attributes[TelemetryAttribute.VARIANT] = evaluationDetails.variant;
  } else {
    attributes[TelemetryAttribute.VALUE] = evaluationDetails.value;
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
  };
}
