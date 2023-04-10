<!-- markdownlint-disable MD033 -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg">
    <img align="center" alt="OpenFeature Logo">
  </picture>
</p>

<h2 align="center">OpenFeature Web SDK</h2>

[![Project Status: WIP – Initial development is in progress, but there has not yet been a stable, usable release suitable for the public.](https://www.repostatus.org/badges/latest/wip.svg)](https://www.repostatus.org/#wip)
[![Specification](https://img.shields.io/static/v1?label=Specification&message=v0.5.2&color=yellow)](https://github.com/open-feature/spec/tree/v0.5.2)

## 🧪 This SDK is experimental

The Web SDK is under development and based on a experimental client concepts.
For more information, see this [issue](https://github.com/open-feature/spec/issues/167).

## 👋 Hey there! Thanks for checking out the OpenFeature Web SDK

### What is OpenFeature?

[OpenFeature][openfeature-website] is an open standard that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool.

### Why standardize feature flags?

Standardizing feature flags unifies tools and vendors behind a common interface which avoids vendor lock-in at the code level. Additionally, it offers a framework for building extensions and integrations and allows providers to focus on their unique value proposition.

## 🔍 Requirements:

- ES2015-compatible web browser (Chrome, Edge, Firefox, etc)

## 📦 Installation:

### npm

```sh
npm install @openfeature/web-sdk
```

### yarn

```sh
yarn add @openfeature/web-sdk
```

## 🌟 Features:

- support for various [providers](https://docs.openfeature.dev/docs/reference/concepts/provider)
- easy integration and extension via [hooks](https://docs.openfeature.dev/docs/reference/concepts/hooks)
- handle flags of any type: bool, string, numeric and object
- [context-aware](https://docs.openfeature.dev/docs/reference/concepts/evaluation-context) evaluation

## 🚀 Usage:

### Basics:

```typescript
import { OpenFeature } from '@openfeature/web-sdk';

// configure a provider
await OpenFeature.setProvider(new YourProviderOfChoice());

// create a client
const client = OpenFeature.getClient('my-app');

// get a bool flag value
const boolValue = client.getBooleanValue('boolFlag', false);
```

### Context-aware evaluation:

Sometimes the value of a flag must take into account some dynamic criteria about the application or user, such as the user location, IP, email address, or the location of the server.
In OpenFeature, we refer to this as [`targeting`](https://docs.openfeature.dev/specification/glossary#targeting).
If the flag system you're using supports targeting, you can provide the input data using the `EvaluationContext`.

```typescript
// global context for static data
await OpenFeature.setContext({ origin: document.location.host })

// use contextual data to determine a flag value
const boolValue = client.getBooleanValue('some-flag', false);
```

### Providers:

To develop a provider, you need to create a new project and include the OpenFeature SDK as a dependency. This can be a new repository or included in an existing contrib repository available under the OpenFeature organization. Finally, you’ll then need to write the provider itself. In most languages, this can be accomplished by implementing the provider interface exported by the OpenFeature SDK.

```typescript
import { JsonValue, Provider, ResolutionDetails } from '@openfeature/web-sdk';

// implement the provider interface
class MyProvider implements Provider {
  readonly metadata = {
    name: 'My Provider',
  } as const;

  resolveBooleanEvaluation(flagKey: string, defaultValue: boolean): ResolutionDetails<boolean> {
    // resolve a boolean flag value
  }

  resolveStringEvaluation(flagKey: string, defaultValue: string): ResolutionDetails<string> {
    // resolve a string flag value
  }

  resolveNumberEvaluation(flagKey: string, defaultValue: number): ResolutionDetails<number> {
    // resolve a numeric flag value
  }

  resolveObjectEvaluation<T extends JsonValue>(flagKey: string, defaultValue: T): ResolutionDetails<T> {
    // resolve an object flag value
  }
```

See [here](https://docs.openfeature.dev/docs/reference/technologies/server/javascript) for a catalog of available providers.

### Hooks:

Hooks are a mechanism that allow for the addition of arbitrary behavior at well-defined points of the flag evaluation life-cycle. Use cases include validation of the resolved flag value, modifying or adding data to the evaluation context, logging, telemetry, and tracking.

```typescript
import { OpenFeature, Hook, HookContext } from '@openfeature/web-sdk';

// Example hook that logs if an error occurs during flag evaluation
export class GlobalDebugHook implements Hook {
  after(hookContext: HookContext, err: Error) {
    console.log('hook context', hookContext);
    console.error(err);
  }
}
```

See [here](https://docs.openfeature.dev/docs/reference/technologies/server/javascript) for a catalog of available hooks.

### Logging:

You can implement the `Logger` interface (compatible with the `console` object, and implementations from common logging libraries such as [winston](https://www.npmjs.com/package/winston)) and set it on the global API object.

```typescript
// implement logger
class MyLogger implements Logger {
  error(...args: unknown[]): void {
    // implement me
  }
  warn(...args: unknown[]): void {
    // implement me
  }
  info(...args: unknown[]): void {
    // implement me
  }
  debug(...args: unknown[]): void {
    // implement me
  }
}

// set the logger
OpenFeature.setLogger(new MyLogger());
```

### Complete API documentation:

See [here](https://open-feature.github.io/js-sdk/modules/OpenFeature_Web_SDK.html) for the complete API documentation.

[openfeature-website]: https://openfeature.dev