import type { BeforeHookContext, EvaluationDetails, HookContext, Logger } from '../src';
import { ErrorCode, FlagNotFoundError, LoggingHook, MapHookData, StandardResolutionReasons } from '../src';

function createLoggerMock(): jest.Mocked<Logger> {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createHookContext(logger: Logger): BeforeHookContext {
  return {
    flagKey: 'test-flag',
    defaultValue: false,
    flagValueType: 'boolean',
    context: { targetingKey: 'user-1', role: 'admin' },
    clientMetadata: {
      domain: 'test-domain',
      providerMetadata: { name: 'test-provider' },
    },
    providerMetadata: { name: 'test-provider' },
    logger,
    hookData: new MapHookData(),
  };
}

describe('LoggingHook', () => {
  it('logs before stage at debug without evaluation_context by default', () => {
    const logger = createLoggerMock();
    const hook = new LoggingHook();
    const context = createHookContext(logger);

    hook.before(context);

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith('Flag evaluation before stage', {
      stage: 'before',
      domain: 'test-domain',
      provider_name: 'test-provider',
      flag_key: 'test-flag',
      default_value: false,
    });
  });

  it('logs after stage at debug with reason, variant, and value', () => {
    const logger = createLoggerMock();
    const hook = new LoggingHook();
    const context: Readonly<HookContext> = createHookContext(logger);
    const details: EvaluationDetails<boolean> = {
      flagKey: 'test-flag',
      value: true,
      variant: 'on',
      reason: StandardResolutionReasons.TARGETING_MATCH,
      flagMetadata: {},
    };

    hook.after(context, details);

    expect(logger.debug).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledWith('Flag evaluation after stage', {
      stage: 'after',
      domain: 'test-domain',
      provider_name: 'test-provider',
      flag_key: 'test-flag',
      default_value: false,
      reason: StandardResolutionReasons.TARGETING_MATCH,
      variant: 'on',
      value: true,
    });
  });

  it('logs error stage at error with error_code for OpenFeatureError and handles non-OpenFeature errors', () => {
    const logger = createLoggerMock();
    const hook = new LoggingHook();
    const context: Readonly<HookContext> = createHookContext(logger);

    hook.error(context, new FlagNotFoundError('missing flag'));
    expect(logger.error).toHaveBeenNthCalledWith(1, 'Flag evaluation error stage', {
      stage: 'error',
      domain: 'test-domain',
      provider_name: 'test-provider',
      flag_key: 'test-flag',
      default_value: false,
      error_code: ErrorCode.FLAG_NOT_FOUND,
      error_message: 'missing flag',
    });

    hook.error(context, new Error('unexpected failure'));
    expect(logger.error).toHaveBeenNthCalledWith(2, 'Flag evaluation error stage', {
      stage: 'error',
      domain: 'test-domain',
      provider_name: 'test-provider',
      flag_key: 'test-flag',
      default_value: false,
      error_code: undefined,
      error_message: 'unexpected failure',
    });
  });

  it('includes serialized evaluation_context when includeEvaluationContext is true', () => {
    const logger = createLoggerMock();
    const hook = new LoggingHook({ includeEvaluationContext: true });
    const context = createHookContext(logger);

    hook.before(context);

    expect(logger.debug).toHaveBeenCalledWith('Flag evaluation before stage', {
      stage: 'before',
      domain: 'test-domain',
      provider_name: 'test-provider',
      flag_key: 'test-flag',
      default_value: false,
      evaluation_context: JSON.stringify({ targetingKey: 'user-1', role: 'admin' }),
    });
  });

  it('uses custom logger override when provided', () => {
    const contextLogger = createLoggerMock();
    const customLogger = createLoggerMock();
    const hook = new LoggingHook({ logger: customLogger });
    const context = createHookContext(contextLogger);

    hook.before(context);

    expect(customLogger.debug).toHaveBeenCalledTimes(1);
    expect(contextLogger.debug).not.toHaveBeenCalled();
  });
});
