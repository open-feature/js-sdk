# @openfeature/js-sdk

Server-side JavaScript implementation of intended for use in Node.JS and comparable runtimes
  
## Installation

```shell
npm install @openfeature/js-sdk
```

or

```shell
yarn add @openfeature/js-sdk
```

## Usage

To configure the SDK you'll need to add a provider to the `OpenFeature` global signleton. From there, you can generate a `client` which is usable by your code. While you'll likely want a provider for your specific backend, we've provided a `NoopProvider`, which simply returns the default value.

```typescript
import { OpenFeature } from '@openfeature/js-sdk';

// configure a provider
OpenFeature.setProvider(new YourProviderOfChoice());

// create a client
const client = OpenFeature.getClient('my-app');

// get a bool value
const boolValue = await client.getBooleanValue('boolFlag', false);

// get a string value
const stringValue = await client.getStringValue('stringFlag', 'default');

// get an numeric value
const numberValue = await client.getNumberValue('intFlag', 1);

// get an object value
const object = await client.getObjectValue<MyObject>('objectFlag', {});

// add a value to the invocation context
const context: EvaluationContext = {
  myInvocationKey: 'myInvocationValue',
};
const contextAwareValue = await client.getBooleanValue('boolFlag', false, context);
```

A list of available providers can be found [here][server-side-artifacts].

For complete documentation, visit: https://docs.openfeature.dev/docs/category/concepts

## Hooks

Implement your own hook by conforming to the [Hook interface][hook-interface].

All of the hook stages (before, after, error, and finally) are optional.

```typescript
import { OpenFeature, Hook, HookContext } from '@openfeature/js-sdk';

// Example hook that logs if an error occurs during flag evaluation
export class GlobalDebugHook implements Hook {
  after(hookContext: HookContext, err: Error) {
    console.log('hook context', hookContext);
    console.error(err);
  }
}
```

Register the hook at global, client, or invocation level.

```typescript
import { OpenFeature } from '@openfeature/js-sdk';
// This hook used is used for example purposes
import { GlobalDebugHook, ClientDebugHook, InvocationDebugHook } from './debug-hook';

// A global hook will run on every flag evaluation
OpenFeature.addHooks(new GlobalDebugHook());

const client = OpenFeature.getClient('my-app');
// A client hook will run on every flag evaluation executed by this client
client.addHooks(new ClientDebugHook());

// An invocation hook will only run on the registred flag evaluation method
const boolValue = await client.getBooleanValue('boolFlag', false, {}, { hooks: [new InvocationDebugHook()] });
```

A list of available hooks can be found [here][server-side-artifacts].
