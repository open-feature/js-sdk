# OpenFeature SDK for JavaScript

[![a](https://img.shields.io/badge/slack-%40cncf%2Fopenfeature-brightgreen?style=flat&logo=slack)](https://cloud-native.slack.com/archives/C0344AANLA1)
[![codecov](https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY)](https://codecov.io/gh/open-feature/js-sdk)
[![npm version](https://badge.fury.io/js/@openfeature%2Fjs-sdk.svg)](https://badge.fury.io/js/@openfeature%2Fjs-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/open-feature/js-sdk/badge.svg)](https://snyk.io/test/github/open-feature/js-sdk)
[![v0.5.1](https://img.shields.io/static/v1?label=Specification&message=v0.5.1&color=yellow)](https://github.com/open-feature/spec/tree/v0.5.1)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/6594/badge)](https://bestpractices.coreinfrastructure.org/projects/6594)

<p align="center">
  <strong>
    <a href="https://docs.openfeature.dev/docs/tutorials/getting-started/node">Getting Started<a/>
    &nbsp;&nbsp;&bull;&nbsp;&nbsp;
    <a href="open-feature.github.io/js-sdk">API Documentation<a/>
  </strong>
</p>

---

This is the JavaScript implementation of [OpenFeature][openfeature-website], a vendor-agnostic abstraction library for evaluating feature flags.

We support multiple data types for flags (numbers, strings, booleans, objects) as well as hooks, which can alter the lifecycle of a flag evaluation.

> This library is intended to be used in server-side contexts and has only **experimental support** for web usage. Client-side support can be tracked [here][client-side-github-issue].

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

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to the OpenFeature project.

Our community meetings are held regularly and open to everyone. Check the [OpenFeature community calendar](https://calendar.google.com/calendar/u/0?cid=MHVhN2kxaGl2NWRoMThiMjd0b2FoNjM2NDRAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ) for specific dates and the Zoom meeting links.

### Thanks to everyone that has already contributed

<a href="https://github.com/open-feature/js-sdk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=open-feature/js-sdk" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## License

[Apache License 2.0](LICENSE)

[openfeature-website]: https://openfeature.dev
[server-side-artifacts]: https://docs.openfeature.dev/docs/reference/technologies/server/javascript
[hook-interface]: https://open-feature.github.io/js-sdk/interfaces/Hook.html
[client-side-github-issue]: https://github.com/open-feature/spec/issues/167
