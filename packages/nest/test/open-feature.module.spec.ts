import { Test, TestingModule } from '@nestjs/testing';
import { getOpenFeatureClientToken, OpenFeatureModule } from '../src';
import { OpenFeatureClient } from '@openfeature/server-sdk';
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
          moduleWithoutProvidersRef.get<OpenFeatureClient>(getOpenFeatureClientToken());
        }).not.toThrow();
      });
    });

    it('should return the default provider', async () => {
      const client = moduleRef.get<OpenFeatureClient>(getOpenFeatureClientToken());
      expect(client).toBeDefined();
      expect(await client.getStringValue('testStringFlag', '')).toEqual('expected-string-value-default');
    });

    it('should inject the client with the given name', async () => {
      const client = moduleRef.get<OpenFeatureClient>(getOpenFeatureClientToken('namedClient'));
      expect(client).toBeDefined();
      expect(await client.getStringValue('testStringFlag', '')).toEqual('expected-string-value-named');
    });
  });
});
