import { OpenFeature } from '../src/open-feature';
import { DefaultLogger, SafeLogger } from '../src/logger';
import { Logger, Hook, Provider } from '../src/types';

class MockedLogger implements Logger {
  error = jest.fn();
  warn = jest.fn();
  info = jest.fn();
  debug = jest.fn();
}

const MOCK_HOOK: Hook = {
  before: jest.fn((hookContext) => hookContext.logger.info('in before hook')),
  after: jest.fn((hookContext) => hookContext.logger.info('in after hook')),
  error: jest.fn((hookContext) => hookContext.logger.info('in error hook')),
  finally: jest.fn((hookContext) => hookContext.logger.info('in finally hook')),
};

const MOCK_PROVIDER: Provider = {
  metadata: { name: 'Mock Provider' },
  resolveBooleanEvaluation: jest.fn((key, value, ctx, log) => {
    log.info('resolving boolean value');
    return Promise.resolve({ value });
  }),
  resolveStringEvaluation: jest.fn((key, value, ctx, log) => {
    log.info('resolving string value');
    return Promise.resolve({ value });
  }),
  resolveNumberEvaluation: jest.fn((key, value, ctx, log) => {
    log.info('resolving number value');
    return Promise.resolve({ value });
  }),
  resolveObjectEvaluation: jest.fn((key, value, ctx, log) => {
    log.info('resolving object value');
    return Promise.resolve({ value });
  }),
};

describe('Logger', () => {
  beforeAll(() => {
    OpenFeature.setProvider(MOCK_PROVIDER);
  });

  afterEach(() => {
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
        const safeLogger = new SafeLogger({} as any);

        expect(errorSpy).toBeCalledWith(
          expect.objectContaining({ message: 'The provided logger is missing the error method.' })
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
        OpenFeature.logger = {} as any;
        expect(OpenFeature.logger).toBeInstanceOf(SafeLogger);
      });
    });

    it('should be an instance of the default logger', () => {
      const client = OpenFeature.getClient();

      expect(client.logger).toBeInstanceOf(DefaultLogger);
    });

    it('should provide a logger to the provider', async () => {
      const client = OpenFeature.getClient();
      const mockedLogger = new MockedLogger();
      client.logger = mockedLogger;
      await client.getBooleanValue('test', false);
      expect(mockedLogger.info).toHaveBeenCalledWith('resolving boolean value');
    });

    it('should provide a logger to the before, after, and finally hook', async () => {
      const client = OpenFeature.getClient();
      const mockedLogger = new MockedLogger();
      client.logger = mockedLogger;
      client.addHooks(MOCK_HOOK);
      await client.getBooleanValue('test', false);

      expect(mockedLogger.info.mock.calls).toEqual([
        ['in before hook'],
        ['resolving boolean value'],
        ['in after hook'],
        ['in finally hook'],
      ]);
    });

    it('should use the default logger in the error hook', async () => {
      const client = OpenFeature.getClient();
      const mockedLogger = new MockedLogger();
      client.logger = mockedLogger;
      client.addHooks(MOCK_HOOK);
      (MOCK_PROVIDER.resolveBooleanEvaluation as jest.Mock).mockRejectedValueOnce('Run error hook');
      await client.getBooleanValue('test', false);
      expect(mockedLogger.info.mock.calls).toEqual([['in before hook'], ['in error hook'], ['in finally hook']]);
    });
  });
});
