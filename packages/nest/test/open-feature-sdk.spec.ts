import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import supertest from 'supertest';
import { exampleContextFactory, OpenFeatureController, OpenFeatureTestService } from './test-app';
import { OpenFeatureModule } from '../src';
import { InMemoryProvider } from '@openfeature/server-sdk';

describe('OpenFeature SDK', () => {
  let moduleRef: TestingModule;
  let app: INestApplication;
  let defaultProvider: InMemoryProvider;
  let namedProvider: InMemoryProvider;

  beforeAll(async () => {
    defaultProvider = new InMemoryProvider({
      testBooleanFlag: {
        defaultVariant: 'default',
        variants: { default: true },
        disabled: false,
      },
      testStringFlag: {
        defaultVariant: 'default',
        variants: { default: 'expected-string-value-default' },
        disabled: false,
      },
      testNumberFlag: {
        defaultVariant: 'default',
        variants: { default: 10 },
        disabled: false,
      },
      testObjectFlag: {
        defaultVariant: 'default',
        variants: { default: { client: 'default' } },
        disabled: false,
      },
    });

    namedProvider = new InMemoryProvider({
      testBooleanFlag: {
        defaultVariant: 'default',
        variants: { default: true },
        disabled: false,
      },
      testStringFlag: {
        defaultVariant: 'default',
        variants: { default: 'expected-string-value-named' },
        disabled: false,
      },
      testNumberFlag: {
        defaultVariant: 'default',
        variants: { default: 10 },
        disabled: false,
      },
      testObjectFlag: {
        defaultVariant: 'default',
        variants: { default: { client: 'named' } },
        disabled: false,
      },
    });

    moduleRef = await Test.createTestingModule({
      imports: [
        OpenFeatureModule.forRoot({
          contextFactory: exampleContextFactory,
          defaultProvider: defaultProvider,
          providers: {
            namedClient: namedProvider,
          },
        }),
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
});
