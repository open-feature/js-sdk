# OpenFeature JavaScript SDKs

[![a](https://img.shields.io/badge/slack-%40cncf%2Fopenfeature-brightgreen?style=flat&logo=slack)](https://cloud-native.slack.com/archives/C0344AANLA1)
[![Known Vulnerabilities](https://snyk.io/test/github/open-feature/js-sdk/badge.svg)](https://snyk.io/test/github/open-feature/js-sdk)
[![codecov](https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY)](https://codecov.io/gh/open-feature/js-sdk)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/6594/badge)](https://bestpractices.coreinfrastructure.org/projects/6594)

This repository contains the JavaScript implementations of [OpenFeature][openfeature-website], a vendor-agnostic abstraction library for evaluating feature flags.

We support multiple data types for flags (numbers, strings, booleans, objects) as well as hooks, which can alter the lifecycle of a flag evaluation.

## Server

---

[![npm version](https://badge.fury.io/js/@openfeature%2Fjs-sdk.svg)](https://badge.fury.io/js/@openfeature%2Fjs-sdk)
[![v0.5.1](https://img.shields.io/static/v1?label=Specification&message=v0.5.1&color=yellow)](https://github.com/open-feature/spec/tree/v0.5.1)

<p align="center">
  <strong>
    <!-- TODO: add direct link to server module when published -->
    <a href="https://docs.openfeature.dev/docs/tutorials/getting-started/node">Getting Started<a/>
    &nbsp;&nbsp;&bull;&nbsp;&nbsp;
    <a href="https://open-feature.github.io/js-sdk">API Documentation<a/>
  </strong>
</p>

---

### Installation

```shell
npm install @openfeature/js-sdk
```

or

```shell
yarn add @openfeature/js-sdk
```

See [README.md](./packages/server/README.md)

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
