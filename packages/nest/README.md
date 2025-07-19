<!-- markdownlint-disable MD033 -->
<!-- x-hide-in-docs-start -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature NestJS SDK</h2>

<!-- x-hide-in-docs-end -->
<!-- The 'github-badges' class is used in the docs -->
<p align="center" class="github-badges">
  <a href="https://github.com/open-feature/spec/releases/tag/v0.8.0">
    <img alt="Specification" src="https://img.shields.io/static/v1?label=specification&message=v0.8.0&color=yellow&style=for-the-badge" />
  </a>
  <!-- x-release-please-start-version -->
  <a href="https://github.com/open-feature/js-sdk/releases/tag/nestjs-sdk-v0.2.5">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v0.2.5&color=blue&style=for-the-badge" />
  </a>
  <!-- x-release-please-end -->
  <br/>
  <a href="https://codecov.io/gh/open-feature/js-sdk">
    <img alt="codecov" src="https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY" />
  </a>
  <a href="https://www.npmjs.com/package/@openfeature/nestjs-sdk">
    <img alt="NPM Download" src="https://img.shields.io/npm/dm/%40openfeature%2Fnestjs-sdk" />
  </a>
</p>
<!-- x-hide-in-docs-start -->

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool or in-house solution.

<!-- x-hide-in-docs-end -->

## Overview

The OpenFeature NestJS SDK is a package that provides a NestJS wrapper for the [OpenFeature Server SDK](https://openfeature.dev/docs/reference/technologies/server/javascript/).

Capabilities include:

- Providing a NestJS global module to simplify OpenFeature configuration and usage within NestJS
- Setting up logging, event handling, hooks and providers directly when registering the module
- Injecting feature flags directly into controller route handlers by using decorators
- Injecting transaction evaluation context for flag evaluations directly from [execution context](https://docs.nestjs.com/fundamentals/execution-context) (HTTP header values, client IPs, etc.)
- Injecting OpenFeature clients into NestJS services and controllers by using decorators

## 🚀 Quick start

### Requirements

- Node.js version 20+
- NestJS version 8+

### Install

#### npm

```sh
npm install --save @openfeature/nestjs-sdk
```

#### yarn

```sh
# yarn requires manual installation of the peer dependencies (see below)
yarn add @openfeature/nestjs-sdk @openfeature/server-sdk @openfeature/core
```

#### Required peer dependencies

The following list contains the peer dependencies of `@openfeature/nestjs-sdk` with its expected and compatible versions:

- `@openfeature/server-sdk`: >=1.7.5
- `@nestjs/common`: ^8.0.0 || ^9.0.0 || ^10.0.0 || ^11.0.0
- `@nestjs/core`: ^8.0.0 || ^9.0.0 || ^10.0.0 || ^11.0.0
- `rxjs`: ^6.0.0 || ^7.0.0 || ^8.0.0

The minimum required version of `@openfeature/server-sdk` currently is `1.7.5`.

### Usage

The example below shows how to use the `OpenFeatureModule` with OpenFeature's `InMemoryProvider`.

```ts
import { Module } from '@nestjs/common';
import { OpenFeatureModule, InMemoryProvider } from '@openfeature/nestjs-sdk';

@Module({
  imports: [
    OpenFeatureModule.forRoot({
      defaultProvider: new InMemoryProvider({
        testBooleanFlag: {
          defaultVariant: 'default',
          variants: { default: true },
          disabled: false,
        },
      }),
      providers: {
        differentProvider: new InMemoryProvider(),
      },
    }),
  ],
})
export class AppModule {}
```

With the `OpenFeatureModule` configured, it's possible to inject flag evaluation details into route handlers like in the following code snippet.

```ts
import { Controller, ExecutionContext, Get } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { BooleanFeatureFlag, EvaluationDetails } from '@openfeature/nestjs-sdk';
import { Request } from 'express';

@Controller()
export class OpenFeatureController {
  @Get('/welcome')
  public async welcome(
    @BooleanFeatureFlag({
      flagKey: 'testBooleanFlag',
      defaultValue: false,
    })
    feature: Observable<EvaluationDetails<boolean>>,
  ) {
    return feature.pipe(
      map((details) =>
        details.value ? 'Welcome to this OpenFeature-enabled NestJS app!' : 'Welcome to this NestJS app!',
      ),
    );
  }
}
```

It is also possible to inject the default or domain scoped OpenFeature clients into a service via Nest dependency injection system.

```ts
import { Injectable } from '@nestjs/common';
import { OpenFeatureClient, Client } from '@openfeature/nestjs-sdk';

@Injectable()
export class OpenFeatureTestService {
  constructor(
    @OpenFeatureClient() private defaultClient: Client,
    @OpenFeatureClient({ domain: 'my-domain' }) private scopedClient: Client,
  ) {}

  public async getBoolean() {
    return await this.defaultClient.getBooleanValue('testBooleanFlag', false);
  }
}
```

#### Managing Controller or Route Access via Feature Flags

The `RequireFlagsEnabled` decorator can be used to manage access to a controller or route based on the enabled state of a feature flag. The decorator will throw an exception if the required feature flag(s) are not enabled.

```ts
import { Controller, Get } from '@nestjs/common';
import { RequireFlagsEnabled } from '@openfeature/nestjs-sdk';

@Controller()
export class OpenFeatureController {
  @RequireFlagsEnabled({ flags: [{ flagKey: 'testBooleanFlag' }] })
  @Get('/welcome')
  public async welcome() {
    return 'Welcome to this OpenFeature-enabled NestJS app!';
  }
}
```

## Module additional information

### Flag evaluation context injection

Whenever a flag evaluation occurs, context can be provided with information like user e-mail, role, targeting key, etc. in order to trigger specific evaluation rules or logic. The `OpenFeatureModule` provides a way to configure context for each request using the `contextFactory` option.
The `contextFactory` is run in a NestJS interceptor scope to configure the evaluation context, and then it is used in every flag evaluation related to this request.
By default, the interceptor is configured globally, but it can be changed by setting the `useGlobalInterceptor` to `false`. In this case, it is still possible to configure a `contextFactory` that can be injected into route, module or controller bound interceptors.
