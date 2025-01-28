import { createEvaluationEvent } from '../src/telemetry/evaluation-event';
import { ErrorCode, StandardResolutionReasons, type EvaluationDetails } from '../src/evaluation/evaluation';
import type { HookContext } from '../src/hooks/hooks';
import { TELEMETRY_ATTRIBUTE } from '../src/telemetry/attributes';
import { TELEMETRY_FLAG_METADATA } from '../src/telemetry/flag-metadata';

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
      [TELEMETRY_ATTRIBUTE.KEY]: 'test-flag',
      [TELEMETRY_ATTRIBUTE.PROVIDER]: 'test-provider',
      [TELEMETRY_ATTRIBUTE.REASON]: StandardResolutionReasons.STATIC.toLowerCase(),
      [TELEMETRY_ATTRIBUTE.VALUE]: true,
      [TELEMETRY_ATTRIBUTE.CONTEXT_ID]: 'test-target',
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

    expect(result.attributes[TELEMETRY_ATTRIBUTE.VARIANT]).toBe('test-variant');
    expect(result.attributes[TELEMETRY_ATTRIBUTE.VALUE]).toBeUndefined();
  });

  it('should include flag metadata when provided', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: true,
      reason: StandardResolutionReasons.STATIC,
      flagMetadata: {
        [TELEMETRY_FLAG_METADATA.SET_ID]: 'test-set',
        [TELEMETRY_FLAG_METADATA.VERSION]: 'v1.0',
        [TELEMETRY_FLAG_METADATA.CONTEXT_ID]: 'metadata-context',
      },
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TELEMETRY_ATTRIBUTE.SET_ID]).toBe('test-set');
    expect(result.attributes[TELEMETRY_ATTRIBUTE.VERSION]).toBe('v1.0');
    expect(result.attributes[TELEMETRY_ATTRIBUTE.CONTEXT_ID]).toBe('metadata-context');
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

    expect(result.attributes[TELEMETRY_ATTRIBUTE.ERROR_CODE]).toBe(ErrorCode.GENERAL.toLowerCase());
    expect(result.attributes[TELEMETRY_ATTRIBUTE.ERROR_MESSAGE]).toBe('test error');
  });

  it('should use unknown reason when reason is not provided', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: true,
      flagMetadata: {},
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TELEMETRY_ATTRIBUTE.REASON]).toBe(StandardResolutionReasons.UNKNOWN.toLowerCase());
  });
});
