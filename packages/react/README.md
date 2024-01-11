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
  <br/>
  <a href="https://codecov.io/gh/open-feature/js-sdk">
    <img alt="codecov" src="https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY" />
  </a>
</p>
<!-- x-hide-in-docs-start -->

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool.

🧪 This SDK is experimental.

## Basic Usage

Here's a basic example of how to use the current API with the in-memory provider:

```tsx
import logo from './logo.svg';
import './App.css';
import { OpenFeatureProvider, useFeatureFlag, OpenFeature } from '@openfeature/react-sdk';
import { FlagdWebProvider } from '@openfeature/flagd-web-provider';

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

OpenFeature.setProvider(new InMemoryProvider(flagConfig));

function App() {
  return (
    <OpenFeatureProvider>
      <Page></Page>
    </OpenFeatureProvider>
  );
}

function Page() {
  const booleanFlag = useFeatureFlag('new-message', false);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {booleanFlag.value ? <p>Welcome to this OpenFeature-enabled React app!</p> : <p>Welcome to this React app.</p>}
      </header>
    </div>
  )
}

export default App;
```

### Multiple Providers and Scoping

Multiple providers and scoped clients can be configured by passing a `clientName` to the `OpenFeatureProvider`:

```tsx
// Flags within this scope will use the a client/provider associated with `myClient`,
function App() {
  return (
    <OpenFeatureProvider clientName={'myClient'}>
      <Page></Page>
    </OpenFeatureProvider>
  );
}
```

This is analogous to:

```ts
OpenFeature.getClient('myClient');
```

### Re-rendering with Context Changes

By default, if the OpenFeature [evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context) is modified, components will be re-rendered.
This is useful in cases where flag values are dependant on user-attributes or other application state (user logged in, items in card, etc).
You can disable this feature in the `useFeatureFlag` hook options:

```tsx
function Page() {
  const booleanFlag = useFeatureFlag('new-message', false, { updateOnContextChanged: false });
  return (
    <MyComponents></MyComponents>
  )
}
```

For more information about how evaluation context works in the React SDK, see the documentation on OpenFeature's [static context SDK paradigm](https://openfeature.dev/specification/glossary/#static-context-paradigm).

### Re-rendering with Flag Configuration Changes

By default, if the underlying provider emits a `ConfigurationChanged` event, components will be re-rendered.
This is useful if you want your UI to immediately reflect changes in the backend flag configuration.
You can disable this feature in the `useFeatureFlag` hook options:

```tsx
function Page() {
  const booleanFlag = useFeatureFlag('new-message', false, { updateOnConfigurationChanged: false });
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
  const { value: showNewMessage } = useFeatureFlag('new-message', false);

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