import { ErrorCode, StandardResolutionReasons, type EvaluationDetails, type FlagValue } from '../evaluation';
import type { HookContext } from '../hooks';
import { TelemetryAttribute } from './attributes';
import { TelemetryFlagMetadata } from './flag-metadata';

/**
 * Attribute types for OpenTelemetry.
 * @see https://github.com/open-telemetry/opentelemetry-js/blob/fbbce6e1c0de86e4c504b5788d876fae4d3bc254/api/src/common/Attributes.ts#L35
 */
export declare type AttributeValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[];

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
  attributes: Record<string, AttributeValue | undefined>;
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
  }

  if (evaluationDetails.value !== null) {
    if (typeof evaluationDetails.value !== 'object') {
      attributes[TelemetryAttribute.VALUE] = evaluationDetails.value;
    } else {
      try {
        // Objects are not valid attribute values, so we convert them to a JSON string
        attributes[TelemetryAttribute.VALUE] = JSON.stringify(evaluationDetails.value);
      } catch {
        // We ignore non serializable values
      }
    }
  }

  const contextId =
    evaluationDetails.flagMetadata[TelemetryFlagMetadata.CONTEXT_ID] ?? hookContext.context.targetingKey;
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
