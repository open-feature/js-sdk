import { createEvaluationEvent } from '../src/telemetry/evaluation-event';
import { ErrorCode, StandardResolutionReasons, type EvaluationDetails } from '../src/evaluation/evaluation';
import type { HookContext } from '../src/hooks/hooks';
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
} from '../src/telemetry/attributes';
import {
  TELEMETRY_FLAG_METADATA_CONTEXT_ID,
  TELEMETRY_FLAG_METADATA_SET_ID,
  TELEMETRY_FLAG_METADATA_VERSION,
} from '../src/telemetry/flag-metadata';
import { TELEMETRY_EVAL_DATA_VALUE } from '../src/telemetry/evaluation-data';

describe('evaluationEvent', () => {
  const flagKey = 'test-flag';
  const providerMetadata = {
    name: 'test-provider',
  };
  const mockHookContext: HookContext<boolean> = {
    flagKey,
    providerMetadata: providerMetadata,
    context: {
      targetingKey: 'test-target',
    },
    clientMetadata: {
      providerMetadata,
    },
    defaultValue: false,
    flagValueType: 'boolean',
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    },
  };

  it('should return basic event body with mandatory fields', () => {
    const details: EvaluationDetails<boolean> = {
      value: true,
      reason: StandardResolutionReasons.STATIC,
      flagMetadata: {},
      flagKey,
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.name).toBe('feature_flag.evaluation');
    expect(result.attributes).toEqual({
      [TELEMETRY_ATTR_FEATURE_FLAG_KEY]: 'test-flag',
      [TELEMETRY_ATTR_FEATURE_FLAG_PROVIDER]: 'test-provider',
      [TELEMETRY_ATTR_FEATURE_FLAG_REASON]: StandardResolutionReasons.STATIC.toLowerCase(),
      [TELEMETRY_ATTR_FEATURE_FLAG_CONTEXT_ID]: 'test-target',
    });
    expect(result.data).toEqual({
      [TELEMETRY_EVAL_DATA_VALUE]: true,
    });
  });

  it('should include variant when provided', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: true,
      variant: 'test-variant',
      reason: StandardResolutionReasons.STATIC,
      flagMetadata: {},
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TELEMETRY_ATTR_FEATURE_FLAG_VARIANT]).toBe('test-variant');
    expect(result.attributes[TELEMETRY_EVAL_DATA_VALUE]).toBeUndefined();
  });

  it('should include flag metadata when provided', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: true,
      reason: StandardResolutionReasons.STATIC,
      flagMetadata: {
        [TELEMETRY_FLAG_METADATA_SET_ID]: 'test-set',
        [TELEMETRY_FLAG_METADATA_VERSION]: 'v1.0',
        [TELEMETRY_FLAG_METADATA_CONTEXT_ID]: 'metadata-context',
      },
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TELEMETRY_ATTR_FEATURE_FLAG_SET_ID]).toBe('test-set');
    expect(result.attributes[TELEMETRY_ATTR_FEATURE_FLAG_VERSION]).toBe('v1.0');
    expect(result.attributes[TELEMETRY_ATTR_FEATURE_FLAG_CONTEXT_ID]).toBe('metadata-context');
  });

  it('should handle error cases', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: false,
      reason: StandardResolutionReasons.ERROR,
      errorCode: ErrorCode.GENERAL,
      errorMessage: 'test error',
      flagMetadata: {},
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TELEMETRY_ATTR_FEATURE_FLAG_ERROR_TYPE]).toBe(ErrorCode.GENERAL.toLowerCase());
    expect(result.attributes[TELEMETRY_ATTR_FEATURE_FLAG_ERROR_MESSAGE]).toBe('test error');
  });

  it('should use unknown reason when reason is not provided', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: true,
      flagMetadata: {},
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TELEMETRY_ATTR_FEATURE_FLAG_REASON]).toBe(StandardResolutionReasons.UNKNOWN.toLowerCase());
  });
});
