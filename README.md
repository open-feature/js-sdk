# OpenFeature SDK for NodeJS

[![a](https://img.shields.io/badge/slack-%40cncf%2Fopenfeature-brightgreen?style=flat&logo=slack)](https://cloud-native.slack.com/archives/C0344AANLA1)
[![codecov](https://codecov.io/gh/open-feature/node-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY)](https://codecov.io/gh/open-feature/node-sdk)
[![npm version](https://badge.fury.io/js/@openfeature%2Fnodejs-sdk.svg)](https://badge.fury.io/js/@openfeature%2Fnodejs-sdk)
[![Known Vulnerabilities](https://snyk.io/test/github/open-feature/node-sdk/badge.svg)](https://snyk.io/test/github/open-feature/node-sdk)
[![Specification](https://img.shields.io/static/v1?label=Specification&message=v0.4.0&color=yellow)](https://github.com/open-feature/spec/tree/v0.4.0)

This is the NodeJS implementation of [OpenFeature](https://openfeature.dev), a vendor-agnostic abstraction library for evaluating feature flags.

We support multiple data types for flags (numbers, strings, booleans, objects) as well as hooks, which can alter the lifecycle of a flag evaluation.

This library is intended to be used in server-side contexts and has not been evaluated for use in mobile devices.

## Installation

```shell
npm install @openfeature/nodejs-sdk
```

or

```shell
yarn add @openfeature/nodejs-sdk
```

## Usage

```typescript
import { OpenFeature } from '@openfeature/nodejs-sdk';

OpenFeature.setProvider(new MyProvider());

const client = OpenFeature.getClient();

const value = await client.getBooleanValue('enabled-new-feature', false);
```

## Development

### Installation and Dependencies

Install dependencies with `npm ci`. `npm install` will update the package-lock.json with the most recent compatible versions.

We value having as few runtime dependencies as possible. The addition of any dependencies requires careful consideration and review.

### Testing

Run tests with `npm test`.

### Packaging

Both ES modules and CommonJS modules are supported, so consumers can use both `require` and `import` functions to utilize this module. This is accomplished by building 2 variations of the output, under `dist/esm` and `dist/cjs`, respectively. To force resolution of the `dist/esm/**.js*` files as modules, a package json with only the context `{"type": "module"}` is included at a in a `postbuild` step. Type declarations are included at `/dist/types/`

For testing purposes, you can add a comment containing "/publish" in any PR. This will publish an experimental SDK version with the git SHA appended to the version number.

## Contributors

Thanks so much to our contributors.

<a href="https://github.com/open-feature/node-sdk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=open-feature/node-sdk" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## License

Apache License 2.0
