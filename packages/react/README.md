<!-- markdownlint-disable MD033 -->
<!-- x-hide-in-docs-start -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature React SDK</h2>

<!-- x-hide-in-docs-end -->
<!-- The 'github-badges' class is used in the docs -->
<p align="center" class="github-badges">
  <a href="https://github.com/open-feature/spec/releases/tag/v0.7.0">
    <img alt="Specification" src="https://img.shields.io/static/v1?label=specification&message=v0.7.0&color=yellow&style=for-the-badge" />
  </a>
  <!-- x-release-please-start-version -->
  <a href="https://github.com/open-feature/js-sdk/releases/tag/react-sdk-v0.2.3-experimental">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v0.2.3-experimental&color=blue&style=for-the-badge" />
  </a>
  <!-- x-release-please-end -->
  <br/>
  <a href="https://codecov.io/gh/open-feature/js-sdk">
    <img alt="codecov" src="https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY" />
  </a>
  <a href="https://www.npmjs.com/package/@openfeature/react-sdk">
    <img alt="NPM Download" src="https://img.shields.io/npm/dm/%40openfeature%2Freact-sdk" />
  </a>
</p>
<!-- x-hide-in-docs-start -->

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool or in-house solution.

<!-- x-hide-in-docs-end -->

🧪 This SDK is experimental.

## Overview

The OpenFeature React SDK adds React-specific functionality to the [OpenFeature Web SDK](https://openfeature.dev/docs/reference/technologies/client/web).

In addition to the feature provided by the [web sdk](https://openfeature.dev/docs/reference/technologies/client/web), capabilities include:

- [Overview](#overview)
- [Quick start](#quick-start)
  - [Requirements](#requirements)
  - [Install](#install)
    - [npm](#npm)
    - [yarn](#yarn)
    - [Required peer dependencies](#required-peer-dependencies)
  - [Usage](#usage)
  - [Multiple Providers and Domains](#multiple-providers-and-domains)
  - [Re-rendering with Context Changes](#re-rendering-with-context-changes)
  - [Re-rendering with Flag Configuration Changes](#re-rendering-with-flag-configuration-changes)
  - [Suspense Support](#suspense-support)
- [Resources](#resources)

## Quick start

### Requirements

- ES2022-compatible web browser (Chrome, Edge, Firefox, etc)
- React version 16.8+

### Install

#### npm

```sh
npm install --save @openfeature/react-sdk
```

#### yarn

```sh
# yarn requires manual installation of the peer dependencies (see below)
yarn add @openfeature/react-sdk @openfeature/web-sdk @openfeature/core
```

#### Required peer dependencies

The following list contains the peer dependencies of `@openfeature/react-sdk` with its expected and compatible versions:

* `@openfeature/web-sdk`: >=1.0.0
* `react`: >=16.8.0

### Usage

The `OpenFeatureProvider` represents a scope for feature flag evaluations within a React application.
It binds an OpenFeature client to all evaluations within child components, and allows the use of evaluation hooks.
The example below shows how to use the `OpenFeatureProvider` with OpenFeature's `InMemoryProvider`.

```tsx
import { EvaluationContext, OpenFeatureProvider, useFlag, OpenFeature, InMemoryProvider } from '@openfeature/react-sdk';

const flagConfig = {
  'new-message': {
    disabled: false,
    variants: {
      on: true,
      off: false,
    },
    defaultVariant: "on",
    contextEvaluator: (context: EvaluationContext) => {
      if (context.silly) {
        return 'on';
      }
      return 'off'
    }
  },
};

// Instantiate and set our provider (be sure this only happens once)!
// Note: there's no need to await it's initialization, the React SDK handles re-rendering and suspense for you!
OpenFeature.setProvider(new InMemoryProvider(flagConfig));

// Enclose your content in the configured provider
function App() {
  return (
    <OpenFeatureProvider>
      <Page></Page>
    </OpenFeatureProvider>
  );
}

function Page() {
  // Use the "query-style" flag evaluation hook.
  const { value: newMessageFlagValue } = useFlag('new-message', true);
  return (
    <div className="App">
      <header className="App-header">
        {newMessageFlagValue ? <p>Welcome to this OpenFeature-enabled React app!</p> : <p>Welcome to this React app.</p>}
      </header>
    </div>
  )
}

export default App;
```
You can use the strongly-typed flag value and flag evaluation detail hooks as well, if you prefer.

```tsx
import { useBooleanFlagValue } from '@openfeature/react-sdk';

// boolean flag evaluation
const value = useBooleanFlagValue('new-message', false);
```

```tsx
import { useBooleanFlagDetails } from '@openfeature/react-sdk';

// "detailed" boolean flag evaluation
const {
  value,
  variant,
  reason,
  flagMetadata
} = useBooleanFlagDetails('new-message', false);
```

### Multiple Providers and Domains


Multiple providers can be used by passing a `domain` to the `OpenFeatureProvider`:

```tsx
// Flags within this domain will use the a client/provider associated with `my-domain`,
function App() {
  return (
    <OpenFeatureProvider domain={'my-domain'}>
      <Page></Page>
    </OpenFeatureProvider>
  );
}
```

This is analogous to:

```ts
OpenFeature.getClient('my-domain');
```

For more information about `domains`, refer to the [web SDK](https://github.com/open-feature/js-sdk/blob/main/packages/client/README.md).

### Re-rendering with Context Changes

By default, if the OpenFeature [evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context) is modified, components will be re-rendered.
This is useful in cases where flag values are dependant on user-attributes or other application state (user logged in, items in card, etc).
You can disable this feature in the hook options:

```tsx
function Page() {
  const newMessageFlagValue = useBooleanFlagValue('new-message', false, { updateOnContextChanged: false });
  return (
    <MyComponents></MyComponents>
  )
}
```

For more information about how evaluation context works in the React SDK, see the documentation on OpenFeature's [static context SDK paradigm](https://openfeature.dev/specification/glossary/#static-context-paradigm).

### Re-rendering with Flag Configuration Changes

By default, if the underlying provider emits a `ConfigurationChanged` event, components will be re-rendered.
This is useful if you want your UI to immediately reflect changes in the backend flag configuration.
You can disable this feature in the hook options:

```tsx
function Page() {
  const newMessageFlagValue = useBooleanFlagValue('new-message', false, { updateOnConfigurationChanged: false });
  return (
    <MyComponents></MyComponents>
  )
}
```

Note that if your provider doesn't support updates, this configuration has no impact.

### Suspense Support

Frequently, providers need to perform some initial startup tasks.
It may be desireable not to display components with feature flags until this is complete.
Built-in [suspense](https://react.dev/reference/react/Suspense) support makes this easy: 

```tsx
function Content() {
  // cause the "fallback" to be displayed if the component uses feature flags and the provider is not ready
  return (
    <Suspense fallback={<Fallback />}>
      <Message />
    </Suspense>
  );
}

function Message() {
  // component to render after READY.
  const newMessageFlagValue = useBooleanFlagValue('new-message', false);

  return (
    <>
      {newMessageFlagValue ? (
        <p>Welcome to this OpenFeature-enabled React app!</p>
      ) : (
        <p>Welcome to this plain old React app!</p>
      )}
    </>
  );
}

function Fallback() {
  // component to render before READY.
  return <p>Waiting for provider to be ready...</p>;
}
```

## Resources

 - [Example repo](https://github.com/open-feature/react-test-app)
