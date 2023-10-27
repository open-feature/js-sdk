import { defineFeature, loadFeature } from 'jest-cucumber';
import {
  JsonValue,
  JsonObject,
  EvaluationDetails,
  EvaluationContext,
  ResolutionDetails,
  StandardResolutionReasons,
} from '@openfeature/core';
import { OpenFeature, ProviderEvents } from '../..';
// load the feature file.
const feature = loadFeature('packages/client/e2e/features/evaluation.feature');

// get a client (flagd provider registered in setup)
const client = OpenFeature.getClient();

const givenAnOpenfeatureClientIsRegisteredWithCacheDisabled = (
  given: (stepMatcher: string, stepDefinitionCallback: () => void) => void
) => {
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

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a boolean flag with key "(.*)" is evaluated with default value "(.*)"$/,
      (key: string, defaultValue: string) => {
        value = client.getBooleanValue(key, defaultValue === 'true');
      }
    );

    then(/^the resolved boolean value should be "(.*)"$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue === 'true');
    });
  });

  test('Resolves string value', ({ given, when, then }) => {
    let value: string;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a string flag with key "(.*)" is evaluated with default value "(.*)"$/,
      (key: string, defaultValue: string) => {
        value = client.getStringValue(key, defaultValue);
      }
    );

    then(/^the resolved string value should be "(.*)"$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue);
    });
  });

  test('Resolves integer value', ({ given, when, then }) => {
    let value: number;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^an integer flag with key "(.*)" is evaluated with default value (\d+)$/,
      (key: string, defaultValue: number) => {
        value = client.getNumberValue(key, defaultValue);
      }
    );

    then(/^the resolved integer value should be (\d+)$/, (expectedStringValue: string) => {
      const expectedNumberValue = parseInt(expectedStringValue);
      expect(value).toEqual(expectedNumberValue);
    });
  });

  test('Resolves float value', ({ given, when, then }) => {
    let value: number;

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a float flag with key "(.*)" is evaluated with default value (\d+\.?\d*)$/,
      (key: string, defaultValue: string) => {
        value = client.getNumberValue(key, Number.parseFloat(defaultValue));
      }
    );

    then(/^the resolved float value should be (\d+\.?\d*)$/, (expectedValue: string) => {
      expect(value).toEqual(Number.parseFloat(expectedValue));
    });
  });

  test('Resolves object value', ({ given, when, then }) => {
    let value: JsonValue;
    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(/^an object flag with key "(.*)" is evaluated with a null default value$/, (key: string) => {
      value = client.getObjectValue<JsonValue>(key, {});
    });

    then(
      /^the resolved object value should be contain fields "(.*)", "(.*)", and "(.*)", with values "(.*)", "(.*)" and (\d+), respectively$/,
      (field1: string, field2: string, field3: string, boolVal: string, strVal: string, intVal: string) => {
        const jsonObject = value as JsonObject;
        expect(jsonObject[field1]).toEqual(boolVal === 'true');
        expect(jsonObject[field2]).toEqual(strVal);
        expect(jsonObject[field3]).toEqual(Number.parseInt(intVal));
      }
    );
  });

  test('Resolves boolean details', ({ given, when, then }) => {
    let details: EvaluationDetails<boolean>;
    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a boolean flag with key "(.*)" is evaluated with details and default value "(.*)"$/,
      (key: string, defaultValue: string) => {
        details = client.getBooleanDetails(key, defaultValue === 'true');
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

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a string flag with key "(.*)" is evaluated with details and default value "(.*)"$/,
      (key: string, defaultValue: string) => {
        details = client.getStringDetails(key, defaultValue);
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

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^an integer flag with key "(.*)" is evaluated with details and default value (\d+)$/,
      (key: string, defaultValue: string) => {
        details = client.getNumberDetails(key, Number.parseInt(defaultValue));
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

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(
      /^a float flag with key "(.*)" is evaluated with details and default value (\d+\.?\d*)$/,
      (key: string, defaultValue: string) => {
        details = client.getNumberDetails(key, Number.parseFloat(defaultValue));
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

    givenAnOpenfeatureClientIsRegisteredWithCacheDisabled(given);

    when(/^an object flag with key "(.*)" is evaluated with details and a null default value$/, (key: string) => {
      details = client.getObjectDetails(key, {}); // update this after merge
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
      async (
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

        await OpenFeature.setContext(context);
      }
    );

    and(/^a flag with key "(.*)" is evaluated with default value "(.*)"$/, (key: string, defaultValue: string) => {
      flagKey = key;
      value = client.getStringValue(flagKey, defaultValue);
    });

    then(/^the resolved string response should be "(.*)"$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue);
    });

    and(/^the resolved flag value is "(.*)" when the context is empty$/, async (expectedValue) => {
      await OpenFeature.setContext({});
      const emptyContextValue = client.getStringValue(flagKey, 'nope', {});
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
      (key: string, defaultValue: string) => {
        flagKey = key;
        fallbackValue = defaultValue;
        details = client.getStringDetails(flagKey, defaultValue);
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
      (key: string, defaultValue: string) => {
        flagKey = key;
        fallbackValue = Number.parseInt(defaultValue);
        details = client.getNumberDetails(flagKey, Number.parseInt(defaultValue));
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
