import { defineFeature, loadFeature } from 'jest-cucumber';
import {
  JsonValue,
  JsonObject,
  EvaluationDetails,
  EvaluationContext,
  ResolutionDetails,
  StandardResolutionReasons,
  ProviderEvents,
} from '@openfeature/core';
import { OpenFeature } from '../..';
// load the feature file.
const feature = loadFeature('packages/server/e2e/features/evaluation.feature');

// get a client (flagd provider registered in setup)
const client = OpenFeature.getClient();

const givenAnOpenfeatureClientIsRegisteredWithCacheDisabled = (
  given: (stepMatcher: string, stepDefinitionCallback: () => void) => void
) => {
  // TODO: when the FlagdProvider is updated to support caching, we may need to disable it here for this test to work as expected.
  given('a provider is registered with cache disabled', () => undefined);
};

defineFeature(feature, (test) => {
  beforeAll((done) => {
    client.addHandler(ProviderEvents.Ready, async () => {
        done();
    });
  });

  afterAll(async () => {
    await OpenFeature.close();
  });

  test('Resolves boolean value', ({ given, when, then }) => {
    let value: boolean;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a boolean flag with key "(.*)" is evaluated with default value "(.*)"$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getBooleanValue(flagKey, defaultValue === 'true');
      }
    );

    then(/^the resolved boolean value should be "(.*)"$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue === 'true');
    });
  });

  test('Resolves string value', ({ given, when, then }) => {
    let value: string;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a string flag with key "(.*)" is evaluated with default value "(.*)"$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getStringValue(flagKey, defaultValue);
      }
    );

    then(/^the resolved string value should be "(.*)"$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue);
    });
  });

  test('Resolves integer value', ({ given, when, then }) => {
    let value: number;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^an integer flag with key "(.*)" is evaluated with default value (\d+)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getNumberValue(flagKey, Number.parseInt(defaultValue));
      }
    );

    then(/^the resolved integer value should be (\d+)$/, (expectedValue: string) => {
      expect(value).toEqual(Number.parseInt(expectedValue));
    });
  });

  test('Resolves float value', ({ given, when, then }) => {
    let value: number;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a float flag with key "(.*)" is evaluated with default value (\d+\.?\d*)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getNumberValue(flagKey, Number.parseFloat(defaultValue));
      }
    );

    then(/^the resolved float value should be (\d+\.?\d*)$/, (expectedValue: string) => {
      expect(value).toEqual(Number.parseFloat(expectedValue));
    });
  });

  test('Resolves object value', ({ given, when, then }) => {
    let value: JsonValue;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(/^an object flag with key "(.*)" is evaluated with a null default value$/, async (key: string) => {
      flagKey = key;
      value = await client.getObjectValue(flagKey, {});
    });

    then(
      /^the resolved object value should be contain fields "(.*)", "(.*)", and "(.*)", with values "(.*)", "(.*)" and (\d+), respectively$/,
      (field1: string, field2: string, field3: string, boolValue: string, stringValue: string, intValue: string) => {
        const jsonObject = value as JsonObject;
        expect(jsonObject[field1]).toEqual(boolValue === 'true');
        expect(jsonObject[field2]).toEqual(stringValue);
        expect(jsonObject[field3]).toEqual(Number.parseInt(intValue));
      }
    );
  });

  test('Resolves boolean details', ({ given, when, then }) => {
    let details: EvaluationDetails<boolean>;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a boolean flag with key "(.*)" is evaluated with details and default value "(.*)"$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getBooleanDetails(flagKey, defaultValue === 'true');
      }
    );

    then(
      /^the resolved boolean details value should be "(.*)", the variant should be "(.*)", and the reason should be "(.*)"$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(expectedValue === 'true');
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves string details', ({ given, when, then }) => {
    let details: EvaluationDetails<string>;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a string flag with key "(.*)" is evaluated with details and default value "(.*)"$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getStringDetails(flagKey, defaultValue);
      }
    );

    then(
      /^the resolved string details value should be "(.*)", the variant should be "(.*)", and the reason should be "(.*)"$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(expectedValue);
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves integer details', ({ given, when, then }) => {
    let details: EvaluationDetails<number>;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^an integer flag with key "(.*)" is evaluated with details and default value (\d+)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getNumberDetails(flagKey, Number.parseInt(defaultValue));
      }
    );

    then(
      /^the resolved integer details value should be (\d+), the variant should be "(.*)", and the reason should be "(.*)"$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(Number.parseInt(expectedValue));
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves float details', ({ given, when, then }) => {
    let details: EvaluationDetails<number>;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a float flag with key "(.*)" is evaluated with details and default value (\d+\.?\d*)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getNumberDetails(flagKey, Number.parseFloat(defaultValue));
      }
    );

    then(
      /^the resolved float details value should be (\d+\.?\d*), the variant should be "(.*)", and the reason should be "(.*)"$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(Number.parseFloat(expectedValue));
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves object details', ({ given, when, then, and }) => {
    let details: EvaluationDetails<JsonValue>; // update this after merge
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(/^an object flag with key "(.*)" is evaluated with details and a null default value$/, async (key: string) => {
      flagKey = key;
      details = await client.getObjectDetails(flagKey, {}); // update this after merge
    });

    then(
      /^the resolved object details value should be contain fields "(.*)", "(.*)", and "(.*)", with values "(.*)", "(.*)" and (\d+), respectively$/,
      (field1: string, field2: string, field3: string, boolValue: string, stringValue: string, intValue: string) => {
        const jsonObject = details.value as JsonObject;

        expect(jsonObject[field1]).toEqual(boolValue === 'true');
        expect(jsonObject[field2]).toEqual(stringValue);
        expect(jsonObject[field3]).toEqual(Number.parseInt(intValue));
      }
    );

    and(
      /^the variant should be "(.*)", and the reason should be "(.*)"$/,
      (expectedVariant: string, expectedReason: string) => {
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves based on context', ({ given, when, and, then }) => {
    const context: EvaluationContext = {};
    let value: string;
    let flagKey: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^context contains keys "(.*)", "(.*)", "(.*)", "(.*)" with values "(.*)", "(.*)", (\d+), "(.*)"$/,
      (
        stringField1: string,
        stringField2: string,
        intField: string,
        boolField: string,
        stringValue1: string,
        stringValue2: string,
        intValue: string,
        boolValue: string
      ) => {
        context[stringField1] = stringValue1;
        context[stringField2] = stringValue2;
        context[intField] = Number.parseInt(intValue);
        context[boolField] = boolValue === 'true';
      }
    );

    and(
      /^a flag with key "(.*)" is evaluated with default value "(.*)"$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getStringValue(flagKey, defaultValue, context);
      }
    );

    then(/^the resolved string response should be "(.*)"$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue);
    });

    and(/^the resolved flag value is "(.*)" when the context is empty$/, async (expectedValue) => {
      const emptyContextValue = await client.getStringValue(flagKey, 'nope', {});
      expect(emptyContextValue).toEqual(expectedValue);
    });
  });

  test('Flag not found', ({ given, when, then, and }) => {
    let flagKey: string;
    let fallbackValue: string;
    let details: ResolutionDetails<string>;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a non-existent string flag with key "(.*)" is evaluated with details and a default value "(.*)"$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        fallbackValue = defaultValue;
        details = await client.getStringDetails(flagKey, defaultValue);
      }
    );

    then(/^the default string value should be returned$/, () => {
      expect(details.value).toEqual(fallbackValue);
    });

    and(
      /^the reason should indicate an error and the error code should indicate a missing flag with "(.*)"$/,
      (errorCode: string) => {
        expect(details.reason).toEqual(StandardResolutionReasons.ERROR);
        expect(details.errorCode).toEqual(errorCode);
      }
    );
  });

  test('Type error', ({ given, when, then, and }) => {
    let flagKey: string;
    let fallbackValue: number;
    let details: ResolutionDetails<number>;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a string flag with key "(.*)" is evaluated as an integer, with details and a default value (\d+)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        fallbackValue = Number.parseInt(defaultValue);
        details = await client.getNumberDetails(flagKey, Number.parseInt(defaultValue));
      }
    );

    then(/^the default integer value should be returned$/, () => {
      expect(details.value).toEqual(fallbackValue);
    });

    and(
      /^the reason should indicate an error and the error code should indicate a type mismatch with "(.*)"$/,
      (errorCode: string) => {
        expect(details.reason).toEqual(StandardResolutionReasons.ERROR);
        expect(details.errorCode).toEqual(errorCode);
      }
    );
  });
});
