import {
  ErrorCode,
  EvaluationContext,
  EvaluationDetails,
  JsonValue,
  JsonArray,
  JsonObject,
  ResolutionDetails,
  StandardResolutionReasons,

} from '../src';
import {OpenFeatureClient} from '../src/client';
import {OpenFeature} from '../src/open-feature';
import {
  Client, Provider,

} from '../src/types';

const BOOLEAN_VALUE = true;
const STRING_VALUE = 'val';
const NUMBER_VALUE = 10;
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

const BOOLEAN_VARIANT = `${BOOLEAN_VALUE}`;
const STRING_VARIANT = `${STRING_VALUE}-variant`;
const NUMBER_VARIANT = `${NUMBER_VALUE}`;
const OBJECT_VARIANT = 'json';
const REASON = 'mocked-value';


// a mock provider with some jest spies
const MOCK_PROVIDER: Provider = {

  metadata: {
    name: 'mock',
  },

  events: undefined, hooks: [], initialize(context): Promise<void> {
    return Promise.resolve(undefined);
  }, onClose(): Promise<void> {
    return Promise.resolve(undefined);
  }, onContextChange(oldContext, newContext): Promise<void> {
    return Promise.resolve(undefined);
  },

  resolveNumberEvaluation: jest.fn((): ResolutionDetails<number> => {
    return {
      value: NUMBER_VALUE,
      variant: NUMBER_VARIANT,
      reason: REASON,
    };
  }),

  resolveObjectEvaluation: jest.fn(<U extends JsonValue>(): ResolutionDetails<U> => {

    return <ResolutionDetails<U>>({
      value: OBJECT_VALUE as U,
      variant: OBJECT_VARIANT,
      reason: REASON,
    });
  }) as <U>() => ResolutionDetails<U>,

  resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
    return {
      value: BOOLEAN_VALUE,
      variant: BOOLEAN_VARIANT,
      reason: REASON,
    };

  }),
  resolveStringEvaluation: jest.fn(<U extends string>(): ResolutionDetails<string> => {
    return {
      value: STRING_VALUE,
      variant: STRING_VARIANT,
      reason: REASON,
    };
  })
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
  });
});
