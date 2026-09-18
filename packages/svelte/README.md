<!-- markdownlint-disable MD033 -->
<!-- x-hide-in-docs-start -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature Svelte SDK</h2>

<!-- x-hide-in-docs-end -->
<!-- The 'github-badges' class is used in the docs -->
<p align="center" class="github-badges">
  <a href="https://github.com/open-feature/spec/releases/tag/v0.8.0">
    <img alt="Specification" src="https://img.shields.io/static/v1?label=specification&message=v0.8.0&color=yellow&style=for-the-badge" />
  </a>
  <!-- x-release-please-start-version -->
  <a href="https://github.com/open-feature/js-sdk/releases/tag/svelte-sdk-v0.0.0">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v0.0.0&color=blue&style=for-the-badge" />
  </a>
  <!-- x-release-please-end -->
  <br/>
  <a href="https://codecov.io/gh/open-feature/js-sdk">
    <img alt="codecov" src="https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY" />
  </a>
  <a href="https://www.npmjs.com/package/@openfeature/svelte-sdk">
    <img alt="NPM Download" src="https://img.shields.io/npm/dm/%40openfeature%2Fsvelte-sdk" />
  </a>
</p>
<!-- x-hide-in-docs-start -->

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool or in-house solution.

<!-- x-hide-in-docs-end -->

## Overview

The OpenFeature Svelte SDK adds Svelte-specific functionality to the [OpenFeature Web SDK](https://openfeature.dev/docs/reference/technologies/client/web).

In addition to the feature provided by the [web sdk](https://openfeature.dev/docs/reference/technologies/client/web), capabilities include:

- [Overview](#overview)
- [Quick start](#quick-start)
  - [Requirements](#requirements)
  - [Install](#install)
    - [npm](#npm)
    - [yarn](#yarn)
    - [Required peer dependencies](#required-peer-dependencies)
  - [Usage](#usage)
    - [Scope](#scope)
    - [Evaluation functions](#evaluation-functions)
    - [Reactivity](#reactivity)
    - [Multiple Providers and Domains](#multiple-providers-and-domains)
    - [Updating with Context Changes](#updating-with-context-changes)
    - [Updating with Flag Configuration Changes](#updating-with-flag-configuration-changes)
    - [Provider Readiness and Status](#provider-readiness-and-status)
    - [Tracking](#tracking)
    - [Observability Considerations](#observability-considerations)
    - [Type-Safe Flag Keys](#type-safe-flag-keys)
  - [Testing](#testing)
- [FAQ and troubleshooting](#faq-and-troubleshooting)
- [Resources](#resources)

## Quick start

### Requirements

- ES2015-compatible web browser (Chrome, Edge, Firefox, etc)
- Svelte version 5.7+

### Install

#### npm

```sh
npm install --save @openfeature/svelte-sdk
```

#### yarn

```sh
# yarn requires manual installation of the peer dependencies (see below)
yarn add @openfeature/svelte-sdk @openfeature/web-sdk @openfeature/core
```

#### Required peer dependencies

The following list contains the peer dependencies of `@openfeature/svelte-sdk`.
See the [package.json](./package.json) for the required versions.

- `@openfeature/web-sdk`
- `svelte`

### Usage

#### Scope

`setOpenFeatureScope` binds an OpenFeature client to a component and all of its descendants using [Svelte context](https://svelte.dev/docs/svelte/context).
It represents a scope for feature flag evaluations within a Svelte application, and is the equivalent of the `<OpenFeatureProvider>` in the React SDK.
Call it during component initialization, typically in the script of your root component or layout.
The example below shows how to use `setOpenFeatureScope` with OpenFeature's `TypedInMemoryProvider`.

```svelte
<!-- App.svelte, or src/routes/+layout.svelte in SvelteKit -->
<script lang="ts">
  import {
    OpenFeature,
    TypedInMemoryProvider,
    setOpenFeatureScope,
    type EvaluationContext,
  } from '@openfeature/svelte-sdk';

  const flagConfig = {
    'new-message': {
      disabled: false,
      variants: {
        on: true,
        off: false,
      },
      defaultVariant: 'on',
      contextEvaluator: (context: EvaluationContext) => {
        if (context.silly) {
          return 'on';
        }
        return 'off';
      },
    },
  } as const;

  // Instantiate and set our provider (be sure this only happens once)!
  // Note: there's no need to await its initialization, the Svelte SDK updates your components for you!
  OpenFeature.setProvider(new TypedInMemoryProvider(flagConfig));

  // Bind a client to this component and its descendants
  setOpenFeatureScope();

  let { children } = $props();
</script>

{@render children()}
```

Setting a scope is optional: components (and modules) without an enclosing scope use the default client.
A scope is useful to bind a [domain](#multiple-providers-and-domains) or to set default [evaluation options](#updating-with-context-changes) for a subtree.

#### Evaluation functions

Within the scope, you can use the various evaluation functions to evaluate flags.
They return objects whose properties are reactive: read them in your template, in `$derived` or in `$effect` and your component updates when the flag value changes.

```svelte
<script lang="ts">
  import { useFlag } from '@openfeature/svelte-sdk';

  // Use the "query-style" flag evaluation function, specifying a flag-key and a default value.
  const newMessage = useFlag('new-message', true);
</script>

<header>
  {#if newMessage.value}
    <p>Welcome to this OpenFeature-enabled Svelte app!</p>
  {:else}
    <p>Welcome to this Svelte app.</p>
  {/if}
</header>
```

You can use the strongly typed flag value and flag evaluation detail functions as well if you prefer.
Because a primitive can't be reactive on its own, the value functions return a `{ current }` box, following the convention of Svelte's own [reactive classes](https://svelte.dev/docs/svelte/svelte-reactivity).

```ts
import { useBooleanFlagValue } from '@openfeature/svelte-sdk';

// boolean flag evaluation
const showNewMessage = useBooleanFlagValue('new-message', false);
// read `showNewMessage.current` in your template
```

```ts
import { useBooleanFlagDetails } from '@openfeature/svelte-sdk';

// "detailed" boolean flag evaluation
const details = useBooleanFlagDetails('new-message', false);
// read `details.value`, `details.variant`, `details.reason`, `details.flagMetadata`, etc.
```

> [!NOTE]
> Don't destructure the returned objects (`const { value } = useFlag(...)`); destructuring copies the value at that moment and loses reactivity.
> Read the properties where you need them instead, or wrap them: `const value = $derived(flag.value)`.

#### Reactivity

The evaluation functions don't use runes internally, so they can be called anywhere: in a component's script, in a `.svelte.ts` module, or at module scope.
They start listening to the provider only while a template, `$derived` or `$effect` depends on them, and stop listening automatically when the last dependency is destroyed, so there's nothing to clean up.
Reads outside of effects (for example in an event handler) are served from the event-driven cache while something is listening, and re-evaluate the flag when nothing is.

```ts
// flags.svelte.ts - a module shared across components
import { useFlag } from '@openfeature/svelte-sdk';

export const newMessage = useFlag('new-message', false);
```

#### Multiple Providers and Domains

Multiple providers can be used by passing a `domain` to `setOpenFeatureScope`:

```svelte
<script lang="ts">
  import { setOpenFeatureScope } from '@openfeature/svelte-sdk';

  // Flags within this domain will use the client/provider associated with `my-domain`,
  setOpenFeatureScope({ domain: 'my-domain' });
</script>
```

This is analogous to:

```ts
OpenFeature.getClient('my-domain');
```

Alternatively, a pre-configured `Client` instance can be passed directly via the `client` option:

```svelte
<script lang="ts">
  import { OpenFeature, setOpenFeatureScope } from '@openfeature/svelte-sdk';

  const client = OpenFeature.getClient('my-domain');
  setOpenFeatureScope({ client });
</script>
```

The `domain` and `client` options are mutually exclusive.

For more information about `domains`, refer to the [web SDK](https://github.com/open-feature/js-sdk/blob/main/packages/web/README.md).

#### Updating with Context Changes

By default, if the OpenFeature [evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context) is modified, flags are re-evaluated and dependent components update.
This is useful in cases where flag values are dependent on user-attributes or other application state (user logged in, items in card, etc).
You can disable this feature in the evaluation options (or in the [scope](#scope), for all evaluations within it):

```svelte
<script lang="ts">
  import { useFlag } from '@openfeature/svelte-sdk';

  const newMessage = useFlag('new-message', false, { updateOnContextChanged: false });
</script>
```

To modify the evaluation context associated with the enclosing scope's domain, use `useContextMutator`:

```svelte
<script lang="ts">
  import { useContextMutator } from '@openfeature/svelte-sdk';

  const { setContext } = useContextMutator();
</script>

<button onclick={() => setContext({ silly: true })}>Be silly</button>
```

For more information about how evaluation context works in the Svelte SDK, see the documentation on OpenFeature's [static context SDK paradigm](https://openfeature.dev/specification/glossary/#static-context-paradigm).

#### Updating with Flag Configuration Changes

By default, if the underlying provider emits a `ConfigurationChanged` event, flags are re-evaluated and dependent components update.
This is useful if you want your UI to immediately reflect changes in the backend flag configuration.
You can disable this feature in the evaluation options (or in the [scope](#scope), for all evaluations within it):

```svelte
<script lang="ts">
  import { useFlag } from '@openfeature/svelte-sdk';

  const newMessage = useFlag('new-message', false, { updateOnConfigurationChanged: false });
</script>
```

If your provider doesn't support updates, this configuration has no impact.

> [!NOTE]
> If your provider includes a list of [flags changed](https://open-feature.github.io/js-sdk/types/_openfeature_server_sdk.ConfigChangeEvent.html) in its `PROVIDER_CONFIGURATION_CHANGED` event, that list of flags is used to decide which flags should be re-evaluated.
> If your provider event does not the include the `flags changed` list, then the SDK re-evaluates all flags.
> In both cases, components only update if the evaluation details actually changed.

#### Provider Readiness and Status

Frequently, providers need to perform some initial startup tasks.
It may be desirable not to display components with feature flags until this is complete.
`useWhenProviderReady` returns a reactive boolean you can use to render a loader until the provider is ready:

```svelte
<script lang="ts">
  import { useWhenProviderReady } from '@openfeature/svelte-sdk';

  const ready = useWhenProviderReady();
</script>

{#if ready.current}
  <Content />
{:else}
  <p>Waiting for provider to be ready...</p>
{/if}
```

`useWhenProviderReady` is a boolean gate: it's `false` both while the provider is `NOT_READY` and after a terminal `ERROR` or `FATAL` state.
To distinguish a provider that is still starting from one that failed to start, use `useOpenFeatureClientStatus` and handle terminal states explicitly:

```svelte
<script lang="ts">
  import { ProviderStatus, useOpenFeatureClientStatus } from '@openfeature/svelte-sdk';

  const status = useOpenFeatureClientStatus();
</script>

{#if status.current === ProviderStatus.NOT_READY}
  <Spinner />
{:else if status.current === ProviderStatus.ERROR || status.current === ProviderStatus.FATAL}
  <!-- Evaluation functions continue with their code defaults. -->
  <Sidebar featureProviderUnavailable />
{:else}
  <Sidebar />
{/if}
```

#### Tracking

The tracking API allows you to use OpenFeature abstractions and objects to associate user actions with feature flag evaluations.
This is essential for robust experimentation powered by feature flags.
For example, a flag enhancing the appearance of a UI component might drive user engagement to a new feature; to test this hypothesis, telemetry collected by a [hook](https://openfeature.dev/docs/reference/technologies/client/web/#hooks) or [provider](https://openfeature.dev/docs/reference/technologies/client/web/#providers) can be associated with telemetry reported in the client's `track` function.

The Svelte SDK includes a function for firing tracking events in the enclosing scope:

```svelte
<script lang="ts">
  import { useTrack } from '@openfeature/svelte-sdk';

  // get a tracking function for the enclosing scope.
  const { track } = useTrack();
</script>

<!-- call the tracking event, for example in an event handler -->
<button onclick={() => track('checkout-clicked', { value: 99.99 })}>Checkout</button>
```

#### Observability Considerations

Flags may be evaluated more than once as a user interacts with a page, for example when the provider becomes ready, or when a flag object is read outside of an effect.
If you are using an OpenFeature hook for telemetry, this can result in inflated evaluation metrics.
The [OpenFeature debounce hook](https://github.com/open-feature/js-sdk-contrib/tree/main/libs/hooks/debounce) can help to reduce the amount of redundant evaluations reported to your observability platform by limiting the frequency at which evaluation metrics are reported.

#### Type-Safe Flag Keys

For enhanced type safety and autocompletion, you can override flag key types using TypeScript module augmentation. See the [`@openfeature/core` README](../shared/README.md#type-safe-flag-keys) for details.

### Testing

The Svelte SDK includes a built-in helper for testing.
This allows you to easily test components that use evaluation functions (such as `useFlag`).
`setOpenFeatureTestScope` configures a test provider and, when called during component initialization, binds it to that component's subtree like `setOpenFeatureScope` does.
It can also be called directly in a test (for example in `beforeEach`), in which case it configures the provider used by components without a scope.

```ts
import { setOpenFeatureTestScope } from '@openfeature/svelte-sdk';
import { render, screen } from '@testing-library/svelte';

// use default values for all evaluations
setOpenFeatureTestScope();
render(MyComponent);
```

The basic configuration above will simply use the default value provided in code.
If you'd like to control the values returned by the evaluation functions, you can pass a map of flag keys and values:

```ts
// return `true` for all evaluations of `'my-boolean-flag'`
setOpenFeatureTestScope({ flagValueMap: { 'my-boolean-flag': true } });
render(MyComponent);
```

Additionally, you can pass an artificial delay for the provider startup to test your loaders/spinners impacted by feature flags:

```ts
// delay the provider start by 1000ms and then return `true` for all evaluations of `'my-boolean-flag'`
setOpenFeatureTestScope({ delayMs: 1000, flagValueMap: { 'my-boolean-flag': true } });
render(MyComponent);
```

For maximum control, you can also pass your own mock provider implementation.
The type of this option is `Partial<Provider>`, so you can pass an incomplete implementation:

```ts
import type { Provider, ResolutionDetails } from '@openfeature/svelte-sdk';

class MyTestProvider implements Partial<Provider> {
  // implement the relevant resolver
  resolveBooleanEvaluation(): ResolutionDetails<boolean> {
    return {
      value: true,
      variant: 'my-variant',
      reason: 'MY_REASON',
    };
  }
}
```

```ts
// use your custom testing provider
setOpenFeatureTestScope({ provider: new MyTestProvider() });
render(MyComponent);
```

To scope the test provider to a subtree instead, call `setOpenFeatureTestScope` in the script of a wrapper component that renders the component under test.

## FAQ and troubleshooting

> Does the Svelte SDK support server-side rendering (SvelteKit SSR)?

The Svelte SDK, like the web SDK it's built on, is designed for client-side evaluation: the `OpenFeature` singleton holds a single evaluation context, which isn't appropriate for a server handling many requests.
On the server, use the [Server SDK](https://openfeature.dev/docs/reference/technologies/server/javascript) in your `load` functions or hooks, and pass the resolved values to your components as data.
Flag objects created during SSR simply return the default value (or whatever the provider resolves) without subscribing to anything.

> Can I use the Svelte SDK with Svelte 4, or with stores?

The reactivity of the Svelte SDK is built on `createSubscriber` from `svelte/reactivity`, which requires Svelte 5.7 or later.
If you prefer stores, you can wrap any reactive property with [`toStore`](https://svelte.dev/docs/svelte/svelte-store#toStore):

```ts
import { toStore } from 'svelte/store';

const newMessage = useFlag('new-message', false);
const newMessageStore = toStore(() => newMessage.value);
```

> I get an error that says something like: `lifecycle_outside_component`.

`setOpenFeatureScope` (and `setOpenFeatureTestScope`, when used to bind a subtree) uses Svelte context, so it must be called during component initialization: at the top level of a component's `<script>`, not in an event handler, effect, or after an `await`.
The evaluation functions themselves don't have this restriction.

> I am using multiple scopes, but they share the same provider or evaluation context. Why?

`setOpenFeatureScope` binds a `client` to a component subtree, but the provider and context associated with that client is controlled by the `domain` parameter.
This is consistent with all OpenFeature SDKs.
To scope a subtree to a particular provider/context, set the `domain` parameter on your scope:

```ts
setOpenFeatureScope({ domain: 'my-domain' });
```

## Resources

- [Example repo](https://github.com/open-feature/js-sdk-examples)
