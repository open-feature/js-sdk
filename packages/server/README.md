<!-- markdownlint-disable MD033 -->
<!-- x-hide-in-docs-start -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature Node.js SDK</h2>

<!-- x-hide-in-docs-end -->
<!-- The 'github-badges' class is used in the docs -->
<p align="center" class="github-badges">
  <a href="https://github.com/open-feature/spec/releases/tag/v0.8.0">
    <img alt="Specification" src="https://img.shields.io/static/v1?label=specification&message=v0.8.0&color=yellow&style=for-the-badge" />
  </a>
  <!-- x-release-please-start-version -->
  <a href="https://github.com/open-feature/js-sdk/releases/tag/server-sdk-v1.17.0">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v1.17.0&color=blue&style=for-the-badge" />
  </a>
  <!-- x-release-please-end -->
  <br/>
  <a href="https://open-feature.github.io/js-sdk/modules/_openfeature_server_sdk.html">
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

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool or in-house solution.

<!-- x-hide-in-docs-end -->

## 🚀 Quick start

### Requirements

- Node.js version 18+

### Install

#### npm

```sh
npm install --save @openfeature/server-sdk
```

> [!TIP]
> This SDK is designed to run in Node.JS. If you're interested in browser support, check out the [Web SDK](https://openfeature.dev/docs/reference/technologies/client/web/).

#### yarn

```sh
# yarn requires manual installation of the @openfeature/core peer-dependency
yarn add @openfeature/server-sdk @openfeature/core
```

> [!NOTE]
> `@openfeature/core` contains common components used by all OpenFeature JavaScript implementations.
> Every SDK version has a requirement on a single, specific version of this dependency.
> For more information, and similar implications on libraries developed with OpenFeature see [considerations when extending](#considerations).

### Usage

```ts
import { OpenFeature } from '@openfeature/server-sdk';

// Register your feature flag provider
await OpenFeature.setProviderAndWait(new YourProviderOfChoice());

// create a new client
const client = OpenFeature.getClient();

// Evaluate your feature flag
const v2Enabled = await client.getBooleanValue('v2_enabled', false);

if (v2Enabled) {
  console.log("v2 is enabled");
}
```

### API Reference

See [here](https://open-feature.github.io/js-sdk/modules/_openfeature_server_sdk.html) for the complete API documentation.

## 🌟 Features

| Status | Features                                                            | Description                                                                                                                           |
| ------ | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| ✅      | [Providers](#providers)                                             | Integrate with a commercial, open source, or in-house feature management tool.                                                        |
| ✅      | [Targeting](#targeting)                                             | Contextually-aware flag evaluation using [evaluation context](/docs/reference/concepts/evaluation-context).                           |
| ✅      | [Hooks](#hooks)                                                     | Add functionality to various stages of the flag evaluation life-cycle.                                                                |
| ✅      | [Logging](#logging)                                                 | Integrate with popular logging packages.                                                                                              |
| ✅      | [Domains](#domains)                                                 | Logically bind clients with providers.                                                                                                |
| ✅      | [Eventing](#eventing)                                               | React to state changes in the provider or flag management system.                                                                     |
| ✅      | [Transaction Context Propagation](#transaction-context-propagation) | Set a specific [evaluation context](/docs/reference/concepts/evaluation-context) for a transaction (e.g. an HTTP request or a thread) |
| ✅      | [Tracking](#tracking)                                               | Associate user actions with feature flag evaluations, particularly for A/B testing.                                                   |
| ✅      | [Shutdown](#shutdown)                                               | Gracefully clean up a provider during application shutdown.                                                                           |
| ✅      | [Extending](#extending)                                             | Extend OpenFeature with custom providers and hooks.                                                                                   |

<sub>Implemented: ✅ | In-progress: ⚠️ | Not implemented yet: ❌</sub>

### Providers

[Providers](https://openfeature.dev/docs/reference/concepts/provider) are an abstraction between a flag management system and the OpenFeature SDK.
Look [here](https://openfeature.dev/ecosystem/?instant_search%5BrefinementList%5D%5Btype%5D%5B0%5D=Provider&instant_search%5BrefinementList%5D%5Bcategory%5D%5B0%5D=Server-side&instant_search%5BrefinementList%5D%5Btechnology%5D%5B0%5D=JavaScript) for a complete list of available providers.
If the provider you're looking for hasn't been created yet, see the [develop a provider](#develop-a-provider) section to learn how to build it yourself.

Once you've added a provider as a dependency, it can be registered with OpenFeature like this:

#### Awaitable

To register a provider and ensure it is ready before further actions are taken, you can use the `setProviderAndWait` method as shown below:

```ts
await OpenFeature.setProviderAndWait(new MyProvider());
```

#### Synchronous

To register a provider in a synchronous manner, you can use the `setProvider` method as shown below:

```ts
OpenFeature.setProvider(new MyProvider());
```

Once the provider has been registered, the status can be tracked using [events](#eventing).

In some situations, it may be beneficial to register multiple providers in the same application.
This is possible using [domains](#domains), which is covered in more details below.

### Targeting

Sometimes, the value of a flag must consider some dynamic criteria about the application or user, such as the user's location, IP, email address, or the server's location.
In OpenFeature, we refer to this as [targeting](https://openfeature.dev/specification/glossary#targeting).
If the flag management system you're using supports targeting, you can provide the input data using the [evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context).

```ts
// set a value to the global context
OpenFeature.setContext({ region: "us-east-1" });

// set a value to the client context
const client = OpenFeature.getClient();
client.setContext({ version: process.env.APP_VERSION });

// set a value to the invocation context
const requestContext = {
  targetingKey: req.session.id,
  email: req.session.email,
  product: req.productId
};

const boolValue = await client.getBooleanValue('some-flag', false, requestContext);
```

Context is merged by the SDK before a flag evaluation occurs.
The merge order is defined [here](https://openfeature.dev/specification/sections/evaluation-context#requirement-323) in the OpenFeature specification.

### Hooks

[Hooks](https://openfeature.dev/docs/reference/concepts/hooks) allow for custom logic to be added at well-defined points of the flag evaluation life-cycle.
Look [here](https://openfeature.dev/ecosystem/?instant_search%5BrefinementList%5D%5Btype%5D%5B0%5D=Hook&instant_search%5BrefinementList%5D%5Bcategory%5D%5B0%5D=Server-side&instant_search%5BrefinementList%5D%5Btechnology%5D%5B0%5D=JavaScript) for a complete list of available hooks.
If the hook you're looking for hasn't been created yet, see the [develop a hook](#develop-a-hook) section to learn how to build it yourself.

Once you've added a hook as a dependency, it can be registered at the global, client, or flag invocation level.

```ts
import { OpenFeature } from "@openfeature/server-sdk";

// add a hook globally, to run on all evaluations
OpenFeature.addHooks(new ExampleGlobalHook());

// add a hook on this client, to run on all evaluations made by this client
const client = OpenFeature.getClient();
client.addHooks(new ExampleClientHook());

// add a hook for this evaluation only
const boolValue = await client.getBooleanValue("bool-flag", false, { hooks: [new ExampleHook()]});
```

### Logging

The Node.JS SDK will log warnings and errors to the console by default.
This behavior can be overridden by passing a custom logger either globally or per client.
A custom logger must implement the [Logger interface](../shared/src/logger/logger.ts).

```ts
import type { Logger } from "@openfeature/server-sdk";

// The logger can be anything that conforms with the Logger interface
const logger: Logger = console;

// Sets a global logger
OpenFeature.setLogger(logger);

// Sets a client logger
const client = OpenFeature.getClient();
client.setLogger(logger);
```

### Domains

Clients can be assigned to a domain.
A domain is a logical identifier which can be used to associate clients with a particular provider.
If a domain has no associated provider, the default provider is used.

```ts
import { OpenFeature, InMemoryProvider } from "@openfeature/server-sdk";

const myFlags = {
  'v2_enabled': {
    variants: {
      on: true,
      off: false
    },
    disabled: false,
    defaultVariant: "on"
  }
};

// Registering the default provider
OpenFeature.setProvider(InMemoryProvider(myFlags));
// Registering a provider to a domain
OpenFeature.setProvider("my-domain", new InMemoryProvider(someOtherFlags));

// A Client bound to the default provider
const clientWithDefault = OpenFeature.getClient();
// A Client bound to the InMemoryProvider provider
const domainScopedClient = OpenFeature.getClient("my-domain");
```

Domains can be defined on a provider during registration.
For more details, please refer to the [providers](#providers) section.

### Eventing

Events allow you to react to state changes in the provider or underlying flag management system, such as flag definition changes, provider readiness, or error conditions.
Initialization events (`PROVIDER_READY` on success, `PROVIDER_ERROR` on failure) are dispatched for every provider.
Some providers support additional events, such as `PROVIDER_CONFIGURATION_CHANGED`.

Please refer to the documentation of the provider you're using to see what events are supported.

```ts
import { OpenFeature, ProviderEvents } from '@openfeature/server-sdk';

// OpenFeature API
OpenFeature.addHandler(ProviderEvents.Ready, (eventDetails) => {
  console.log(`Ready event from: ${eventDetails?.providerName}:`, eventDetails);
});

// Specific client
const client = OpenFeature.getClient();
client.addHandler(ProviderEvents.Error, (eventDetails) => {
  console.log(`Error event from: ${eventDetails?.providerName}:`, eventDetails);
});
```

### Transaction Context Propagation

Transaction context is a container for transaction-specific evaluation context (e.g. user id, user agent, IP).
Transaction context can be set where specific data is available (e.g. an auth service or request handler) and by using the transaction context propagator it will automatically be applied to all flag evaluations within a transaction (e.g. a request or thread).

The following example shows an Express middleware using transaction context propagation to propagate the request ip and user id into request scoped transaction context.

```ts
import express, { Request, Response, NextFunction } from "express";
import { OpenFeature, AsyncLocalStorageTransactionContextPropagator } from '@openfeature/server-sdk';

OpenFeature.setTransactionContextPropagator(new AsyncLocalStorageTransactionContextPropagator())

/**
 * This example is based on an express middleware.
 */
const app = express();
app.use((req: Request, res: Response, next: NextFunction) => {
  const ip = res.headers.get("X-Forwarded-For")
  OpenFeature.setTransactionContext({ targetingKey: req.user.id, ipAddress: ip }, () => {
    // The transaction context is used in any flag evaluation throughout the whole call chain of next
    next();
  });
})
```

### Tracking

The tracking API allows you to use OpenFeature abstractions and objects to associate user actions with feature flag evaluations.
This is essential for robust experimentation powered by feature flags.
For example, a flag enhancing the appearance of a UI component might drive user engagement to a new feature; to test this hypothesis, telemetry collected by a [hook](#hooks) or [provider](#providers) can be associated with telemetry reported in the client's `track` function.

```ts
// flag is evaluated
await client.getBooleanValue('new-feature', false);

// new feature is used and track function is called recording the usage
useNewFeature();
client.track('new-feature-used');
```

### Shutdown

The OpenFeature API provides a close function to perform a cleanup of all registered providers.
This should only be called when your application is in the process of shutting down.

```ts
import { OpenFeature } from '@openfeature/server-sdk';

await OpenFeature.close()
```

## Extending

### Develop a provider

To develop a provider, you need to create a new project and include the OpenFeature SDK as a dependency.
This can be a new repository or included in [the existing contrib repository](https://github.com/open-feature/js-sdk-contrib) available under the OpenFeature organization.
You’ll then need to write the provider by implementing the [Provider interface](./src/provider/provider.ts) exported by the OpenFeature SDK.

```ts
import {
  AnyProviderEvent,
  EvaluationContext,
  Hook,
  JsonValue,
  Logger,
  Provider,
  ProviderEventEmitter,
  ResolutionDetails
} from '@openfeature/server-sdk';

// implement the provider interface
class MyProvider implements Provider {
  // Adds runtime validation that the provider is used with the expected SDK
  public readonly runsOn = 'server';
  readonly metadata = {
    name: 'My Provider',
  } as const;
  // Optional provider managed hooks
  hooks?: Hook[];
  resolveBooleanEvaluation(flagKey: string, defaultValue: boolean, context: EvaluationContext, logger: Logger): Promise<ResolutionDetails<boolean>> {
    // code to evaluate a boolean
  }
  resolveStringEvaluation(flagKey: string, defaultValue: string, context: EvaluationContext, logger: Logger): Promise<ResolutionDetails<string>> {
    // code to evaluate a string
  }
  resolveNumberEvaluation(flagKey: string, defaultValue: number, context: EvaluationContext, logger: Logger): Promise<ResolutionDetails<number>> {
    // code to evaluate a number
  }
  resolveObjectEvaluation<T extends JsonValue>(flagKey: string, defaultValue: T, context: EvaluationContext, logger: Logger): Promise<ResolutionDetails<T>> {
    // code to evaluate an object
  }

  // implement with "new OpenFeatureEventEmitter()", and use "emit()" to emit events
  events?: ProviderEventEmitter<AnyProviderEvent> | undefined;

  initialize?(context?: EvaluationContext | undefined): Promise<void> {
    // code to initialize your provider
  }
  onClose?(): Promise<void> {
    // code to shut down your provider
  }
}
```

> Built a new provider? [Let us know](https://github.com/open-feature/openfeature.dev/issues/new?assignees=&labels=provider&projects=&template=document-provider.yaml&title=%5BProvider%5D%3A+) so we can add it to the docs!

### Develop a hook

To develop a hook, you need to create a new project and include the OpenFeature SDK as a dependency.
This can be a new repository or included in [the existing contrib repository](https://github.com/open-feature/js-sdk-contrib) available under the OpenFeature organization.
Implement your own hook by conforming to the [Hook interface](../shared/src/hooks/hook.ts).

```ts
import type { Hook, HookContext, EvaluationDetails, FlagValue } from "@openfeature/server-sdk";

export class MyHook implements Hook {
  after(hookContext: HookContext, evaluationDetails: EvaluationDetails<FlagValue>) {
    // code that runs after flag values are successfully resolved from the provider
  }
}
```

> Built a new hook? [Let us know](https://github.com/open-feature/openfeature.dev/issues/new?assignees=&labels=hook&projects=&template=document-hook.yaml&title=%5BHook%5D%3A+) so we can add it to the docs!

### Considerations

When developing a library based on OpenFeature components, it's important to list the `@openfeature/server-sdk` as a `peerDependency` of your package.
This is a general best-practice when developing JavaScript libraries that have dependencies in common with their consuming application.
Failing to do this can result in multiple copies of the OpenFeature SDK in the consumer, which can lead to type errors, and broken singleton behavior.
The `@openfeature/core` package itself follows this pattern: the `@openfeature/server-sdk` has a peer dependency on `@openfeature/core`, and uses whatever copy of that module the consumer has installed (note that NPM installs peers automatically unless `--legacy-peer-deps` is set, while yarn does not, and PNPM does so based on its configuration).
When developing such libraries, it's NOT necessary to add a `peerDependency` on `@openfeature/core`, since the `@openfeature/server-sdk` establishes that dependency itself transitively.
