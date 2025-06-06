import { createEvaluationEvent } from '../src/telemetry/evaluation-event';
import { ErrorCode, StandardResolutionReasons, type EvaluationDetails } from '../src/evaluation/evaluation';
import type { HookContext } from '../src/hooks/hooks';
import { TelemetryAttribute, TelemetryFlagMetadata } from '../src/telemetry';
import { DefaultHookData } from '../src/hooks/hook-data';

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
    hookData: new DefaultHookData(),
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
      [TelemetryAttribute.KEY]: 'test-flag',
      [TelemetryAttribute.PROVIDER]: 'test-provider',
      [TelemetryAttribute.REASON]: StandardResolutionReasons.STATIC.toLowerCase(),
      [TelemetryAttribute.CONTEXT_ID]: 'test-target',
      [TelemetryAttribute.VALUE]: true,
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

    expect(result.attributes[TelemetryAttribute.VARIANT]).toBe('test-variant');
    expect(result.attributes[TelemetryAttribute.VALUE]).toBeUndefined();
  });

  it('should include flag metadata when provided', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: true,
      reason: StandardResolutionReasons.STATIC,
      flagMetadata: {
        [TelemetryFlagMetadata.FLAG_SET_ID]: 'test-set',
        [TelemetryFlagMetadata.VERSION]: 'v1.0',
        [TelemetryFlagMetadata.CONTEXT_ID]: 'metadata-context',
      },
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TelemetryAttribute.FLAG_SET_ID]).toBe('test-set');
    expect(result.attributes[TelemetryAttribute.VERSION]).toBe('v1.0');
    expect(result.attributes[TelemetryAttribute.CONTEXT_ID]).toBe('metadata-context');
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

    expect(result.attributes[TelemetryAttribute.ERROR_CODE]).toBe(ErrorCode.GENERAL.toLowerCase());
    expect(result.attributes[TelemetryAttribute.ERROR_MESSAGE]).toBe('test error');
  });

  it('should use unknown reason when reason is not provided', () => {
    const details: EvaluationDetails<boolean> = {
      flagKey,
      value: true,
      flagMetadata: {},
    };

    const result = createEvaluationEvent(mockHookContext, details);

    expect(result.attributes[TelemetryAttribute.REASON]).toBe(StandardResolutionReasons.UNKNOWN.toLowerCase());
  });
});
