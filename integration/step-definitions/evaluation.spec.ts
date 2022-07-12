import { defineFeature, loadFeature } from 'jest-cucumber';
import { OpenFeature } from '../../src/open-feature.js';

// load the feature file.
const feature = loadFeature('integration/features/evaluation.feature');

// get a client (flagd provider registered in setup)
const client = OpenFeature.getClient();

defineFeature(feature, (test) => {
  test('Resolves boolean value', ({ given, when, then }) => {
    let expectedValue: boolean;
    let value: boolean;
    let flagKey: string;

    given(/^A boolean flag called (.*) with value (.*) exists$/, (key, value) => {
      flagKey = key;
      // convert to bool
      expectedValue = value === 'true';
    });

    when(/^Flag is evaluated with default value (.*)$/, async (defaultValue) => {
      value = await client.getBooleanValue(flagKey, defaultValue === 'true' ? true : false);
    });

    then(/^The resolved value should match the flag value$/, () => {
      expect(value).toEqual(expectedValue);
    });
  });

  test('Resolves string value', ({ given, when, then }) => {
    let expectedValue: string;
    let value: string;
    let flagKey: string;

    given(/^A string flag called (.*) with value (.*) exists$/, (key, value) => {
      flagKey = key;
      expectedValue = value;
    });

    when(/^Flag is evaluated with default value (.*)$/, async (defaultValue) => {
      value = await client.getStringValue(flagKey, defaultValue);
    });

    then(/^The resolved value should match the flag value$/, () => {
      expect(value).toEqual(expectedValue);
    });
  });

  test('Resolves number value', ({ given, when, then }) => {
    let expectedValue: number;
    let value: number;
    let flagKey: string;

    given(/^A number flag called (.*) with value (.*) exists$/, (key, value) => {
      flagKey = key;
      expectedValue = Number.parseInt(value);
    });

    when(/^Flag is evaluated with default value (.*)$/, async (defaultValue) => {
      value = await client.getNumberValue(flagKey, Number.parseInt(defaultValue));
    });

    then(/^The resolved value should match the flag value$/, () => {
      expect(value).toEqual(expectedValue);
    });
  });
});
