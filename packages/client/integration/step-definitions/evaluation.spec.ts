import { defineFeature, loadFeature } from 'jest-cucumber';
import {
  JsonValue,
  JsonObject,
  EvaluationDetails,
  EvaluationContext,
  ResolutionDetails,
  StandardResolutionReasons,
  ProviderEvents,
} from '@openfeature/shared';
import { OpenFeature, Client } from '../../';
// load the feature file.
const feature = loadFeature('packages/client/integration/features/evaluation.feature');

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
    client.addHandler(ProviderEvents.Ready, () => {
      done();
    });
  });

  afterAll(() => {
    OpenFeature.close();
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
});
