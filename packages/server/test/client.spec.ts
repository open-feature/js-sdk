import {
  Client,
  ErrorCode,
  EvaluationContext,
  EvaluationDetails,
  FlagNotFoundError,
  JsonArray,
  JsonObject,
  JsonValue,
  ResolutionDetails,
  StandardResolutionReasons,
  Provider,
  OpenFeature,
  OpenFeatureClient,
  TransactionContext,
  TransactionContextPropagator,
} from '../src';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 2048;
const ARRAY_VALUE: JsonValue[] = [];

const INNER_KEY = 'inner';
const INNER_NULL_KEY = 'nullKey';
const INNER_BOOLEAN_KEY = 'booleanKey';
const INNER_STRING_KEY = 'stringKey';
const INNER_NUMBER_KEY = 'numberKey';
const INNER_ARRAY_KEY = 'arrayKey';
const OBJECT_VALUE: JsonValue = {
  [INNER_KEY]: {
    [INNER_NULL_KEY]: null,
    [INNER_BOOLEAN_KEY]: BOOLEAN_VALUE,
    [INNER_STRING_KEY]: STRING_VALUE,
    [INNER_NUMBER_KEY]: NUMBER_VALUE,
    [INNER_ARRAY_KEY]: ARRAY_VALUE,
  },
};

const DATETIME_VALUE = new Date(2022, 5, 13, 18, 20, 0);

const BOOLEAN_VARIANT = `${BOOLEAN_VALUE}`;
const STRING_VARIANT = `${STRING_VALUE}-variant`;
const NUMBER_VARIANT = NUMBER_VALUE.toString();
const OBJECT_VARIANT = 'json';
const REASON = 'mocked-value';

// a mock provider with some jest spies
const MOCK_PROVIDER: Provider = {
  metadata: {
    name: 'mock',
  },
  resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
    return Promise.resolve({
      value: BOOLEAN_VALUE,
      variant: BOOLEAN_VARIANT,
      reason: REASON,
    });
  }),
  resolveStringEvaluation: jest.fn(<U extends string>(): Promise<ResolutionDetails<U>> => {
    return Promise.resolve({
      value: STRING_VALUE,
      variant: STRING_VARIANT,
      reason: REASON,
    }) as Promise<ResolutionDetails<U>>;
  }) as <U>() => Promise<ResolutionDetails<U>>,
  resolveNumberEvaluation: jest.fn((): Promise<ResolutionDetails<number>> => {
    return Promise.resolve({
      value: NUMBER_VALUE,
      variant: NUMBER_VARIANT,
      reason: REASON,
    });
  }),
  resolveObjectEvaluation: jest.fn(<U extends JsonValue>(): Promise<ResolutionDetails<U>> => {
    const details = Promise.resolve<ResolutionDetails<U>>({
      value: OBJECT_VALUE as U,
      variant: OBJECT_VARIANT,
      reason: REASON,
    });
    return details as Promise<ResolutionDetails<U>>;
  }) as <U>() => Promise<ResolutionDetails<U>>,
};

describe('OpenFeatureClient', () => {
  beforeAll(() => {
    OpenFeature.setProvider(MOCK_PROVIDER);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1.2.1', () => {
    it('should allow addition of hooks', () => {
      expect(OpenFeatureClient.prototype.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.2.1', () => {
    const NAME = 'my-client';
    const client = OpenFeature.getClient(NAME);
    it('should have metadata accessor with name', () => {
      expect(client.metadata.name).toEqual(NAME);
    });
  });

  describe('Requirement 1.3.1, 1.3.2.1', () => {
    let client: Client;

    beforeEach(() => {
      client = OpenFeature.getClient();
    });

    describe('flag evaluation', () => {
      describe('getBooleanValue', () => {
        it('should return boolean, and call boolean resolver', async () => {
          const booleanFlag = 'my-boolean-flag';
          const defaultBooleanValue = false;
          const value = await client.getBooleanValue(booleanFlag, defaultBooleanValue);

          expect(value).toEqual(BOOLEAN_VALUE);
          expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(booleanFlag, defaultBooleanValue, {}, {});
        });
      });

      describe('getStringValue', () => {
        describe('with no generic arg (as string)', () => {
          it('should return string, and call string resolver', async () => {
            const stringFlag = 'my-string-flag';
            const defaultStringValue = 'default-value';
            const value: string = await client.getStringValue(stringFlag, defaultStringValue);

            expect(value).toEqual(STRING_VALUE);
            expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
          });
        });

        describe('with generic arg', () => {
          it('should return T, and call string resolver', async () => {
            const stringFlag = 'my-string-flag';
            type MyRestrictedString = 'val' | 'other';
            const defaultStringValue = 'other';
            const value: MyRestrictedString = await client.getStringValue<MyRestrictedString>(
              stringFlag,
              defaultStringValue
            );

            expect(value).toEqual(STRING_VALUE);
            expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
          });
        });
      });

      describe('getNumberValue', () => {
        describe('with no generic arg (as number)', () => {
          it('should return number, and call number resolver', async () => {
            const numberFlag = 'my-number-flag';
            const defaultNumberValue = 1970;
            const value: number = await client.getNumberValue(numberFlag, defaultNumberValue);

            expect(value).toEqual(NUMBER_VALUE);
            expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(numberFlag, defaultNumberValue, {}, {});
          });
        });

        describe('with generic arg', () => {
          it('should return T, and call number resolver', async () => {
            const numberFlag = 'my-number-flag';
            type MyRestrictedNumber = 4096 | 2048;
            const defaultNumberValue = 4096;
            const value: MyRestrictedNumber = await client.getNumberValue<MyRestrictedNumber>(
              numberFlag,
              defaultNumberValue
            );

            expect(value).toEqual(NUMBER_VALUE);
            expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(numberFlag, defaultNumberValue, {}, {});
          });
        });
      });

      describe('getObjectValue', () => {
        describe('with no generic arg (as JsonValue)', () => {
          it('should return JsonValue, and call object resolver', async () => {
            const objectFlag = 'my-object-flag';
            const defaultObjectFlag = {};
            const value: JsonValue = await client.getObjectValue(objectFlag, defaultObjectFlag);

            // compare the object
            expect(value).toEqual(OBJECT_VALUE);

            // explore the object - type assertions required for safety.
            const jsonObject: JsonObject = (value as JsonObject)[INNER_KEY] as JsonObject;
            const nullValue = jsonObject?.[INNER_NULL_KEY] as null;
            const booleanValue = jsonObject?.[INNER_BOOLEAN_KEY] as boolean;
            const stringValue = jsonObject?.[INNER_STRING_KEY] as string;
            const numberValue = jsonObject?.[INNER_NUMBER_KEY] as number;
            const arrayValue = jsonObject?.[INNER_ARRAY_KEY] as JsonArray;

            expect(nullValue).toEqual(null);
            expect(booleanValue).toEqual(BOOLEAN_VALUE);
            expect(stringValue).toEqual(STRING_VALUE);
            expect(numberValue).toEqual(NUMBER_VALUE);
            expect(arrayValue).toEqual(ARRAY_VALUE);
          });
        });

        describe('with generic arg', () => {
          it('should return T, and call object resolver', async () => {
            const objectFlag = 'my-object-flag';

            type MyType = {
              inner: {
                booleanKey: boolean;
              };
            };

            const defaultMyTypeFlag: MyType = {
              inner: {
                booleanKey: false,
              },
            };
            const value: MyType = await client.getObjectValue<MyType>(objectFlag, defaultMyTypeFlag);

            const innerBooleanValue: boolean = value.inner.booleanKey;
            expect(innerBooleanValue).toBeTruthy();
          });
        });
      });
    });
  });

  describe('Requirement 1.4.1', () => {
    let client: Client;

    beforeEach(() => {
      client = OpenFeature.getClient();
    });

    describe('detailed flag evaluation', () => {
      describe('getBooleanDetails', () => {
        it('should return boolean details, and call boolean resolver', async () => {
          const booleanFlag = 'my-boolean-flag';
          const defaultBooleanValue = false;
          const booleanDetails = await client.getBooleanDetails(booleanFlag, defaultBooleanValue);

          expect(booleanDetails.value).toEqual(BOOLEAN_VALUE);
          expect(booleanDetails.variant).toEqual(BOOLEAN_VARIANT);
          expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(booleanFlag, defaultBooleanValue, {}, {});
        });
      });

      describe('getStringDetails', () => {
        it('should return string details, and call string resolver', async () => {
          const stringFlag = 'my-string-flag';
          const defaultStringValue = 'default-value';
          const stringDetails = await client.getStringDetails(stringFlag, defaultStringValue);

          expect(stringDetails.value).toEqual(STRING_VALUE);
          expect(stringDetails.variant).toEqual(STRING_VARIANT);
          expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
        });
      });

      describe('getNumberDetails', () => {
        it('should return number details, and call number resolver', async () => {
          const numberFlag = 'my-number-flag';
          const defaultNumberValue = 1970;
          const numberDetails = await client.getNumberDetails(numberFlag, defaultNumberValue);

          expect(numberDetails.value).toEqual(NUMBER_VALUE);
          expect(numberDetails.variant).toEqual(NUMBER_VARIANT);
          expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(numberFlag, defaultNumberValue, {}, {});
        });
      });

      describe('getObjectDetails', () => {
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

  describe('Requirement 1.4.3.1', () => {
    describe('generic support', () => {
      it('should support generics', async () => {
        // No generic information exists at runtime, but this test has some value in ensuring the generic args still exist in the typings.
        const client = OpenFeature.getClient();
        const details: ResolutionDetails<JsonValue> = await client.getObjectDetails('flag', { key: 'value' });

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

      describe('Requirement 1.4.2, 1.4.3', () => {
        it('should contain flag value', () => {
          expect(details.value).toEqual(NUMBER_VALUE);
        });
      });

      describe('Requirement 1.4.4', () => {
        it('should contain flag key', () => {
          expect(details.flagKey).toEqual(flagKey);
        });
      });

      describe('Requirement 1.4.5', () => {
        it('should contain flag variant', () => {
          expect(details.variant).toEqual(NUMBER_VARIANT);
        });
      });

      describe('Requirement 1.4.6', () => {
        it('should contain reason', () => {
          expect(details.reason).toEqual(REASON);
        });
      });
    });

    describe('Abnormal execution', () => {
      const NON_OPEN_FEATURE_ERROR_MESSAGE = 'A null dereference or something, I dunno.';
      const OPEN_FEATURE_ERROR_MESSAGE = "This ain't the flag you're looking for.";
      let nonOpenFeatureErrorDetails: EvaluationDetails<number>;
      let openFeatureErrorDetails: EvaluationDetails<string>;
      let client: Client;
      const errorProvider = {
        metadata: {
          name: 'error-mock',
        },

        resolveNumberEvaluation: jest.fn((): Promise<ResolutionDetails<number>> => {
          throw new Error(NON_OPEN_FEATURE_ERROR_MESSAGE); // throw a non-open-feature error
        }),
        resolveStringEvaluation: jest.fn((): Promise<ResolutionDetails<string>> => {
          throw new FlagNotFoundError(OPEN_FEATURE_ERROR_MESSAGE); // throw an open-feature error
        }),
      } as unknown as Provider;
      const defaultNumberValue = 123;
      const defaultStringValue = 'hey!';

      beforeAll(async () => {
        OpenFeature.setProvider(errorProvider);
        client = OpenFeature.getClient();
        nonOpenFeatureErrorDetails = await client.getNumberDetails('some-flag', defaultNumberValue);
        openFeatureErrorDetails = await client.getStringDetails('some-flag', defaultStringValue);
      });

      describe('Requirement 1.4.7', () => {
        describe('OpenFeatureError', () => {
          it('should contain error code', () => {
            expect(openFeatureErrorDetails.errorCode).toBeTruthy();
            expect(openFeatureErrorDetails.errorCode).toEqual(ErrorCode.FLAG_NOT_FOUND); // should get code from thrown OpenFeatureError
          });
        });

        describe('Non-OpenFeatureError', () => {
          it('should contain error code', () => {
            expect(nonOpenFeatureErrorDetails.errorCode).toBeTruthy();
            expect(nonOpenFeatureErrorDetails.errorCode).toEqual(ErrorCode.GENERAL); // should fall back to GENERAL
          });
        });
      });

      describe('Requirement 1.4.8', () => {
        it('should contain error reason', () => {
          expect(nonOpenFeatureErrorDetails.reason).toEqual(StandardResolutionReasons.ERROR);
          expect(openFeatureErrorDetails.reason).toEqual(StandardResolutionReasons.ERROR);
        });
      });

      describe('Requirement 1.4.9', () => {
        it('must not throw, must return default', async () => {
          nonOpenFeatureErrorDetails = await client.getNumberDetails('some-flag', defaultNumberValue);

          expect(nonOpenFeatureErrorDetails).toBeTruthy();
          expect(nonOpenFeatureErrorDetails.value).toEqual(defaultNumberValue);
        });
      });

      describe('Requirement 1.4.12', () => {
        describe('OpenFeatureError', () => {
          it('should contain "error" message', () => {
            expect(openFeatureErrorDetails.errorMessage).toEqual(OPEN_FEATURE_ERROR_MESSAGE);
          });
        });

        describe('Non-OpenFeatureError', () => {
          it('should contain "error" message', () => {
            expect(nonOpenFeatureErrorDetails.errorMessage).toEqual(NON_OPEN_FEATURE_ERROR_MESSAGE);
          });
        });
      });
    });
  });

  describe('Requirement 1.4.13, Requirement 1.4.14', () => {
    it('should return immutable `flag metadata` as defined by the provider', async () => {
      const flagMetadata = {
        url: 'https://test.dev',
        version: '1',
      };

      const flagMetadataProvider = {
        metadata: {
          name: 'flag-metadata',
        },
        resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
          return Promise.resolve({
            value: true,
            flagMetadata,
          });
        }),
      } as unknown as Provider;

      OpenFeature.setProvider(flagMetadataProvider);
      const client = OpenFeature.getClient();
      const response = await client.getBooleanDetails('some-flag', false);
      expect(response.flagMetadata).toBe(flagMetadata);
      expect(Object.isFrozen(response.flagMetadata)).toBeTruthy();
    });

    it('should return empty `flag metadata` because it was not set by the provider', async () => {
      // The mock provider doesn't contain flag metadata
      OpenFeature.setProvider(MOCK_PROVIDER);
      const client = OpenFeature.getClient();
      const response = await client.getBooleanDetails('some-flag', false);
      expect(response.flagMetadata).toEqual({});
    });
  });

  describe('Requirement 1.6.1', () => {
    describe('Provider', () => {
      const nonTransformingProvider = {
        metadata: {
          name: 'non-transforming',
        },
        resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
          return Promise.resolve({
            value: true,
          });
        }),
      } as unknown as Provider;
      it('should pass context to resolver', async () => {
        const flagKey = 'some-other-flag';
        const defaultValue = false;
        const context = { transformed: false };
        OpenFeature.setProvider(nonTransformingProvider);
        const client = OpenFeature.getClient();
        await client.getBooleanValue(flagKey, defaultValue, context);

        // expect context was passed to resolver.
        expect(nonTransformingProvider.resolveBooleanEvaluation).toHaveBeenCalledWith(
          flagKey,
          defaultValue,
          expect.objectContaining({ transformed: false }),
          {}
        );
      });
    });
  });

  describe('Evaluation Context', () => {
    const provider = {
      metadata: {
        name: 'evaluation-context',
      },
      resolveBooleanEvaluation: jest.fn((): Promise<ResolutionDetails<boolean>> => {
        return Promise.resolve({
          value: true,
        });
      }),
    } as unknown as Provider;

    describe('3.1.1', () => {
      const TARGETING_KEY = 'abc123';
      it('context define targeting key', async () => {
        const flagKey = 'some-other-flag';
        const defaultValue = false;
        const context: EvaluationContext = {
          targetingKey: TARGETING_KEY,
        };

        OpenFeature.setProvider(provider);
        const client = OpenFeature.getClient();
        await client.getBooleanValue(flagKey, defaultValue, context);
        expect(provider.resolveBooleanEvaluation).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            targetingKey: TARGETING_KEY,
          }),
          expect.anything()
        );
      });
    });

    describe('3.1.2', () => {
      it('should support boolean | string | number | datetime | structure', async () => {
        const flagKey = 'some-other-flag';
        const defaultValue = false;
        const context: EvaluationContext = {
          booleanField: BOOLEAN_VALUE,
          stringField: STRING_VALUE,
          numberField: NUMBER_VALUE,
          datetimeField: DATETIME_VALUE,
          structureField: OBJECT_VALUE,
        };

        OpenFeature.setProvider(provider);
        const client = OpenFeature.getClient();
        await client.getBooleanValue(flagKey, defaultValue, context);
        expect(provider.resolveBooleanEvaluation).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.objectContaining({
            ...context,
          }),
          expect.anything()
        );
      });
    });

    describe('3.2.1, 3.2.2', () => {
      it('Evaluation context MUST be merged in the order: API (global; lowest precedence) -> transaction context -> client -> invocation -> before hooks (highest precedence), with duplicate values being overwritten.', async () => {
        const flagKey = 'some-other-flag';
        const defaultValue = false;
        const globalContext: EvaluationContext = {
          globalContextValue: 'abc',
          globalContextValueToOverwrite: 'xxx', // should be overwritten
        };
        const transactionContext: TransactionContext = {
          transactionContextValue: 'def',
          transactionContextValueToOverwrite: 'xxx', // should be overwritten
          globalContextValueToOverwrite: '123',
        };
        const clientContext: EvaluationContext = {
          clientContextValue: 'ghi',
          clientContextValueToOverwrite: 'xxx', // should be overwritten
          transactionContextValueToOverwrite: '456',
        };
        const invocationContext: EvaluationContext = {
          invocationContextValue: 'jkl',
          invocationContextValueToOverwrite: 'xxx', // should be overwritten
          clientContextValueToOverwrite: '789',
        };
        const beforeHookContext: EvaluationContext = {
          invocationContextValueToOverwrite: '012',
          beforeHookContextValue: 'mno',
        };

        // Set Global Context
        OpenFeature.setProvider(provider).setContext(globalContext);

        // Set Transaction Context
        class LocalTransactionContextPropagator implements TransactionContextPropagator {
          private context: TransactionContext = {};

          getTransactionContext(): EvaluationContext {
            return this.context;
          }

          setTransactionContext(transactionContext: EvaluationContext, callback: () => void): void {
            this.context = transactionContext;
            callback();
          }
        }

        OpenFeature.setTransactionContextPropagator(new LocalTransactionContextPropagator());
        OpenFeature.setTransactionContext(transactionContext, jest.fn());

        // Set Client Context
        const client = OpenFeature.getClient('contextual', 'test', clientContext);
        // Set Hook Context
        client.addHooks({ before: () => beforeHookContext });

        await client.getBooleanValue(flagKey, defaultValue, invocationContext);
        expect(provider.resolveBooleanEvaluation).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          // expect merged in the correct order...
          expect.objectContaining({
            ...globalContext,
            ...transactionContext,
            ...clientContext,
            ...invocationContext,
            ...beforeHookContext,
          }),
          expect.anything()
        );
      });
    });

    describe('client evaluation context', () => {
      it('can be mutated', async () => {
        const KEY = 'key';
        const VAL = 'val';
        const client = OpenFeature.getClient();
        client.setContext({ [KEY]: VAL });
        expect(client.getContext()[KEY]).toEqual(VAL);
      });
    });
  });

  it('should be chainable', async () => {
    const client = OpenFeature.getClient();

    expect(await client.addHooks().clearHooks().setContext({}).setLogger(console).getBooleanValue('test', true)).toBe(
      true
    );
  });
});
