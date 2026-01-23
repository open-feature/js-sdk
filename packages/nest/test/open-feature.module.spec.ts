import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getOpenFeatureClientToken, OpenFeatureModule, ServerProviderEvents } from '../src';
import type { Client } from '@openfeature/server-sdk';
import { OpenFeature, InMemoryProvider } from '@openfeature/server-sdk';
import { getOpenFeatureDefaultTestModule } from './fixtures';

describe('OpenFeatureModule', () => {
  let moduleRef: TestingModule;

  describe('client injection', () => {
    beforeAll(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [getOpenFeatureDefaultTestModule()],
      }).compile();
    });

    afterAll(async () => {
      await moduleRef.close();
    });

    describe('without configured providers', () => {
      let moduleWithoutProvidersRef: TestingModule;
      beforeAll(async () => {
        moduleWithoutProvidersRef = await Test.createTestingModule({
          imports: [OpenFeatureModule.forRoot({})],
        }).compile();
      });

      afterAll(async () => {
        await moduleWithoutProvidersRef.close();
      });

      it('should return the SDKs default provider and not throw', async () => {
        expect(() => {
          moduleWithoutProvidersRef.get<Client>(getOpenFeatureClientToken());
        }).not.toThrow();
      });
    });

    it('should return the default provider', async () => {
      const client = moduleRef.get<Client>(getOpenFeatureClientToken());
      expect(client).toBeDefined();
      expect(await client.getStringValue('testStringFlag', '')).toEqual('expected-string-value-default');
    });

    it('should inject the client with the given scope', async () => {
      const client = moduleRef.get<Client>(getOpenFeatureClientToken('domainScopedClient'));
      expect(client).toBeDefined();
      expect(await client.getStringValue('testStringFlag', '')).toEqual('expected-string-value-scoped');
    });
  });

  describe('handlers', () => {
    let moduleWithoutProvidersRef: TestingModule;
    const handlerSpy = jest.fn();

    beforeAll(async () => {
      moduleWithoutProvidersRef = await Test.createTestingModule({
        imports: [OpenFeatureModule.forRoot({ handlers: [[ServerProviderEvents.Ready, handlerSpy]] })],
      }).compile();
    });

    it('should add event handlers to OpenFeature', async () => {
      expect(OpenFeature.getHandlers(ServerProviderEvents.ConfigurationChanged)).toHaveLength(0);
      expect(OpenFeature.getHandlers(ServerProviderEvents.Stale)).toHaveLength(0);
      expect(OpenFeature.getHandlers(ServerProviderEvents.Error)).toHaveLength(0);
      expect(OpenFeature.getHandlers(ServerProviderEvents.Ready)).toHaveLength(1);
    });

    afterAll(async () => {
      await moduleWithoutProvidersRef.close();
    });
  });

  describe('hooks', () => {
    let moduleWithoutProvidersRef: TestingModule;
    const hook = { before: jest.fn() };

    beforeAll(async () => {
      moduleWithoutProvidersRef = await Test.createTestingModule({
        imports: [OpenFeatureModule.forRoot({ hooks: [hook] })],
      }).compile();
    });

    it('should add hooks to OpenFeature', async () => {
      expect(OpenFeature.getHooks()).toEqual([hook]);
    });

    afterAll(async () => {
      await moduleWithoutProvidersRef.close();
    });
  });

  describe('forRootAsync', () => {
    let moduleRef: TestingModule;

    beforeAll(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          OpenFeatureModule.forRootAsync({
            useFactory: () => ({
              defaultProvider: new InMemoryProvider({
                testAsyncFlag: {
                  defaultVariant: 'default',
                  variants: { default: 'async-value' },
                  disabled: false,
                },
              }),
            }),
          }),
        ],
      }).compile();
    });

    afterAll(async () => {
      await moduleRef.close();
    });

    it('should configure module with async options', async () => {
      const client = moduleRef.get<Client>(getOpenFeatureClientToken());
      expect(client).toBeDefined();
      expect(await client.getStringValue('testAsyncFlag', '')).toEqual('async-value');
    });
  });

  describe('logger', () => {
    const mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    };
    const setLoggerSpy = jest.spyOn(OpenFeature, 'setLogger');

    afterEach(() => {
      setLoggerSpy.mockClear();
    });

    afterAll(() => {
      setLoggerSpy.mockRestore();
    });

    it('should set the logger on OpenFeature during module initialization', async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [OpenFeatureModule.forRoot({ logger: mockLogger })],
      }).compile();

      expect(setLoggerSpy).toHaveBeenCalledWith(mockLogger);
      await moduleRef.close();
    });
  });
});
