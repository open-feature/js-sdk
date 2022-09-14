import { OpenFeature } from '../../src/open-feature.js';
import { FlagdProvider } from '@openfeature/flagd-provider';
import assert from 'assert';

const FLAGD_NAME = 'flagd Provider';

// register the flagd provider before the tests.
console.log('Setting flagd provider...');
OpenFeature.setProvider(new FlagdProvider());
assert(OpenFeature.providerMetadata.name === FLAGD_NAME, new Error(`Expected ${FLAGD_NAME} provider to be configured, instead got: ${OpenFeature.providerMetadata.name}`));
console.log('flagd provider configured!');
