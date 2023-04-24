
import assert from 'assert';
import { OpenFeature } from '../../src';
import { FlagdProvider } from '@openfeature/flagd-provider';

const FLAGD_NAME = 'flagd Provider';

// register the flagd provider before the tests.
console.log('Setting flagd provider...');
OpenFeature.setProvider(new FlagdProvider({ cache: 'disabled' }));
assert(OpenFeature.providerMetadata.name === FLAGD_NAME, new Error(`Expected ${FLAGD_NAME} provider to be configured, instead got: ${OpenFeature.providerMetadata.name}`));
console.log('flagd provider configured!');
