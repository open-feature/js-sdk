import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { OpenFeatureController, OpenFeatureControllerContextScopedController, OpenFeatureTestService } from './test-app';
import { exampleContextFactory, getOpenFeatureDefaultTestModule } from './fixtures';
import { OpenFeatureModule } from '../src';
import { defaultProvider, providers } from './fixtures';

describe('OpenFeature SDK', () => {
  describe('With global context interceptor', () => {
    let moduleRef: TestingModule;
    let app: INestApplication;

    beforeAll(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [
          getOpenFeatureDefaultTestModule()
        ],
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

      it('should use the execution context from contextFactory', async () => {
        const evaluationSpy = jest.spyOn(defaultProvider, 'resolveBooleanEvaluation');
        await supertest(app.getHttpServer()).get('/dynamic-context').set('x-user-id', '123').expect(200).expect('true');
        expect(evaluationSpy).toHaveBeenCalledWith('testBooleanFlag', false, { targetingKey: '123' }, {});
      });
    });

    describe('evaluation context service should', () => {
      it('inject the evaluation context from contex factory', async function() {
        const evaluationSpy = jest.spyOn(defaultProvider, 'resolveBooleanEvaluation');
        await supertest(app.getHttpServer())
          .get('/dynamic-context-in-service')
          .set('x-user-id', 'dynamic-user')
          .expect(200)
          .expect('true');
        expect(evaluationSpy).toHaveBeenCalledWith('testBooleanFlag', false, { targetingKey: 'dynamic-user' }, {});
      });
    });
  });

  describe('Without global context interceptor', () => {

    let moduleRef: TestingModule;
    let app: INestApplication;

    beforeAll(async () => {

      moduleRef = await Test.createTestingModule({
        imports: [
          OpenFeatureModule.forRoot({
            contextFactory: exampleContextFactory,
            defaultProvider,
            providers,
            useGlobalInterceptor: false
          }),
        ],
        providers: [OpenFeatureTestService],
        controllers: [OpenFeatureController, OpenFeatureControllerContextScopedController],
      }).compile();
      app = moduleRef.createNestApplication();
      app = await app.init();
    });

    afterAll(async () => {
      await moduleRef.close();
    });

    it('should not use context if global context interceptor is not configured', async () => {
      const evaluationSpy = jest.spyOn(defaultProvider, 'resolveBooleanEvaluation');
      await supertest(app.getHttpServer()).get('/dynamic-context').set('x-user-id', '123').expect(200).expect('true');
      expect(evaluationSpy).toHaveBeenCalledWith('testBooleanFlag', false, {}, {});
    });

    describe('evaluation context service should', () => {
      it('inject empty context if no context interceptor is configured', async function() {
        const evaluationSpy = jest.spyOn(defaultProvider, 'resolveBooleanEvaluation');
        await supertest(app.getHttpServer())
          .get('/dynamic-context-in-service')
          .set('x-user-id', 'dynamic-user')
          .expect(200)
          .expect('true');
        expect(evaluationSpy).toHaveBeenCalledWith('testBooleanFlag', false, {}, {});
      });
    });

    describe('With Controller bound Context interceptor', () => {
      it('should not use context if global context interceptor is not configured', async () => {
        const evaluationSpy = jest.spyOn(defaultProvider, 'resolveBooleanEvaluation');
        await supertest(app.getHttpServer()).get('/controller-context').set('x-user-id', '123').expect(200).expect('true');
        expect(evaluationSpy).toHaveBeenCalledWith('testBooleanFlag', false, { targetingKey: '123' }, {});
      });
    });
  });
});
