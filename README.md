<!-- markdownlint-disable MD033 -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg">
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature JavaScript SDKs</h2>

[![Known Vulnerabilities](https://snyk.io/test/github/open-feature/js-sdk/badge.svg)](https://snyk.io/test/github/open-feature/js-sdk)
[![codecov](https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY)](https://codecov.io/gh/open-feature/js-sdk)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/6594/badge)](https://bestpractices.coreinfrastructure.org/projects/6594)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fopen-feature%2Fjs-sdk.svg?type=shield)](https://app.fossa.com/projects/git%2Bgithub.com%2Fopen-feature%2Fjs-sdk?ref=badge_shield)
[![NPM Download](https://img.shields.io/npm/dm/%40openfeature%2Fcore)](https://www.npmjs.com/package/@openfeature/core)

## 👋 Hey there! Thanks for checking out the OpenFeature JavaScript SDKs

### What is OpenFeature?

[OpenFeature][openfeature-website] is an open standard that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool.

### Why standardize feature flags?

Standardizing feature flags unifies tools and vendors behind a common interface which avoids vendor lock-in at the code level. Additionally, it offers a framework for building extensions and integrations and allows providers to focus on their unique value proposition.

## 🔧 Components

This repository contains both the server-side JS and web-browser SDKs.
For details, including API documentation, see the respective README files.

- [Server SDK](./packages/server/README.md), for use in Node.js and similar runtimes.
  - [NestJS SDK](./packages/nest/README.md), a distribution of the Server SDK with built-in NestJS-specific features.
- [Web SDK](./packages/web/README.md), for use in the web browser.
  - [React SDK](./packages/react//README.md), a distribution of the Web SDK with built-in React-specific features.

Each have slightly different APIs, but share many underlying types and components.

## ⭐️ Support the project

- Give this repo a ⭐️!
- [Contribute](#-contributing) to this repo
- Follow us social media:
  - Twitter: [@openfeature](https://twitter.com/openfeature)
  - LinkedIn: [OpenFeature](https://www.linkedin.com/company/openfeature/)
- Join us on [Slack](https://cloud-native.slack.com/archives/C0344AANLA1)
- For more check out our [community page](https://openfeature.dev/community/)

## 🤝 Contributing

Interested in contributing? Great, we'd love your help! To get started, take a look at the [CONTRIBUTING](CONTRIBUTING.md) guide.

### Thanks to everyone that has already contributed

<a href="https://github.com/open-feature/js-sdk/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=open-feature/js-sdk" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## 📜 License

[Apache License 2.0](LICENSE)

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fopen-feature%2Fjs-sdk.svg?type=large)](https://app.fossa.com/projects/git%2Bgithub.com%2Fopen-feature%2Fjs-sdk?ref=badge_large)

[openfeature-website]: https://openfeature.dev
