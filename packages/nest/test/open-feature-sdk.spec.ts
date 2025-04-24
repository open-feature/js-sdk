import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import {
  OpenFeatureController,
  OpenFeatureContextScopedController,
  OpenFeatureRequireFlagsEnabledController,
  OpenFeatureTestService,
} from './test-app';
import { exampleContextFactory, getOpenFeatureDefaultTestModule } from './fixtures';
import { OpenFeatureModule } from '../src';
import { defaultProvider, providers } from './fixtures';

describe('OpenFeature SDK', () => {
  describe('With global context interceptor', () => {
    let moduleRef: TestingModule;
    let app: INestApplication;

    beforeAll(async () => {
      moduleRef = await Test.createTestingModule({
        imports: [getOpenFeatureDefaultTestModule()],
        providers: [OpenFeatureTestService],
        controllers: [OpenFeatureController, OpenFeatureRequireFlagsEnabledController],
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

        expect(testService.domainScopedClient).toBeDefined();
        expect(await testService.domainScopedClient.getStringValue('testStringFlag', 'wrong-value')).toEqual(
          'expected-string-value-scoped',
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
      it('inject the evaluation context from contex factory', async function () {
        const evaluationSpy = jest.spyOn(defaultProvider, 'resolveBooleanEvaluation');
        await supertest(app.getHttpServer())
          .get('/dynamic-context-in-service')
          .set('x-user-id', 'dynamic-user')
          .expect(200)
          .expect('true');
        expect(evaluationSpy).toHaveBeenCalledWith('testBooleanFlag', false, { targetingKey: 'dynamic-user' }, {});
      });
    });

    describe('require flags enabled decorator', () => {
      describe('OpenFeatureController', () => {
        it('should sucessfully return the response if the flag is enabled', async () => {
          await supertest(app.getHttpServer()).get('/flags-enabled').expect(200).expect('Get Boolean Flag Success!');
        });

        it('should throw an exception if the flag is disabled', async () => {
          jest.spyOn(defaultProvider, 'resolveBooleanEvaluation').mockResolvedValueOnce({
            value: false,
            reason: 'DISABLED',
          });
          await supertest(app.getHttpServer()).get('/flags-enabled').expect(404);
        });

        it('should throw a custom exception if the flag is disabled', async () => {
          jest.spyOn(defaultProvider, 'resolveBooleanEvaluation').mockResolvedValueOnce({
            value: false,
            reason: 'DISABLED',
          });
          await supertest(app.getHttpServer()).get('/flags-enabled-custom-exception').expect(403);
        });

        it('should throw a custom exception if the flag is disabled with context', async () => {
          await supertest(app.getHttpServer())
            .get('/flags-enabled-custom-exception-with-context')
            .set('x-user-id', '123')
            .expect(403);
        });
      });

      describe('OpenFeatureControllerRequireFlagsEnabled', () => {
        it('should allow access to the RequireFlagsEnabled controller with global context interceptor', async () => {
          await supertest(app.getHttpServer())
            .get('/require-flags-enabled')
            .set('x-user-id', '123')
            .expect(200)
            .expect('Hello, world!');
        });

        it('should throw a 403 - Forbidden exception if user does not match targeting requirements', async () => {
          await supertest(app.getHttpServer()).get('/require-flags-enabled').set('x-user-id', 'not-123').expect(403);
        });

        it('should throw a 403 - Forbidden exception if one of the flags is disabled', async () => {
          jest.spyOn(defaultProvider, 'resolveBooleanEvaluation').mockResolvedValueOnce({
            value: false,
            reason: 'DISABLED',
          });
          await supertest(app.getHttpServer()).get('/require-flags-enabled').set('x-user-id', '123').expect(403);
        });
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
            useGlobalInterceptor: false,
          }),
        ],
        providers: [OpenFeatureTestService],
        controllers: [OpenFeatureController, OpenFeatureContextScopedController],
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
      it('inject empty context if no context interceptor is configured', async function () {
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
        await supertest(app.getHttpServer())
          .get('/controller-context')
          .set('x-user-id', '123')
          .expect(200)
          .expect('true');
        expect(evaluationSpy).toHaveBeenCalledWith('testBooleanFlag', false, { targetingKey: '123' }, {});
      });
    });

    describe('require flags enabled decorator', () => {
      it('should return a 404 - Not Found exception if the flag is disabled', async () => {
        jest.spyOn(providers.domainScopedClient, 'resolveBooleanEvaluation').mockResolvedValueOnce({
          value: false,
          reason: 'DISABLED',
        });
        await supertest(app.getHttpServer())
          .get('/controller-context/flags-enabled')
          .set('x-user-id', '123')
          .expect(404);
      });
    });
  });
});
