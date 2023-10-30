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
  <a href="https://github.com/open-feature/spec/tree/v0.7.0">
    <img alt="Specification" src="https://img.shields.io/static/v1?label=specification&message=v0.7.0&color=yellow&style=for-the-badge" />
  </a>
  <!-- x-release-please-start-version -->
  <a href="https://github.com/open-feature/js-sdk/releases/tag/server-sdk-v1.7.0">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v1.7.0&color=blue&style=for-the-badge" />
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

## 🚀 Quick start

### Requirements

- Node.js version 16+

### Install

#### npm

```sh
npm install --save @openfeature/server-sdk
```

#### yarn

```sh
yarn add @openfeature/server-sdk
```

### Usage

```ts
import { OpenFeature } from '@openfeature/server-sdk';

// Register your feature flag provider
OpenFeature.setProvider(new YourProviderOfChoice());

// create a new client
const client = OpenFeature.getClient();

// Evaluate your feature flag
const v2Enabled = await client.getBooleanValue('v2_enabled', false);

if (v2Enabled) {
  console.log("v2 is enabled");
}
```

### API Reference

See [here](https://open-feature.github.io/js-sdk/modules/OpenFeature_JS_SDK.html) for the complete API documentation.

## 🌟 Features

| Status | Features                        | Description                                                                                                                        |
| ------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| ✅      | [Providers](#providers)         | Integrate with a commercial, open source, or in-house feature management tool.                                                     |
| ✅      | [Targeting](#targeting)         | Contextually-aware flag evaluation using [evaluation context](https://openfeature.dev/docs/reference/concepts/evaluation-context). |
| ✅      | [Hooks](#hooks)                 | Add functionality to various stages of the flag evaluation life-cycle.                                                             |
| ✅      | [Logging](#logging)             | Integrate with popular logging packages.                                                                                           |
| ✅      | [Named clients](#named-clients) | Utilize multiple providers in a single application.                                                                                |
| ✅      | [Eventing](#eventing)           | React to state changes in the provider or flag management system.                                                                  |
| ✅      | [Shutdown](#shutdown)           | Gracefully clean up a provider during application shutdown.                                                                        |
| ✅      | [Extending](#extending)         | Extend OpenFeature with custom providers and hooks.                                                                                |

<sub>Implemented: ✅ | In-progress: ⚠️ | Not implemented yet: ❌</sub>

### Providers

[Providers](https://openfeature.dev/docs/reference/concepts/provider) are an abstraction between a flag management system and the OpenFeature SDK.
Look [here](https://openfeature.dev/ecosystem/?instant_search%5BrefinementList%5D%5Btype%5D%5B0%5D=Provider&instant_search%5BrefinementList%5D%5Bcategory%5D%5B0%5D=Server-side&instant_search%5BrefinementList%5D%5Btechnology%5D%5B0%5D=JavaScript) for a complete list of available providers.
If the provider you're looking for hasn't been created yet, see the [develop a provider](#develop-a-provider) section to learn how to build it yourself.

Once you've added a provider as a dependency, it can be registered with OpenFeature like this:

```ts
OpenFeature.setProvider(new MyProvider())
```

In some situations, it may be beneficial to register multiple providers in the same application.
This is possible using [named clients](#named-clients), which is covered in more details below.

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

### Hooks

[Hooks](https://openfeature.dev/docs/reference/concepts/hooks) allow for custom logic to be added at well-defined points of the flag evaluation life-cycle
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

The JS SDK will log warning and errors to the console by default.
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

### Named clients

Clients can be given a name.
A name is a logical identifier which can be used to associate clients with a particular provider.
If a name has no associated provider, the global provider is used.

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
// Registering a named provider
OpenFeature.setProvider("otherClient", new InMemoryProvider(someOtherFlags));

// A Client backed by default provider
const clientWithDefault = OpenFeature.getClient();
// A Client backed by NewCachedProvider
const clientForCache = OpenFeature.getClient("otherClient");
```

### Eventing

Events allow you to react to state changes in the provider or underlying flag management system, such as flag definition changes, provider readiness, or error conditions.
Initialization events (`PROVIDER_READY` on success, `PROVIDER_ERROR` on failure) are dispatched for every provider.
Some providers support additional events, such as `PROVIDER_CONFIGURATION_CHANGED`.

Please refer to the documentation of the provider you're using to see what events are supported.

```ts
import { OpenFeature, ProviderEvents } from '@openfeature/server-sdk';

// OpenFeature API
OpenFeature.addHandler(ProviderEvents.Ready, (eventDetails) => {
  console.log(`Ready event from: ${eventDetails?.clientName}:`, eventDetails);
});

// Specific client
const client = OpenFeature.getClient();
client.addHandler(ProviderEvents.Error, (eventDetails) => {
  console.log(`Error event from: ${eventDetails?.clientName}:`, eventDetails);
});
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
import { JsonValue, Provider, ResolutionDetails } from '@openfeature/server-sdk';

// implement the provider interface
class MyProvider implements Provider {

  readonly metadata = {
    name: 'My Provider',
  } as const;

  // Optional provider managed hooks
  hooks?: Hook<FlagValue>[];

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

  status?: ProviderStatus | undefined;
  events?: OpenFeatureEventEmitter | undefined;

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
    // code that runs when there's an error during a flag evaluation
  }
}
```

> Built a new hook? [Let us know](https://github.com/open-feature/openfeature.dev/issues/new?assignees=&labels=hook&projects=&template=document-hook.yaml&title=%5BHook%5D%3A+) so we can add it to the docs!
