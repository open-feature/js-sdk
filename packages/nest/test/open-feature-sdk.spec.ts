import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { getOpenFeatureTestModule, OpenFeatureController, OpenFeatureTestService } from './test-app';

describe('OpenFeature SDK', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [getOpenFeatureTestModule()],
      providers: [OpenFeatureTestService],
      controllers: [OpenFeatureController],
    }).compile();
    app = moduleRef.createNestApplication();
    app = await app.init();
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  describe('openfeature client decorator', () => {
    it('should inject the correct open feature clients', async () => {
      const testService = moduleRef.get(OpenFeatureTestService);
      expect(testService.defaultClient).toBeDefined();
      expect(await testService.defaultClient.getStringValue('testStringFlag', 'wrong-value')).toEqual(
        'expected-string-value-default',
      );

      expect(testService.namedClient).toBeDefined();
      expect(await testService.namedClient.getStringValue('testStringFlag', 'wrong-value')).toEqual(
        'expected-string-value-named',
      );
    });
  });

  describe('feature flag decorators', () => {
    it('should inject the correct boolean feature flag evaluation details', async () => {
      const testService = app.get(OpenFeatureTestService);
      const testServiceSpy = jest.spyOn(testService, 'serviceMethod');

      await supertest(app.getHttpServer()).get('/boolean').expect(200).expect('true');

      expect(testServiceSpy).toHaveBeenCalledWith({
        flagKey: 'testBooleanFlag',
        flagMetadata: {},
        reason: 'STATIC',
        value: true,
        variant: 'default',
      });
    });

    it('should inject the correct string feature flag evaluation details', async () => {
      const testService = app.get(OpenFeatureTestService);
      const testServiceSpy = jest.spyOn(testService, 'serviceMethod');

      await supertest(app.getHttpServer()).get('/string').expect(200).expect('expected-string-value-default');

      expect(testServiceSpy).toHaveBeenCalledWith({
        flagKey: 'testStringFlag',
        flagMetadata: {},
        reason: 'STATIC',
        value: 'expected-string-value-default',
        variant: 'default',
      });
    });

    it('should inject the correct number feature flag evaluation details', async () => {
      const testService = app.get(OpenFeatureTestService);
      const testServiceSpy = jest.spyOn(testService, 'serviceMethod');

      await supertest(app.getHttpServer()).get('/number').expect(200).expect('10');

      expect(testServiceSpy).toHaveBeenCalledWith({
        flagKey: 'testNumberFlag',
        flagMetadata: {},
        reason: 'STATIC',
        value: 10,
        variant: 'default',
      });
    });

    it('should inject the correct object feature flag evaluation details', async () => {
      const testService = app.get(OpenFeatureTestService);
      const testServiceSpy = jest.spyOn(testService, 'serviceMethod');

      await supertest(app.getHttpServer()).get('/object').expect(200).expect({ client: 'default' });

      expect(testServiceSpy).toHaveBeenCalledWith({
        flagKey: 'testObjectFlag',
        flagMetadata: {},
        reason: 'STATIC',
        value: { client: 'default' },
        variant: 'default',
      });
    });
  });
});
