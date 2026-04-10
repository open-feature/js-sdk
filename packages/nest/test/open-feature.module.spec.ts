import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getOpenFeatureClientToken, OpenFeatureModule, ServerProviderEvents } from '../src';
import type { Client } from '@openfeature/server-sdk';
import { OpenFeature } from '@openfeature/server-sdk';
import { defaultProvider, getOpenFeatureDefaultTestModule } from './fixtures';

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

    it('should expose nest framework metadata on injected clients', () => {
      const defaultClient = moduleRef.get<Client>(getOpenFeatureClientToken());
      const scopedClient = moduleRef.get<Client>(getOpenFeatureClientToken('domainScopedClient'));

      expect(defaultClient.metadata).toMatchObject({
        sdk: 'server',
        framework: 'nest',
      });
      expect(scopedClient.metadata).toMatchObject({
        sdk: 'server',
        framework: 'nest',
      });
    });

    it('should surface nest metadata in hook contexts', async () => {
      const hook = { before: jest.fn() };
      const hookModuleRef = await Test.createTestingModule({
        imports: [OpenFeatureModule.forRoot({ defaultProvider, hooks: [hook] })],
      }).compile();

      try {
        const client = hookModuleRef.get<Client>(getOpenFeatureClientToken());
        await client.getBooleanValue('testBooleanFlag', false);

        expect(hook.before).toHaveBeenCalledWith(
          expect.objectContaining({
            clientMetadata: expect.objectContaining({
              sdk: 'server',
              framework: 'nest',
            }),
          }),
          undefined,
        );
      } finally {
        await hookModuleRef.close();
        OpenFeature.clearHooks();
      }
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
});
