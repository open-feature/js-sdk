# In-Memory Provider

An *extremely* simple OpenFeature provider, intended for simple demos and as a test stub.

Flagging decisions are static - evaluation context is ignored. The only way to change a flag value is 
to replace the entire configuration (with `replaceConfiguration`), and this is only intended to be used
when the provider is acting as a test stub.

Object values are not currently supported (but a PR implementing them would be gratefully received!)

## Installation

```
$ npm install @openfeature/in-memory-provider
```

## Usage

### set up the provider with some flag values
```
import { InMemoryProvider } from '@openfeature/in-memory-provider'
import { OpenFeature } from '@openfeature/js-sdk'

const flags = {
  'a-boolean-flag': true,
  'a-string-flag': 'the flag value',
}
const provider = new InMemoryProvider(flags)
OpenFeature.setProvider(provider)
```

### check a flag's value
```
// create a client
const client = OpenFeature.getClient('my-app');

// get that hardcoded boolean flag
const boolValue = await client.getBooleanValue('a-boolean-flag', false);
```

### replace the flag configuration
*a crude facility for when the provider is being used as a test stub*

```
provider.replaceConfiguration({
  'a-boolean-flag': false
})
```

Note that this entirely replaces the previous configuration - no merging is
performed and all previous values are lost.


## Development

Run `nx package providers-in-memory` to build the library.

Run `nx test providers-in-memory` to execute the unit tests via [Jest](https://jestjs.io).
