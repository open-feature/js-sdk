import { OpenFeatureClient } from '../src/client.js';
import { ERROR_REASON, GENERAL_ERROR } from '../src/constants.js';
import { OpenFeature } from '../src/open-feature.js';
import {
  Client,
  EvaluationContext,
  EvaluationDetails,
  NonTransformingProvider,
  Provider,
  ResolutionDetails,
  TransformingProvider,
} from '../src/types.js';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 2034;
const OBJECT_VALUE = {
  key: 'value',
};
const BOOLEAN_VARIANT = `${BOOLEAN_VALUE}`;
const STRING_VARIANT = `${STRING_VALUE}-variant`;
const NUMBER_VARIANT = NUMBER_VALUE.toString();
const OBJECT_VARIANT = OBJECT_VALUE.key;
const REASON = 'mocked-value';

// a mock provider with some jest spies
const MOCK_PROVIDER: Provider = {
  name: 'mock',

  resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
    return Promise.resolve({
      value: BOOLEAN_VALUE,
      variant: BOOLEAN_VARIANT,
      reason: REASON,
    });
  }),
  resolveStringEvaluation: jest.fn((): Promise<ResolutionDetails<string>> => {
    return Promise.resolve({
      value: STRING_VALUE,
      variant: STRING_VARIANT,
      reason: REASON,
    });
  }),
  resolveNumberEvaluation: jest.fn((): Promise<ResolutionDetails<number>> => {
    return Promise.resolve({
      value: NUMBER_VALUE,
      variant: NUMBER_VARIANT,
      reason: REASON,
    });
  }),
  resolveObjectEvaluation: jest.fn(<U extends object>(): Promise<ResolutionDetails<U>> => {
    const details = Promise.resolve<ResolutionDetails<U>>({
      value: OBJECT_VALUE as unknown as U,
      variant: OBJECT_VARIANT,
      reason: REASON,
    });
    return details as Promise<ResolutionDetails<U>>;
  }) as <U extends object>() => Promise<ResolutionDetails<U>>,
};

describe(OpenFeatureClient.name, () => {
  beforeAll(() => {
    OpenFeature.provider = MOCK_PROVIDER;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.6', () => {
    it('should allow addition of hooks', () => {
      expect(OpenFeatureClient.prototype.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.7, 1.8', () => {
    let client: Client;

    beforeEach(() => {
      client = OpenFeature.getClient();
    });

    describe('flag evaluation', () => {
      describe(` ${OpenFeatureClient.prototype.getBooleanValue.name}`, () => {
        it('should return boolean, and call boolean resolver', async () => {
          const booleanFlag = 'my-boolean-flag';
          const defaultBooleanValue = false;
          const value = await client.getBooleanValue(booleanFlag, defaultBooleanValue);

          expect(value).toEqual(BOOLEAN_VALUE);
          expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(booleanFlag, defaultBooleanValue, {}, {});
        });
      });

      describe(OpenFeatureClient.prototype.getStringValue.name, () => {
        it('should return string, and call string resolver', async () => {
          const stringFlag = 'my-string-flag';
          const defaultStringValue = 'default-value';
          const value = await client.getStringValue(stringFlag, defaultStringValue);

          expect(value).toEqual(STRING_VALUE);
          expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
        });
      });

      describe(OpenFeatureClient.prototype.getNumberValue.name, () => {
        it('should return number, and call number resolver', async () => {
          const numberFlag = 'my-number-flag';
          const defaultNumberValue = 1970;
          const value = await client.getNumberValue(numberFlag, defaultNumberValue);

          expect(value).toEqual(NUMBER_VALUE);
          expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(numberFlag, defaultNumberValue, {}, {});
        });
      });

      describe(OpenFeatureClient.prototype.getObjectValue.name, () => {
        it('should return object, and call object resolver', async () => {
          const objectFlag = 'my-object-flag';
          const defaultObjectFlag = {};
          const value = await client.getObjectValue(objectFlag, {});

          expect(value).toEqual(OBJECT_VALUE);
          expect(MOCK_PROVIDER.resolveObjectEvaluation).toHaveBeenCalledWith(objectFlag, defaultObjectFlag, {}, {});
        });
      });
    });
  });

  describe('Requirement 1.9, 1.10', () => {
    let client: Client;

    beforeEach(() => {
      client = OpenFeature.getClient();
    });

    describe('detailed flag evaluation', () => {
      describe(` ${OpenFeatureClient.prototype.getBooleanDetails.name}`, () => {
        it('should return boolean details, and call boolean resolver', async () => {
          const booleanFlag = 'my-boolean-flag';
          const defaultBooleanValue = false;
          const booleanDetails = await client.getBooleanDetails(booleanFlag, defaultBooleanValue);

          expect(booleanDetails.value).toEqual(BOOLEAN_VALUE);
          expect(booleanDetails.variant).toEqual(BOOLEAN_VARIANT);
          expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(booleanFlag, defaultBooleanValue, {}, {});
        });
      });

      describe(OpenFeatureClient.prototype.getStringDetails.name, () => {
        it('should return string details, and call string resolver', async () => {
          const stringFlag = 'my-string-flag';
          const defaultStringValue = 'default-value';
          const stringDetails = await client.getStringDetails(stringFlag, defaultStringValue);

          expect(stringDetails.value).toEqual(STRING_VALUE);
          expect(stringDetails.variant).toEqual(STRING_VARIANT);
          expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
        });
      });

      describe(OpenFeatureClient.prototype.getNumberDetails.name, () => {
        it('should return number details, and call number resolver', async () => {
          const numberFlag = 'my-number-flag';
          const defaultNumberValue = 1970;
          const numberDetails = await client.getNumberDetails(numberFlag, defaultNumberValue);

          expect(numberDetails.value).toEqual(NUMBER_VALUE);
          expect(numberDetails.variant).toEqual(NUMBER_VARIANT);
          expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(numberFlag, defaultNumberValue, {}, {});
        });
      });

      describe(OpenFeatureClient.prototype.getObjectDetails.name, () => {
        it('should return object details, and call object resolver', async () => {
          const objectFlag = 'my-object-flag';
          const defaultObjectFlag = {};
          const objectDetails = await client.getObjectDetails(objectFlag, defaultObjectFlag);

          expect(objectDetails.value).toEqual(OBJECT_VALUE);
          expect(objectDetails.variant).toEqual(OBJECT_VARIANT);
          expect(MOCK_PROVIDER.resolveObjectEvaluation).toHaveBeenCalledWith(objectFlag, defaultObjectFlag, {}, {});
        });
      });
    });
  });

  describe('Requirement 1.11', () => {
    describe('generic support', () => {
      it('should support generic', async () => {
        // No generic information exists at runtime, but this test has some value in ensuring the generic args still exist in the typings.
        type MyType = { key: string };
        const client = OpenFeature.getClient();
        const details: ResolutionDetails<MyType> = await client.getObjectDetails<MyType>('flag', { key: 'value' });

        expect(details).toBeDefined();
      });
    });
  });

  describe('Evaluation details structure', () => {
    const flagKey = 'number-details';
    const defaultValue = 1970;
    let details: EvaluationDetails<number>;

    describe('Normal execution', () => {
      beforeAll(async () => {
        const client = OpenFeature.getClient();
        details = await client.getNumberDetails(flagKey, defaultValue);

        expect(details).toBeDefined();
      });

      describe('Requirement 1.10, 1.11', () => {
        it('should contain flag value', () => {
          expect(details.value).toEqual(NUMBER_VALUE);
        });
      });

      describe('Requirement 1.12', () => {
        it('should contain flag key', () => {
          expect(details.flagKey).toEqual(flagKey);
        });
      });

      describe('Requirement 1.13', () => {
        it('should contain flag variant', () => {
          expect(details.variant).toEqual(NUMBER_VARIANT);
        });
      });

      describe('Requirement 1.14', () => {
        it('should contain reason', () => {
          expect(details.reason).toEqual(REASON);
        });
      });
    });

    describe('Abnormal execution', () => {
      let details: EvaluationDetails<number>;
      let client: Client;
      const errorProvider = {
        name: 'error-mock',

        resolveNumberEvaluation: jest.fn((): Promise<ResolutionDetails<number>> => {
          throw new Error('Fake error!');
        }),
      } as unknown as Provider;
      const defaultValue = 123;

      beforeAll(async () => {
        OpenFeature.provider = errorProvider;
        client = OpenFeature.getClient();
        details = await client.getNumberDetails('some-flag', defaultValue);
      });

      describe('Requirement 1.18', () => {
        it('must not throw, must return default', async () => {
          details = await client.getNumberDetails('some-flag', defaultValue);

          expect(details).toBeTruthy();
          expect(details.value).toEqual(defaultValue);
        });
      });

      describe('Requirement 1.15', () => {
        it('should contain error', () => {
          expect(details.errorCode).toBeTruthy();
          expect(details.errorCode).toEqual(GENERAL_ERROR);
        });
      });

      describe('Requirement 1.15', () => {
        it('should contain "error" reason', () => {
          expect(details.reason).toEqual(ERROR_REASON);
        });
      });
    });
  });

  describe('Requirement 1.21', () => {
    describe('Transforming provider', () => {
      const transformingProvider = {
        name: 'transforming',
        // a simple context transformer that just adds a property (transformed: true)
        contextTransformer: jest.fn((context: EvaluationContext) => {
          return { ...context, transformed: true };
        }),
        resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
          return Promise.resolve({
            value: true,
          });
        }),
      } as unknown as TransformingProvider<EvaluationContext>;
      it('should run context transformer, and pass transformed context to resolver', async () => {
        const flagKey = 'some-flag';
        const defaultValue = false;
        const context = {};
        OpenFeature.provider = transformingProvider;
        const client = OpenFeature.getClient();
        await client.getBooleanValue(flagKey, defaultValue, context);

        // expect transformer was called with context
        expect(transformingProvider.contextTransformer).toHaveBeenCalledWith(context);
        // expect transformed context was passed to resolver.
        expect(transformingProvider.resolveBooleanEvaluation).toHaveBeenCalledWith(
          flagKey,
          defaultValue,
          expect.objectContaining({ transformed: true }),
          expect.anything()
        );
      });
    });

    describe('Non-transforming provider', () => {
      const nonTransformingProvider = {
        name: 'non-transforming',
        resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
          return Promise.resolve({
            value: true,
          });
        }),
      } as unknown as NonTransformingProvider;
      it('should pass context to resolver', async () => {
        const flagKey = 'some-other-flag';
        const defaultValue = false;
        const context = { transformed: false };
        OpenFeature.provider = nonTransformingProvider;
        const client = OpenFeature.getClient();
        await client.getBooleanValue(flagKey, defaultValue, context);

        // expect context was passed to resolver.
        expect(nonTransformingProvider.resolveBooleanEvaluation).toHaveBeenCalledWith(
          flagKey,
          defaultValue,
          expect.objectContaining({ transformed: false }),
          expect.anything()
        );
      });
    });
  });
});
