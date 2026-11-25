<!-- markdownlint-disable MD033 -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature Vue SDK</h2>

<!-- x-release-please-start-version -->
<a href="https://github.com/open-feature/js-sdk/releases/tag/vue-sdk-v0.1.0">
  <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v0.1.0&color=blue&style=for-the-badge" />
</a>
<!-- x-release-please-end -->

## Overview

The OpenFeature Vue SDK adds Vue-specific functionality to the [OpenFeature Web SDK](https://openfeature.dev/docs/reference/technologies/client/web).
It re-exports the web SDK and provides Vue integrations for feature flag evaluation.

## Requirements

- Vue 3.3 or later
- An ES2015-compatible web browser

## Install

```sh
npm install @openfeature/vue-sdk @openfeature/web-sdk vue
```

## Usage

```ts
import { InMemoryProvider, OpenFeature } from '@openfeature/vue-sdk';

const provider = new InMemoryProvider({
  'new-feature': {
    disabled: false,
    variants: { on: true },
    defaultVariant: 'on',
  },
});

OpenFeature.setProvider(provider);

const enabled = OpenFeature.getClient().getBooleanValue('new-feature', false);
```

## Resources

- [OpenFeature documentation](https://openfeature.dev/docs/)
- [JavaScript SDK repository](https://github.com/open-feature/js-sdk)
