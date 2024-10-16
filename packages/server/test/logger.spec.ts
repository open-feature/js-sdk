import type { BaseHook, Logger, Provider} from '../src';
import { OpenFeature, DefaultLogger, SafeLogger } from '../src';

class MockedLogger implements Logger {
  error = jest.fn();
  warn = jest.fn();
  info = jest.fn();
  debug = jest.fn();
}

const BEFORE_HOOK_LOG_MESSAGE = 'in before hook';
const AFTER_HOOK_LOG_MESSAGE = 'in after hook';
const ERROR_HOOK_LOG_MESSAGE = 'in error hook';
const FINALLY_HOOK_LOG_MESSAGE = 'in finally hook';

const MOCK_HOOK: BaseHook = {
  before: jest.fn((hookContext) => hookContext.logger.info(BEFORE_HOOK_LOG_MESSAGE)),
  after: jest.fn((hookContext) => hookContext.logger.info(AFTER_HOOK_LOG_MESSAGE)),
  error: jest.fn((hookContext) => hookContext.logger.info(ERROR_HOOK_LOG_MESSAGE)),
  finally: jest.fn((hookContext) => hookContext.logger.info(FINALLY_HOOK_LOG_MESSAGE)),
};

const RESOLVE_BOOL_MESSAGE = 'resolving boolean value';
const RESOLVE_STRING_MESSAGE = 'resolving string value';
const RESOLVE_NUM_MESSAGE = 'resolving number value';
const RESOLVE_OBJECT_MESSAGE = 'resolving object value';

const MOCK_PROVIDER: Provider = {
  metadata: { name: 'Mock Provider' },
  resolveBooleanEvaluation: jest.fn((key, value, ctx, log) => {
    log.info(RESOLVE_BOOL_MESSAGE);
    return Promise.resolve({ value });
  }),
  resolveStringEvaluation: jest.fn((key, value, ctx, log) => {
    log.info(RESOLVE_STRING_MESSAGE);
    return Promise.resolve({ value });
  }),
  resolveNumberEvaluation: jest.fn((key, value, ctx, log) => {
    log.info(RESOLVE_NUM_MESSAGE);
    return Promise.resolve({ value });
  }),
  resolveObjectEvaluation: jest.fn((key, value, ctx, log) => {
    log.info(RESOLVE_OBJECT_MESSAGE);
    return Promise.resolve({ value });
  }),
};

describe('Logger', () => {
  beforeEach(() => {
    OpenFeature.setProvider(MOCK_PROVIDER);
  });

  afterEach(async () => {
    await OpenFeature.clearProviders();
    jest.clearAllMocks();
    // Resetting the default logger on the singleton
    OpenFeature['_logger'] = new DefaultLogger();
  });

  describe('Default Logger', () => {
    describe('Default Logger Functionality', () => {
      it('should call console error', () => {
        const defaultLogger = new DefaultLogger();
        const errorSpy = jest.spyOn(global.console, 'error').mockImplementation();
        defaultLogger.error('error');
        expect(errorSpy).toHaveBeenCalled();
      });

      it('should call console warn', () => {
        const defaultLogger = new DefaultLogger();
        const warnSpy = jest.spyOn(global.console, 'warn').mockImplementation();
        defaultLogger.warn('warn');
        expect(warnSpy).toHaveBeenCalled();
      });

      it('should not call console info', () => {
        const defaultLogger = new DefaultLogger();
        const infoSpy = jest.spyOn(global.console, 'info').mockImplementation();
        defaultLogger.info();
        expect(infoSpy).not.toHaveBeenCalled();
      });

      it('should not call console debug', () => {
        const defaultLogger = new DefaultLogger();
        const debugSpy = jest.spyOn(global.console, 'debug').mockImplementation();
        defaultLogger.debug();
        expect(debugSpy).not.toHaveBeenCalled();
      });
    });

    describe('Safe Logger', () => {
      it('should use the default logger because the custom logger is missing a function', () => {
        const errorSpy = jest.spyOn(global.console, 'error').mockImplementation();
        const safeLogger = new SafeLogger({} as Logger);

        expect(errorSpy).toBeCalledWith(
          expect.objectContaining({ message: 'The provided logger is missing the error method.' }),
        );
        // Checking the private logger
        expect(safeLogger['logger']).toBeInstanceOf(DefaultLogger);
      });

      it('should use the default logger when a custom logger throws', () => {
        const innerLogger = {
          error: jest.fn(() => {
            throw new Error('Logger is invalid');
          }),
          warn: jest.fn(() => {
            throw new Error('Logger is invalid');
          }),
          info: jest.fn(() => {
            throw new Error('Logger is invalid');
          }),
          debug: jest.fn(() => {
            throw new Error('Logger is invalid');
          }),
        };
        const safeLogger = new SafeLogger(innerLogger);

        expect(() => safeLogger.error()).not.toThrow();
        expect(innerLogger.error).toHaveBeenCalled();

        expect(() => safeLogger.warn()).not.toThrow();
        expect(innerLogger.warn).toHaveBeenCalled();

        expect(() => safeLogger.info()).not.toThrow();
        expect(innerLogger.info).toHaveBeenCalled();

        expect(() => safeLogger.debug()).not.toThrow();
        expect(innerLogger.debug).toHaveBeenCalled();
      });

      it('should create a safe logger', () => {
        OpenFeature.setLogger({} as Logger);
        expect(OpenFeature['_logger']).toBeInstanceOf(SafeLogger);
      });
    });

    it('should provide a logger to the provider', async () => {
      const client = OpenFeature.getClient();
      const mockedLogger = new MockedLogger();
      client.setLogger(mockedLogger);
      await client.getBooleanValue('test', false);
      expect(mockedLogger.info).toHaveBeenCalledWith(RESOLVE_BOOL_MESSAGE);
    });

    it('should provide a logger to the before, after, and finally hook', async () => {
      const client = OpenFeature.getClient();
      const mockedLogger = new MockedLogger();
      client.setLogger(mockedLogger);
      client.addHooks(MOCK_HOOK);
      await client.getBooleanValue('test', false);

      expect(mockedLogger.info.mock.calls).toEqual([
        [BEFORE_HOOK_LOG_MESSAGE],
        [RESOLVE_BOOL_MESSAGE],
        [AFTER_HOOK_LOG_MESSAGE],
        [FINALLY_HOOK_LOG_MESSAGE],
      ]);
    });

    it('should provide a logger to the error hook', async () => {
      const client = OpenFeature.getClient();
      const mockedLogger = new MockedLogger();
      client.setLogger(mockedLogger);
      client.addHooks(MOCK_HOOK);
      (MOCK_PROVIDER.resolveBooleanEvaluation as jest.Mock).mockRejectedValueOnce('Run error hook');
      await client.getBooleanValue('test', false);
      expect(mockedLogger.info.mock.calls).toEqual([
        [BEFORE_HOOK_LOG_MESSAGE],
        [ERROR_HOOK_LOG_MESSAGE],
        [FINALLY_HOOK_LOG_MESSAGE],
      ]);
    });
  });
});
