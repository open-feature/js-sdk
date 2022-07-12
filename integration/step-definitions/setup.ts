import { OpenFeature } from '../../src/open-feature.js';
import { FlagdRESTProvider } from '@openfeature/flagd-rest-provider';
import assert from 'assert';

// register the flagd provider before the tests.
console.log('Setting flagd provider...');
OpenFeature.setProvider(new FlagdRESTProvider());
assert(OpenFeature.providerMetadata.name === 'Flagd REST', new Error('Expected flagd provider to be configured!'));
console.log('flagd provider configured!');
