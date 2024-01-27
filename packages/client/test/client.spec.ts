import {
  Client,
  ErrorCode,
  EvaluationDetails,
  FlagNotFoundError,
  GeneralError,
  JsonArray,
  JsonObject,
  JsonValue,
  OpenFeature,
  Provider,
  ProviderFatalError,
  ProviderStatus,
  ResolutionDetails,
  StandardResolutionReasons,
} from '../src';
import { OpenFeatureClient } from '../src/client/internal/open-feature-client';

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
  events: undefined,
  hooks: [],
  initialize(): Promise<void> {
    return Promise.resolve(undefined);
  },
  onClose(): Promise<void> {
    return Promise.resolve(undefined);
  },
  onContextChange(): Promise<void> {
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
    return <ResolutionDetails<U>>{
      value: OBJECT_VALUE as U,
      variant: OBJECT_VARIANT,
      reason: REASON,
    };
  }) as <U>() => ResolutionDetails<U>,

  resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
    return {
      value: BOOLEAN_VALUE,
      variant: BOOLEAN_VARIANT,
      reason: REASON,
    };
  }),
  resolveStringEvaluation: jest.fn((): ResolutionDetails<string> => {
    return {
      value: STRING_VALUE,
      variant: STRING_VARIANT,
      reason: REASON,
    };
  }),
};

describe('OpenFeatureClient', () => {
  beforeEach(() => {
    OpenFeature.setProvider(MOCK_PROVIDER);
  });

  afterEach(async () => {
    await OpenFeature.clearProviders();
    jest.clearAllMocks();
  });

  describe('Requirement 1.1.8', () => {
    class mockAsyncProvider implements Provider {
      metadata = {
        name: 'mock-async',
      };

      status = ProviderStatus.NOT_READY;
      readonly runsOn = 'client';

      constructor(private readonly throwInInit: boolean) {}

      async initialize(): Promise<void> {
        if (this.throwInInit) {
          try {
            throw new Error('provider failed to initialize');
          } catch (err) {
            this.status = ProviderStatus.ERROR;
            throw err;
          }
        }
        this.status = ProviderStatus.READY;
        return;
      }

      resolveBooleanEvaluation(): ResolutionDetails<boolean> {
        throw new Error('Method not implemented.');
      }

      resolveStringEvaluation(): ResolutionDetails<string> {
        throw new Error('Method not implemented.');
      }

      resolveNumberEvaluation(): ResolutionDetails<number> {
        throw new Error('Method not implemented.');
      }

      resolveObjectEvaluation<T extends JsonValue>(): ResolutionDetails<T> {
        throw new Error('Method not implemented.');
      }
    }

    it('should wait for the provider to successfully initialize', async () => {
      const spy = jest.spyOn(mockAsyncProvider.prototype, 'initialize');

      const provider = new mockAsyncProvider(false);
      expect(provider.status).toBe(ProviderStatus.NOT_READY);
      await OpenFeature.setProviderAndWait(provider);
      expect(provider.status).toBe(ProviderStatus.READY);
      expect(spy).toHaveBeenCalled();
    });

    it('should wait for the provider to fail during initialization', async () => {
      const spy = jest.spyOn(mockAsyncProvider.prototype, 'initialize');

      const provider = new mockAsyncProvider(true);
      expect(provider.status).toBe(ProviderStatus.NOT_READY);
      await expect(OpenFeature.setProviderAndWait(provider)).rejects.toThrow();
      expect(provider.status).toBe(ProviderStatus.ERROR);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Requirement 1.2.1', () => {
    it('should allow addition of hooks', () => {
      expect(OpenFeatureClient.prototype.addHooks).toBeDefined();
    });
  });

  describe('Requirement 1.2.1', () => {
    const domain = 'my-domain';
    const client = OpenFeature.getClient(domain);

    it('should have metadata accessor with name for backwards compatibility', () => {
      expect(client.metadata.name).toEqual(domain);
    });

    it('should have metadata accessor with domain', () => {
      expect(client.metadata.domain).toEqual(domain);
    });
  });

  describe('Requirement 1.3.1, 1.3.2.1', () => {
    let client: Client;

    beforeEach(() => {
      client = OpenFeature.getClient();
    });

    describe('flag evaluation', () => {
      describe('getBooleanValue', () => {
        it('should return boolean, and call boolean resolver', () => {
          const booleanFlag = 'my-boolean-flag';
          const defaultBooleanValue = false;
          const value = client.getBooleanValue(booleanFlag, defaultBooleanValue);

          expect(value).toEqual(BOOLEAN_VALUE);
          expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(booleanFlag, defaultBooleanValue, {}, {});
        });
      });

      describe('getStringValue', () => {
        describe('with no generic arg (as string)', () => {
          it('should return string, and call string resolver', () => {
            const stringFlag = 'my-string-flag';
            const defaultStringValue = 'default-value';
            const value: string = client.getStringValue(stringFlag, defaultStringValue);

            expect(value).toEqual(STRING_VALUE);
            expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
          });
        });

        describe('with generic arg', () => {
          it('should return T, and call string resolver', () => {
            const stringFlag = 'my-string-flag';
            type MyRestrictedString = 'val' | 'other';
            const defaultStringValue = 'other';
            const value: MyRestrictedString = client.getStringValue<MyRestrictedString>(stringFlag, defaultStringValue);

            expect(value).toEqual(STRING_VALUE);
            expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
          });
        });

        describe('getNumberValue', () => {
          describe('with no generic arg (as number)', () => {
            it('should return number, and call number resolver', () => {
              const numberFlag = 'my-number-flag';
              const defaultNumberValue = 1970;
              const value: number = client.getNumberValue(numberFlag, defaultNumberValue);

              expect(value).toEqual(NUMBER_VALUE);
              expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(
                numberFlag,
                defaultNumberValue,
                {},
                {},
              );
            });
          });

          describe('with generic arg', () => {
            it('should return T, and call number resolver', () => {
              const numberFlag = 'my-number-flag';
              type MyRestrictedNumber = 4096 | 2048;
              const defaultNumberValue = 4096;
              const value: MyRestrictedNumber = client.getNumberValue<MyRestrictedNumber>(
                numberFlag,
                defaultNumberValue,
              );

              expect(value).toEqual(NUMBER_VALUE);
              expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(
                numberFlag,
                defaultNumberValue,
                {},
                {},
              );
            });
          });
        });

        describe('getObjectValue', () => {
          describe('with no generic arg (as JsonValue)', () => {
            it('should return JsonValue, and call object resolver', () => {
              const objectFlag = 'my-object-flag';
              const defaultObjectFlag = {};
              const value: JsonValue = client.getObjectValue(objectFlag, defaultObjectFlag);

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
            it('should return T, and call object resolver', () => {
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
              const value: MyType = client.getObjectValue<MyType>(objectFlag, defaultMyTypeFlag);

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
          it('should return boolean details, and call boolean resolver', () => {
            const booleanFlag = 'my-boolean-flag';
            const defaultBooleanValue = false;
            const booleanDetails = client.getBooleanDetails(booleanFlag, defaultBooleanValue);

            expect(booleanDetails.value).toEqual(BOOLEAN_VALUE);
            expect(booleanDetails.variant).toEqual(BOOLEAN_VARIANT);
            expect(MOCK_PROVIDER.resolveBooleanEvaluation).toHaveBeenCalledWith(
              booleanFlag,
              defaultBooleanValue,
              {},
              {},
            );
          });
        });
        describe('getStringDetails', () => {
          it('should return string details, and call string resolver', () => {
            const stringFlag = 'my-string-flag';
            const defaultStringValue = 'default-value';
            const stringDetails = client.getStringDetails(stringFlag, defaultStringValue);

            expect(stringDetails.value).toEqual(STRING_VALUE);
            expect(stringDetails.variant).toEqual(STRING_VARIANT);
            expect(MOCK_PROVIDER.resolveStringEvaluation).toHaveBeenCalledWith(stringFlag, defaultStringValue, {}, {});
          });
        });

        describe('getNumberDetails', () => {
          it('should return number details, and call number resolver', () => {
            const numberFlag = 'my-number-flag';
            const defaultNumberValue = 1970;
            const numberDetails = client.getNumberDetails(numberFlag, defaultNumberValue);

            expect(numberDetails.value).toEqual(NUMBER_VALUE);
            expect(numberDetails.variant).toEqual(NUMBER_VARIANT);
            expect(MOCK_PROVIDER.resolveNumberEvaluation).toHaveBeenCalledWith(numberFlag, defaultNumberValue, {}, {});
          });
        });

        describe('getObjectDetails', () => {
          it('should return object details, and call object resolver', () => {
            const objectFlag = 'my-object-flag';
            const defaultObjectFlag = {};
            const objectDetails = client.getObjectDetails(objectFlag, defaultObjectFlag);

            expect(objectDetails.value).toEqual(OBJECT_VALUE);
            expect(objectDetails.variant).toEqual(OBJECT_VARIANT);
            expect(MOCK_PROVIDER.resolveObjectEvaluation).toHaveBeenCalledWith(objectFlag, defaultObjectFlag, {}, {});
          });
        });
      });
    });
  });

  describe('Requirement 1.4.3.1', () => {
    describe('generic support', () => {
      it('should support generics', () => {
        // No generic information exists at runtime, but this test has some value in ensuring the generic args still exist in the typings.
        const client = OpenFeature.getClient();
        const details: ResolutionDetails<JsonValue> = client.getObjectDetails('flag', { key: 'value' });

        expect(details).toBeDefined();
      });
    });
  });

  describe('Requirement 1.7.1, 1.7.3', () => {
    const initProvider = {
      metadata: {
        name: 'initProvider',
      },
      initialize: () => {
        return Promise.resolve();
      }
    } as unknown as Provider;
    it('status must be READY if init resolves', async () => {
      await OpenFeature.setProviderAndWait('1.7.1, 1.7.3', initProvider);
      const client = OpenFeature.getClient('1.7.1, 1.7.3');
      expect(client.providerStatus).toEqual(ProviderStatus.READY);
    });
  });

  describe('Requirement 1.7.4', () => {
    const errorProvider = {
      metadata: {
        name: 'errorProvider',
      },
      initialize: async () => {
        return Promise.reject(new GeneralError());
      }
    } as unknown as Provider;
    it('status must be ERROR if init rejects', async () => {
      await expect(OpenFeature.setProviderAndWait('1.7.4', errorProvider)).rejects.toThrow();
      const client = OpenFeature.getClient('1.7.4');
      expect(client.providerStatus).toEqual(ProviderStatus.ERROR);
    });
  });

  describe('Requirement 1.7.5, 1.7.6, 1.7.8', () => {
    const fatalProvider = {
      metadata: {
        name: 'fatalProvider',
      },
      initialize: () => {
        return Promise.reject(new ProviderFatalError());
      }
    } as unknown as Provider;
    it('must short circuit and return PROVIDER_FATAL code if provider FATAL', async () => {
      await expect(OpenFeature.setProviderAndWait('1.7.5, 1.7.6, 1.7.8', fatalProvider)).rejects.toThrow();
      const client = OpenFeature.getClient('1.7.5, 1.7.6, 1.7.8');
      expect(client.providerStatus).toEqual(ProviderStatus.FATAL);

      const defaultVal = 'default';
      const details = await client.getStringDetails('some-flag', defaultVal);
      expect(details.value).toEqual(defaultVal);
      expect(details.errorCode).toEqual(ErrorCode.PROVIDER_FATAL);
    });
  });

  describe('Requirement 1.7.7', () => {
    const neverReadyProvider = {
      metadata: {
        name: 'fatalProvider',
      },
      initialize: () => {
        return new Promise(() => {
          return; // promise never resolves
        });
      }
    } as unknown as Provider;
    it('must short circuit and return PROVIDER_NOT_READY code if provider NOT_READY', async () => {
      OpenFeature.setProviderAndWait('1.7.7', neverReadyProvider).catch(() => {
        // do nothing
      });
      const defaultVal = 'default';
      const client = OpenFeature.getClient('1.7.7');
      expect(client.providerStatus).toEqual(ProviderStatus.NOT_READY);
      const details = await client.getStringDetails('some-flag', defaultVal);
      expect(details.value).toEqual(defaultVal);
      expect(details.errorCode).toEqual(ErrorCode.PROVIDER_NOT_READY);
    });
  });

  describe('Evaluation details structure', () => {
    const flagKey = 'number-details';
    const defaultValue = 1970;
    let details: EvaluationDetails<number>;

    describe('Normal execution', () => {
      beforeEach(() => {
        const client = OpenFeature.getClient();
        details = client.getNumberDetails(flagKey, defaultValue);

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

      beforeEach(() => {
        OpenFeature.setProvider(errorProvider);
        client = OpenFeature.getClient();
        nonOpenFeatureErrorDetails = client.getNumberDetails('some-flag', defaultNumberValue);
        openFeatureErrorDetails = client.getStringDetails('some-flag', defaultStringValue);
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
        it('must not throw, must return default', () => {
          nonOpenFeatureErrorDetails = client.getNumberDetails('some-flag', defaultNumberValue);

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

    describe('Requirement 1.4.13, Requirement 1.4.14', () => {
      it('should return immutable `flag metadata` as defined by the provider', () => {
        const flagMetadata = {
          url: 'https://test.dev',
          version: '1',
        };

        const flagMetadataProvider = {
          metadata: {
            name: 'flag-metadata',
          },
          resolveBooleanEvaluation: jest.fn((): ResolutionDetails<boolean> => {
            return {
              value: true,
              flagMetadata,
            };
          }),
        } as unknown as Provider;

        OpenFeature.setProvider(flagMetadataProvider);
        const client = OpenFeature.getClient();
        const response = client.getBooleanDetails('some-flag', false);
        expect(response.flagMetadata).toBe(flagMetadata);
        expect(Object.isFrozen(response.flagMetadata)).toBeTruthy();
      });

      it('should return empty `flag metadata` because it was not set by the provider', () => {
        // The mock provider doesn't contain flag metadata
        OpenFeature.setProvider(MOCK_PROVIDER);
        const client = OpenFeature.getClient();
        const response = client.getBooleanDetails('some-flag', false);
        expect(response.flagMetadata).toEqual({});
      });
    });
  });

  describe('providerStatus', () => {
    it('should return current provider status', (done) => {
      OpenFeature.setProviderAndWait({
        ...MOCK_PROVIDER,
        initialize: () => {
          return new Promise<void>((resolve) => setTimeout(resolve, 1000));
        },
      }).then(() => {
        expect(OpenFeature.getClient().providerStatus).toEqual(ProviderStatus.READY);
        done();
      });

      expect(OpenFeature.getClient().providerStatus).toEqual(ProviderStatus.NOT_READY);
    });

    it('should return READY if initialize not defined', async () => {
      await OpenFeature.setProviderAndWait({ ...MOCK_PROVIDER, initialize: undefined });
      expect(OpenFeature.getClient().providerStatus).toEqual(ProviderStatus.READY);
    });
  });
});
