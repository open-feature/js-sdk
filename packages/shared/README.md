<!-- markdownlint-disable MD033 -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">Shared js components (server and web)</h2>

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool.

## 🔩 Shared JS components

> [!IMPORTANT]  
> If you're developing a provider or hook, you probably do not want to use this package!

This package comprises the common types and interfaces of the OpenFeature server and web SDKs.
If you are developing a provider or a hook, you should instead utilize the [server](../server/README.md) or [web](../client/README.md) SDKs.
This package is useful if you need to reference the underlying types common to all the JS SDKs or if you're creating a utility that can be used for both server and web implementations.
Be sure to add this module as either a `devDependency` (if only build time assets such as types are required) or as a `peerDependency` with a permissive version expression.

### API Reference

See [here](https://open-feature.github.io/js-sdk/modules/_openfeature_core.html) for the complete API documentation.
