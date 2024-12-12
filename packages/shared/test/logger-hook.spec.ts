import { GeneralError } from '../src/errors';
import type { HookContext } from '../src/hooks/hooks';
import { LoggingHook } from '../src/hooks/logging-hook';
import type { SafeLogger } from '../src/logger';

describe('LoggingHook', () => {
  const FLAG_KEY = 'some-key';
  const DEFAULT_VALUE = 'default';
  const DOMAIN = 'some-domain';
  const PROVIDER_NAME = 'some-provider';
  const REASON = 'some-reason';
  const VALUE = 'some-value';
  const VARIANT = 'some-variant';
  const ERROR_MESSAGE = 'some fake error!';
  const DOMAIN_KEY = 'domain';
  const PROVIDER_NAME_KEY = 'provider_name';
  const FLAG_KEY_KEY = 'flag_key';
  const DEFAULT_VALUE_KEY = 'default_value';
  const EVALUATION_CONTEXT_KEY = 'evaluation_context';
  const ERROR_CODE_KEY = 'error_code';
  const ERROR_MESSAGE_KEY = 'error_message';

  // const ERROR_CODE = 'GENERAL';

  let hookContext: HookContext;
  let logger: SafeLogger;

  beforeEach(() => {
    const mockProviderMetaData = { name: PROVIDER_NAME };

    // Mock the hook context
    hookContext = {
      flagKey: FLAG_KEY,
      defaultValue: DEFAULT_VALUE,
      flagValueType: 'boolean',
      context: { targetingKey: 'some-targeting-key' },
      logger: logger,
      clientMetadata: { domain: DOMAIN, providerMetadata: mockProviderMetaData },
      providerMetadata: mockProviderMetaData,
    };

    console.debug = jest.fn();
    console.warn = jest.fn();
    console.info = jest.fn();
    console.error = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should log all props except evaluation context in before hook', () => {
    const hook = new LoggingHook(false);

    hook.before(hookContext);

    expect(console.debug).toHaveBeenCalled();

    expect((console.debug as jest.Mock).mock.calls[0][0]).toMatchObject({
      stage: 'before',
      [DOMAIN_KEY]: hookContext.clientMetadata.domain,
      [PROVIDER_NAME_KEY]: hookContext.providerMetadata.name,
      [FLAG_KEY_KEY]: hookContext.flagKey,
      [DEFAULT_VALUE_KEY]: hookContext.defaultValue 
    });

  });

  test('should log all props and evaluation context in before hook when enabled', () => {
    const hook = new LoggingHook(true);

    hook.before(hookContext);

    expect(console.debug).toHaveBeenCalled();

    expect((console.debug as jest.Mock).mock.calls[0][0]).toMatchObject({
      stage: 'before',
      [DOMAIN_KEY]: hookContext.clientMetadata.domain,
      [PROVIDER_NAME_KEY]: hookContext.providerMetadata.name,
      [FLAG_KEY_KEY]: hookContext.flagKey,
      [DEFAULT_VALUE_KEY]: hookContext.defaultValue,
      [EVALUATION_CONTEXT_KEY]: hookContext.context
    });
    
  });

  test('should log all props except evaluation context in after hook', () => {
    const hook = new LoggingHook(false);
    const details = { flagKey: FLAG_KEY, flagMetadata: {}, reason: REASON, variant: VARIANT, value: VALUE };

    hook.after(hookContext, details);

    expect(console.debug).toHaveBeenCalled();

    expect((console.debug as jest.Mock).mock.calls[0][0]).toMatchObject({
      stage: 'after',
      [DOMAIN_KEY]: hookContext.clientMetadata.domain,
      [PROVIDER_NAME_KEY]: hookContext.providerMetadata.name,
      [FLAG_KEY_KEY]: hookContext.flagKey,
      [DEFAULT_VALUE_KEY]: hookContext.defaultValue 
    });
  });

  test('should log all props and evaluation context in after hook when enabled', () => {
    const hook = new LoggingHook(true);
    const details = { flagKey: FLAG_KEY, flagMetadata: {}, reason: REASON, variant: VARIANT, value: VALUE };

    hook.after(hookContext, details);

    expect(console.debug).toHaveBeenCalled();

    expect((console.debug as jest.Mock).mock.calls[0][0]).toMatchObject({
      stage: 'after',
      [DOMAIN_KEY]: hookContext.clientMetadata.domain,
      [PROVIDER_NAME_KEY]: hookContext.providerMetadata.name,
      [FLAG_KEY_KEY]: hookContext.flagKey,
      [DEFAULT_VALUE_KEY]: hookContext.defaultValue,
      [EVALUATION_CONTEXT_KEY]: hookContext.context
    });
  });

  test('should log all props except evaluation context in error hook', () => {
    const hook = new LoggingHook(false);
    const error = new GeneralError(ERROR_MESSAGE);

    hook.error(hookContext, error);

    expect(console.error).toHaveBeenCalled();

    expect((console.error as jest.Mock).mock.calls[0][0]).toMatchObject({
      stage: 'error',
      [ERROR_MESSAGE_KEY]: error.message,
      [ERROR_CODE_KEY]: error.code,
      [DOMAIN_KEY]: hookContext.clientMetadata.domain,
      [PROVIDER_NAME_KEY]: hookContext.providerMetadata.name,
      [FLAG_KEY_KEY]: hookContext.flagKey,
      [DEFAULT_VALUE_KEY]: hookContext.defaultValue,
    });
  });

  test('should log all props and evaluation context in error hook when enabled', () => {
    const hook = new LoggingHook(true);
    const error = new GeneralError(ERROR_MESSAGE);

    hook.error(hookContext, error);

    expect(console.error).toHaveBeenCalled();

    expect((console.error as jest.Mock).mock.calls[0][0]).toMatchObject({
      stage: 'error',
      [ERROR_MESSAGE_KEY]: error.message,
      [ERROR_CODE_KEY]: error.code,
      [DOMAIN_KEY]: hookContext.clientMetadata.domain,
      [PROVIDER_NAME_KEY]: hookContext.providerMetadata.name,
      [FLAG_KEY_KEY]: hookContext.flagKey,
      [DEFAULT_VALUE_KEY]: hookContext.defaultValue,
      [EVALUATION_CONTEXT_KEY]: hookContext.context
    });
  });
});
