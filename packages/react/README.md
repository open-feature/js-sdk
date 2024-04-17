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
  <a href="https://github.com/open-feature/js-sdk/releases/tag/react-sdk-v0.3.2-experimental">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v0.3.2-experimental&color=blue&style=for-the-badge" />
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
    - [OpenFeatureProvider context provider](#openfeatureprovider-context-provider)
    - [Evaluation hooks](#evaluation-hooks)
    - [Multiple Providers and Domains](#multiple-providers-and-domains)
    - [Re-rendering with Context Changes](#re-rendering-with-context-changes)
    - [Re-rendering with Flag Configuration Changes](#re-rendering-with-flag-configuration-changes)
    - [Suspense Support](#suspense-support)
- [FAQ and troubleshooting](#faq-and-troubleshooting)
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

The following list contains the peer dependencies of `@openfeature/react-sdk`.
See the [package.json](./package.json) for the required versions.

* `@openfeature/web-sdk`
* `react`

### Usage

#### OpenFeatureProvider context provider

The `OpenFeatureProvider` is a [React context provider](https://react.dev/reference/react/createContext#provider) which represents a scope for feature flag evaluations within a React application.
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
// Note: there's no need to await its initialization, the React SDK handles re-rendering and suspense for you!
OpenFeature.setProvider(new InMemoryProvider(flagConfig));

// Enclose your content in the configured provider
function App() {
  return (
    <OpenFeatureProvider>
      <Page></Page>
    </OpenFeatureProvider>
  );
}
```

#### Evaluation hooks

Within the provider, you can use the various evaluation hooks to evaluate flags. 

```tsx
function Page() {
  // Use the "query-style" flag evaluation hook, specifying a flag-key and a default value.
  const { value: showNewMessage } = useFlag('new-message', true);
  return (
    <div className="App">
      <header className="App-header">
        {showNewMessage ? <p>Welcome to this OpenFeature-enabled React app!</p> : <p>Welcome to this React app.</p>}
      </header>
    </div>
  )
}
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

#### Multiple Providers and Domains

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

#### Re-rendering with Context Changes

By default, if the OpenFeature [evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context) is modified, components will be re-rendered.
This is useful in cases where flag values are dependant on user-attributes or other application state (user logged in, items in card, etc).
You can disable this feature in the hook options (or in the [OpenFeatureProvider](#openfeatureprovider-context-provider)):

```tsx
function Page() {
  const showNewMessage = useBooleanFlagValue('new-message', false, { updateOnContextChanged: false });
  return (
    <MyComponents></MyComponents>
  )
}
```

For more information about how evaluation context works in the React SDK, see the documentation on OpenFeature's [static context SDK paradigm](https://openfeature.dev/specification/glossary/#static-context-paradigm).

#### Re-rendering with Flag Configuration Changes

By default, if the underlying provider emits a `ConfigurationChanged` event, components will be re-rendered.
This is useful if you want your UI to immediately reflect changes in the backend flag configuration.
You can disable this feature in the hook options (or in the [OpenFeatureProvider](#openfeatureprovider-context-provider)):

```tsx
function Page() {
  const showNewMessage = useBooleanFlagValue('new-message', false, { updateOnConfigurationChanged: false });
  return (
    <MyComponents></MyComponents>
  )
}
```

Note that if your provider doesn't support updates, this configuration has no impact.

#### Suspense Support

Frequently, providers need to perform some initial startup tasks.
It may be desireable not to display components with feature flags until this is complete, or when the context changes.
Built-in [suspense](https://react.dev/reference/react/Suspense) support makes this easy.

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
  const showNewMessage = useBooleanFlagValue('new-message', false);

  return (
    <>
      {showNewMessage ? (
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

This can be disabled in the hook options (or in the [OpenFeatureProvider](#openfeatureprovider-context-provider)).

## FAQ and troubleshooting

> I get an error that says something like: `A React component suspended while rendering, but no fallback UI was specified.`

The OpenFeature React SDK features built-in [suspense support](#suspense-support).
This means that it will render your loading fallback automatically while the your provider starts up, and during context reconciliation for any of your components using feature flags!
However, you will see this error if you neglect to create a suspense boundary around any components using feature flags; add a suspense boundary to resolve this issue.
Alternatively, you can disable this feature by setting `suspendWhileReconciling=false` and `suspendUntilReady=false` in the [evaluation hooks](#evaluation-hooks) or the [OpenFeatureProvider](#openfeatureprovider-context-provider) (which applies to all evaluation hooks in child components).

> I get odd rendering issues, or errors when components mount, if I use the suspense features.

In React 16/17's "Legacy Suspense", when a component suspends, its sibling components initially mount and then are hidden.
This can cause surprising effects and inconsistencies if sibling components are rendered while the provider is still getting ready.
To fix this, you can upgrade to React 18, which uses "Concurrent Suspense", in which siblings are not mounted until their suspended sibling resolves.
Alternatively, if you cannot upgrade to React 18, you can use the `useWhenProviderReady` utility hook in any sibling components to prevent them from mounting until the provider is ready.

> I am using multiple `OpenFeatureProvider` contexts, but they are sharing the same provider or evaluation context. Why?

The `OpenFeatureProvider` binds a `client` to all child components, but the provider and context associated with that client is controlled by the `domain` parameter.
This is consistent with all OpenFeature SDKs.
To scope an OpenFeatureProvider to a particular provider/context set the `domain` parameter on your `OpenFeatureProvider`:

```tsx
<OpenFeatureProvider domain={'my-domain'}>
  <Page></Page>
</OpenFeatureProvider>
```

> I can import things form the `@openfeature/react-sdk`, `@openfeature/web-sdk`, and `@openfeature/core`; which should I use?

The `@openfeature/react-sdk` re-exports everything from its peers (`@openfeature/web-sdk` and `@openfeature/core`), and adds the React-specific features.
You can import everything from the `@openfeature/react-sdk` directly.
Avoid importing anything from `@openfeature/web-sdk` or `@openfeature/core`.

## Resources

 - [Example repo](https://github.com/open-feature/react-test-app)
