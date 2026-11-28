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
It provides an app plugin, a scoped provider component, reactive composables, a declarative feature flag component, and testing utilities.
The package also re-exports `@openfeature/web-sdk`.

## Requirements

- Vue 3.3 or later
- An ES2015-compatible web browser
- `@openfeature/core`
- `@openfeature/web-sdk`

Vue 2, Nuxt, and server-side rendering are not supported.

## Install

```sh
npm install @openfeature/vue-sdk @openfeature/core @openfeature/web-sdk vue
```

## Setup

### App plugin

Install `OpenFeaturePlugin` to make OpenFeature available throughout the application.

```ts
import { createApp } from 'vue';
import { InMemoryProvider, OpenFeaturePlugin } from '@openfeature/vue-sdk';
import App from './App.vue';

const provider = new InMemoryProvider({
  'new-feature': {
    disabled: false,
    variants: { on: true, off: false },
    defaultVariant: 'on',
  },
});

createApp(App).use(OpenFeaturePlugin, { provider }).mount('#app');
```

The plugin accepts either `provider` or an existing `client`.
Use `domain` to scope the client to a named provider domain, and `context` to set the initial evaluation context when supplying a provider.

```ts
createApp(App).use(OpenFeaturePlugin, {
  domain: 'my-app',
  provider,
  context: { user: 'alice' },
});
```

If the provider is already configured, install the plugin without a provider.

```ts
OpenFeature.setProvider(provider);
createApp(App).use(OpenFeaturePlugin).mount('#app');
```

The plugin also registers `OpenFeatureProvider` and `FeatureFlag` as global components.

### Scoped provider component

Use `<OpenFeatureProvider>` to scope clients and evaluation options to a component subtree.

```vue
<script setup lang="ts">
import { OpenFeatureProvider } from '@openfeature/vue-sdk';
</script>

<template>
  <OpenFeatureProvider domain="my-app">
    <Page />
  </OpenFeatureProvider>
</template>
```

Pass `client` instead of `domain` when you already have an OpenFeature client.
The closest provider in the component tree wins.

## Composables

Call composables synchronously during component `setup()`.

| Composable                   | Return value                                 |
| ---------------------------- | -------------------------------------------- |
| `useFlag`                    | Reactive, awaitable query object             |
| `useBooleanFlagValue`        | `AwaitableRef<boolean>`                      |
| `useBooleanFlagDetails`      | `AwaitableRef<EvaluationDetails<boolean>>`   |
| `useStringFlagValue`         | `AwaitableRef<string>`                       |
| `useStringFlagDetails`       | `AwaitableRef<EvaluationDetails<string>>`    |
| `useNumberFlagValue`         | `AwaitableRef<number>`                       |
| `useNumberFlagDetails`       | `AwaitableRef<EvaluationDetails<number>>`    |
| `useObjectFlagValue`         | `AwaitableRef<JsonValue>`                    |
| `useObjectFlagDetails`       | `AwaitableRef<EvaluationDetails<JsonValue>>` |
| `useOpenFeatureClient`       | Framework-aware OpenFeature client           |
| `useOpenFeatureProvider`     | Provider bound to the current client         |
| `useOpenFeatureClientStatus` | `Ref<ProviderStatus>`                        |
| `useWhenProviderReady`       | `AwaitableRef<boolean>`                      |
| `useContextMutator`          | Domain-aware `setContext` function           |
| `useTrack`                   | Domain-aware tracking function               |

### Values and details

Value composables return refs.
Templates unwrap top-level refs automatically, while script code uses `.value`.

```vue
<script setup lang="ts">
import { useBooleanFlagValue, useStringFlagDetails } from '@openfeature/vue-sdk';

const enabled = useBooleanFlagValue('new-feature', false);
const theme = useStringFlagDetails('theme', 'light');
</script>

<template>
  <div v-if="enabled">New feature</div>
  <div>{{ theme.value }}: {{ theme.reason }}</div>
</template>
```

`useFlag` returns a reactive query object with `value`, `details`, `variant`, `reason`, `flagMetadata`, `isError`, `errorCode`, `errorMessage`, `isAuthoritative`, and `type` properties.

```ts
const flag = useFlag('theme', 'light');
console.log(flag.value, flag.reason, flag.isAuthoritative);
```

### Reactive inputs

Flag keys, default values, and evaluation options accept values, refs, or getters.

```ts
import { computed, ref } from 'vue';

const variant = ref('control');
const flagKey = computed(() => `banner-${variant.value}`);
const enabled = useFlag(flagKey, false);
```

Changing a reactive input re-evaluates the flag.

### Awaiting provider readiness

Evaluation composables return their current value immediately and are also thenable.
Awaiting one waits until the provider is ready, reconciling has finished, or the provider reaches an error state.

```ts
const theme = useStringFlagValue('theme', 'light');
const value = await theme;
```

To keep the reactive ref, await it on a separate line.

```ts
const theme = useStringFlagValue('theme', 'light');
await theme;
```

Provider failures resolve instead of rejecting.
Value composables resolve to the default value, and details composables resolve to default evaluation details containing the error code and message.

Because the return values are thenable, returning one directly from an `async` function or passing it to `Promise.resolve` waits for it implicitly.
An async `setup()` that returns the ref directly therefore resolves to the raw value and loses the ref.
Use `await theme` and then return an object containing the ref.

### Suspense

Top-level `await` in `<script setup>` makes the component an async dependency for Vue `<Suspense>`.

```vue
<script setup lang="ts">
import { useStringFlagValue } from '@openfeature/vue-sdk';

const theme = useStringFlagValue('theme', 'light');
await theme;
</script>

<template>
  <div>{{ theme }}</div>
</template>
```

```vue
<Suspense>
  <Page />
  <template #fallback>Loading feature flags...</template>
</Suspense>
```

Vue Suspense waits during the initial async setup only.
Use `useOpenFeatureClientStatus()` to react to later `RECONCILING` states.

### Provider events

By default, evaluations update on `Ready`, `ContextChanged`, `ConfigurationChanged`, `Error`, and `Stale` events.
Configuration changes re-evaluate the current flag.
When `flagsChanged` is provided, only matching flags are re-evaluated.
When it is omitted, all flags may update.

Disable updates per evaluation or through the provider.

```ts
useStringFlagValue('theme', 'light', {
  updateOnConfigurationChanged: false,
  updateOnContextChanged: false,
});
```

Event handlers are removed when the component scope is disposed.

### Context and tracking

```ts
import { useContextMutator, useTrack } from '@openfeature/vue-sdk';

const { setContext } = useContextMutator();
await setContext({ user: 'bob' });

const { track } = useTrack();
track('purchase', { value: 10 });
```

Use `useContextMutator({ defaultContext: true })` to mutate the global context instead of the provider domain context.

## Declarative component

`FeatureFlag` renders its default slot when the flag matches and its fallback slot otherwise.

```vue
<FeatureFlag flag-key="theme" default-value="light" match-value="dark">
  <DarkTheme />
  <template #fallback>
    <LightTheme />
  </template>
</FeatureFlag>
```

Boolean flags do not require `matchValue`.
Without it, the default slot renders when the value is truthy.
Non-boolean flags require `matchValue` to render the default slot.

Both slots are scoped.
The default slot receives the flag query, and the fallback slot receives evaluation details.

```vue
<FeatureFlag flag-key="theme" default-value="light" match-value="dark">
  <template #default="{ value }">
    <DarkTheme :theme="value" />
  </template>
  <template #fallback="{ reason }">
    <LightTheme :reason="reason" />
  </template>
</FeatureFlag>
```

Errors always render the fallback slot.
Use `predicate` for custom matching logic.

## Testing

### Test provider component

Wrap a component with `OpenFeatureTestProvider` when using `@vue/test-utils`.

```ts
import { mount } from '@vue/test-utils';
import { OpenFeatureTestProvider } from '@openfeature/vue-sdk';
import MyComponent from './MyComponent.vue';

const wrapper = mount({
  components: { OpenFeatureTestProvider, MyComponent },
  template: `
    <OpenFeatureTestProvider :flag-value-map="{ 'new-feature': true }">
      <MyComponent />
    </OpenFeatureTestProvider>
  `,
});
```

`flagValueMap` maps flag keys directly to values.
Use `delayMs` to delay provider initialization and context reconciliation, or pass a partial `provider` for custom resolution behavior.

### Test plugin

```ts
import { createOpenFeatureTestPlugin } from '@openfeature/vue-sdk';

const wrapper = mount(MyComponent, {
  global: {
    plugins: [
      createOpenFeatureTestPlugin({
        flagValueMap: {
          'new-feature': true,
          theme: 'dark',
        },
      }),
    ],
  },
});
```

## Differences from the React SDK

- There is no `useSuspenseFlag` and no `suspend*` option.
  Use `await useFlag(...)` or another awaited evaluation composable.
- There is no `suspendWhileReconciling` equivalent.
  Use `useOpenFeatureClientStatus()` to detect `RECONCILING`.
- Evaluation results are refs or reactive query objects rather than plain values.
- Awaiting an evaluation returns its raw value or details, not the ref.

## Resources

- [OpenFeature documentation](https://openfeature.dev/docs/)
- [JavaScript SDK repository](https://github.com/open-feature/js-sdk)
- [Vue provide and inject](https://vuejs.org/guide/components/provide-inject.html)
- [Vue composables](https://vuejs.org/guide/reusability/composables.html)
- [Vue Suspense](https://vuejs.org/guide/built-ins/suspense.html)
- [Vue Test Utils](https://test-utils.vuejs.org/guide/)
