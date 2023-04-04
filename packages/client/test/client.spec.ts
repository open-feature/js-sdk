import {
  ErrorCode,
  EvaluationContext,
  EvaluationDetails,
  JsonValue,
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
    });
  });
});
