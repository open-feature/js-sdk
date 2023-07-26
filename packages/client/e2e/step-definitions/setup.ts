import assert from 'assert';
import { OpenFeature } from '../..';
import { FlagdWebProvider } from '@openfeature/flagd-web-provider';

const FLAGD_NAME = 'flagd-web';

// register the flagd provider before the tests.
console.log('Setting flagd web provider...');
const provider = new FlagdWebProvider({
  host: 'localhost',
  port: 8013,
  tls: false,
  maxRetries: -1,
});
// TODO: remove this when provider updated to properly use state.
provider.initialize({});
OpenFeature.setProvider(provider);
assert(
  OpenFeature.providerMetadata.name === FLAGD_NAME,
  new Error(`Expected ${FLAGD_NAME} provider to be configured, instead got: ${OpenFeature.providerMetadata.name}`)
);
console.log('flagd web provider configured!');
