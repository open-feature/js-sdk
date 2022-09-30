import { defineFeature, loadFeature } from 'jest-cucumber';
import { OpenFeature } from '../../src/open-feature';
import {
  EvaluationContext,
  EvaluationDetails,
  JsonObject,
  JsonValue,
  ResolutionDetails, StandardResolutionReasons
} from '../../src/types';

// load the feature file.
const feature = loadFeature('integration/features/evaluation.feature');

// get a client (flagd provider registered in setup)
const client = OpenFeature.getClient();

defineFeature(feature, (test) => {
  test('Resolves boolean value', ({ when, then }) => {
    let value: boolean;
    let flagKey: string;

    when(
      /^a boolean flag with key '(.*)' is evaluated with default value '(.*)'$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getBooleanValue(flagKey, defaultValue === 'true');
      }
    );

    then(/^the resolved boolean value should be '(.*)'$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue === 'true');
    });
  });

  test('Resolves string value', ({ when, then }) => {
    let value: string;
    let flagKey: string;

    when(
      /^a string flag with key '(.*)' is evaluated with default value '(.*)'$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getStringValue(flagKey, defaultValue);
      }
    );

    then(/^the resolved string value should be '(.*)'$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue);
    });
  });

  test('Resolves integer value', ({ when, then }) => {
    let value: number;
    let flagKey: string;

    when(
      /^an integer flag with key '(.*)' is evaluated with default value (\d+)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getNumberValue(flagKey, Number.parseInt(defaultValue));
      }
    );

    then(/^the resolved integer value should be (\d+)$/, (expectedValue: string) => {
      expect(value).toEqual(Number.parseInt(expectedValue));
    });
  });

  test('Resolves float value', ({ when, then }) => {
    let value: number;
    let flagKey: string;

    when(
      /^a float flag with key '(.*)' is evaluated with default value (\d+\.?\d*)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        value = await client.getNumberValue(flagKey, Number.parseFloat(defaultValue));
      }
    );

    then(/^the resolved float value should be (\d+\.?\d*)$/, (expectedValue: string) => {
      expect(value).toEqual(Number.parseFloat(expectedValue));
    });
  });

  test('Resolves object value', ({ when, then }) => {
    let value: JsonValue;
    let flagKey: string;

    when(/^an object flag with key '(.*)' is evaluated with a null default value$/, async (key: string) => {
      flagKey = key;
      value = await client.getObjectValue(flagKey, {});
    });

    then(
      /^the resolved object value should be contain fields '(.*)', '(.*)', and '(.*)', with values '(.*)', '(.*)' and (\d+), respectively$/,
      (field1: string, field2: string, field3: string, boolValue: string, stringValue: string, intValue: string) => {
        const jsonObject = value as JsonObject;
        expect(jsonObject[field1]).toEqual(boolValue === 'true');
        expect(jsonObject[field2]).toEqual(stringValue);
        expect(jsonObject[field3]).toEqual(Number.parseInt(intValue));
      }
    );
  });

  test('Resolves boolean details', ({ when, then }) => {
    let details: EvaluationDetails<boolean>;
    let flagKey: string;

    when(
      /^a boolean flag with key '(.*)' is evaluated with details and default value '(.*)'$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getBooleanDetails(flagKey, defaultValue === 'true');
      }
    );

    then(
      /^the resolved boolean details value should be '(.*)', the variant should be '(.*)', and the reason should be '(.*)'$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(expectedValue === 'true');
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves string details', ({ when, then }) => {
    let details: EvaluationDetails<string>;
    let flagKey: string;

    when(
      /^a string flag with key '(.*)' is evaluated with details and default value '(.*)'$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getStringDetails(flagKey, defaultValue);
      }
    );

    then(
      /^the resolved string details value should be '(.*)', the variant should be '(.*)', and the reason should be '(.*)'$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(expectedValue);
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves integer details', ({ when, then }) => {
    let details: EvaluationDetails<number>;
    let flagKey: string;

    when(
      /^an integer flag with key '(.*)' is evaluated with details and default value (\d+)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getNumberDetails(flagKey, Number.parseInt(defaultValue));
      }
    );

    then(
      /^the resolved integer details value should be (\d+), the variant should be '(.*)', and the reason should be '(.*)'$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(Number.parseInt(expectedValue));
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves float details', ({ when, then }) => {
    let details: EvaluationDetails<number>;
    let flagKey: string;

    when(
      /^a float flag with key '(.*)' is evaluated with details and default value (\d+\.?\d*)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        details = await client.getNumberDetails(flagKey, Number.parseFloat(defaultValue));
      }
    );

    then(
      /^the resolved float details value should be (\d+\.?\d*), the variant should be '(.*)', and the reason should be '(.*)'$/,
      (expectedValue: string, expectedVariant: string, expectedReason: string) => {
        expect(details.value).toEqual(Number.parseFloat(expectedValue));
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves object details', ({ when, then, and }) => {
    let details: EvaluationDetails<JsonValue>; // update this after merge
    let flagKey: string;

    when(/^an object flag with key '(.*)' is evaluated with details and a null default value$/, async (key: string) => {
      flagKey = key;
      details = await client.getObjectDetails(flagKey, {}); // update this after merge
    });

    then(
      /^the resolved object details value should be contain fields '(.*)', '(.*)', and '(.*)', with values '(.*)', '(.*)' and (\d+), respectively$/,
      (field1: string, field2: string, field3: string, boolValue: string, stringValue: string, intValue: string) => {
        const jsonObject = details.value as JsonObject;

        expect(jsonObject[field1]).toEqual(boolValue === 'true');
        expect(jsonObject[field2]).toEqual(stringValue);
        expect(jsonObject[field3]).toEqual(Number.parseInt(intValue));
      }
    );

    and(
      /^the variant should be '(.*)', and the reason should be '(.*)'$/,
      (expectedVariant: string, expectedReason: string) => {
        expect(details.variant).toEqual(expectedVariant);
        expect(details.reason).toEqual(expectedReason);
      }
    );
  });

  test('Resolves based on context', ({ when, and, then }) => {
    const context: EvaluationContext = {};
    let value: string;
    let flagKey: string;

    when(
      /^context contains keys '(.*)', '(.*)', '(.*)', '(.*)' with values '(.*)', '(.*)', (\d+), '(.*)'$/,
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

    and(/^a flag with key '(.*)' is evaluated with default value '(.*)'$/, async (key: string, defaultValue: string) => {
      flagKey = key;
      value = await client.getStringValue(flagKey, defaultValue, context);
    });

    then(/^the resolved string response should be '(.*)'$/, (expectedValue: string) => {
      expect(value).toEqual(expectedValue);
    });

    and(/^the resolved flag value is '(.*)' when the context is empty$/, async (expectedValue) => {
      const emptyContextValue = await client.getStringValue(flagKey, 'nope', {});
      expect(emptyContextValue).toEqual(expectedValue);
    });
  });

  test('Flag not found', ({ when, then, and }) => {
    let flagKey: string;
    let fallbackValue: string;
    let details: ResolutionDetails<string>;

    when(
      /^a non-existent string flag with key '(.*)' is evaluated with details and a default value '(.*)'$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        fallbackValue = defaultValue;
        details = await client.getStringDetails(flagKey, defaultValue);
      }
    );

    then(/^then the default string value should be returned$/, () => {
      expect(details.value).toEqual(fallbackValue);
    });

    and(
      /^the reason should indicate an error and the error code should indicate a missing flag with '(.*)'$/,
      (errorCode: string) => {
        expect(details.reason).toEqual(StandardResolutionReasons.ERROR);
        expect(details.errorCode).toEqual(errorCode);
      }
    );
  });

  test('Type error', ({ when, then, and }) => {
    let flagKey: string;
    let fallbackValue: number;
    let details: ResolutionDetails<number>;

    when(
      /^a string flag with key '(.*)' is evaluated as an integer, with details and a default value (\d+)$/,
      async (key: string, defaultValue: string) => {
        flagKey = key;
        fallbackValue = Number.parseInt(defaultValue);
        details = await client.getNumberDetails(flagKey, Number.parseInt(defaultValue));
      }
    );

    then(/^then the default integer value should be returned$/, () => {
      expect(details.value).toEqual(fallbackValue);
    });

    and(
      /^the reason should indicate an error and the error code should indicate a type mismatch with '(.*)'$/,
      (errorCode: string) => {
        expect(details.reason).toEqual(StandardResolutionReasons.ERROR);
        expect(details.errorCode).toEqual(errorCode);
      }
    );
  });
});
