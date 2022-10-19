# OpenFeature SDK for JavaScript

[![a](https://img.shields.io/badge/slack-%40cncf%2Fopenfeature-brightgreen?style=flat&logo=slack)](https://cloud-native.slack.com/archives/C0344AANLA1)
[![codecov](https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY)](https://codecov.io/gh/open-feature/js-sdk)
[![npm version](https://badge.fury.io/js/@openfeature%2Fjs-sdk.svg)](https://badge.fury.io/js/@openfeature%2Fjs-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/open-feature/js-sdk/badge.svg)](https://snyk.io/test/github/open-feature/js-sdk)
[![v0.5.1](https://img.shields.io/static/v1?label=Specification&message=v0.5.1&color=yellow)](https://github.com/open-feature/spec/tree/v0.5.1)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/6594/badge)](https://bestpractices.coreinfrastructure.org/projects/6594)

This is the JavaScript implementation of [OpenFeature](https://openfeature.dev), a vendor-agnostic abstraction library for evaluating feature flags.

We support multiple data types for flags (numbers, strings, booleans, objects) as well as hooks, which can alter the lifecycle of a flag evaluation.

**This library is intended to be used in server-side contexts and has only experimental support for web usage.**

## Installation

```shell
npm install @openfeature/js-sdk
```

or

```shell
yarn add @openfeature/js-sdk
```

## Usage

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

For complete documentation, visit: https://docs.openfeature.dev/docs/category/concepts

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to the OpenFeature project.

Our community meetings are held regularly and open to everyone. Check the [OpenFeature community calendar](https://calendar.google.com/calendar/u/0?cid=MHVhN2kxaGl2NWRoMThiMjd0b2FoNjM2NDRAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ) for specific dates and for the Zoom meeting links.

Thanks so much to our contributors.

<a href="https://github.com/open-feature/js-sdk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=open-feature/js-sdk" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## License

[Apache License 2.0](LICENSE)
