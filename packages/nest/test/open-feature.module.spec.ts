import { Test, TestingModule } from '@nestjs/testing';
import { getOpenFeatureClientToken } from '../src';
import { OpenFeatureClient } from '@openfeature/server-sdk';
import { getOpenFeatureTestModule } from './test-app';

describe('OpenFeatureModule', () => {
  let moduleRef: TestingModule;

  describe('basic functionality', () => {
    beforeAll(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [getOpenFeatureTestModule()],
      }).compile();
    });

    afterAll(async () => {
      await moduleRef.close();
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
