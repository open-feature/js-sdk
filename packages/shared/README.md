<!-- markdownlint-disable MD033 -->
<!-- x-hide-in-docs-start -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">Shared js components (server and web)</h2>

<!-- x-hide-in-docs-end -->
<!-- The 'github-badges' class is used in the docs -->
<p align="center" class="github-badges">
  <a href="https://github.com/open-feature/spec/tree/v0.7.0">
    <img alt="Specification" src="https://img.shields.io/static/v1?label=specification&message=v0.7.0&color=yellow&style=for-the-badge" />
  </a>
  <!-- x-release-please-start-version -->
  <a href="https://github.com/open-feature/js-sdk/releases/tag/server-sdk-v1.6.3">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v1.6.3&color=blue&style=for-the-badge" />
  </a>
  <!-- x-release-please-end -->
  <br/>
  <a href="https://open-feature.github.io/js-sdk/modules/OpenFeature_Server_SDK.html">
    <img alt="API Reference" src="https://img.shields.io/badge/reference-teal?logo=javascript&logoColor=white" />
  </a>
  <a href="https://www.npmjs.com/package/@openfeature/server-sdk">
    <img alt="NPM Download" src="https://img.shields.io/npm/dm/%40openfeature%2Fserver-sdk" />
  </a>
  <a href="https://codecov.io/gh/open-feature/js-sdk">
    <img alt="codecov" src="https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY" />
  </a>
    <a href="https://bestpractices.coreinfrastructure.org/projects/6594">
    <img alt="CII Best Practices" src="https://bestpractices.coreinfrastructure.org/projects/6594/badge" />
  </a>
</p>
<!-- x-hide-in-docs-start -->

[OpenFeature](https://openfeature.dev) is an open standard that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool.

<!-- x-hide-in-docs-end -->

## 🔩 Shared JS components

> [!IMPORTANT]  
> If you're developing a provider or hook, you probably do not want to use this package!

This package comprises the common types and interfaces of the OpenFeature server and web SDKs.
If you are developing a provider or a hook, you should instead utilize the [server](../server/README.md) or [web](../client/README.md) SDKs.
This package is useful if you need to reference the underlying types common to all the JS SDKs, or if you're creating a utility that can be used to both server and web implementations.
Be sure to add this module as either a `devDependency` (if only build time assets such as types are required) or as a `peerDependency` with a permissive version expression.