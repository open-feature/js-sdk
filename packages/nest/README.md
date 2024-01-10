<!-- markdownlint-disable MD033 -->
<!-- x-hide-in-docs-start -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature Nest.js SDK</h2>

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

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API
for feature flagging that works with your favorite feature flag management tool.

<!-- x-hide-in-docs-end -->

🧪 This SDK is experimental.

## Overview

The OpenFeature NestJS SDK is a package that provides a NestJS wrapper for the [OpenFeature Server SDK]().

It's main capabilities are:
- Provide a NestJS global module to simplify OpenFeature configuration and usage within NestJS;
- Supply custom parameter decorators (for controllers), that inject observables with feature flags resolution details;
- Inject context for flag evaluation seamlessly using NestJS interceptors
- Provide decorators for OpenFeature Client injection into NestJS services and controllers
- TODO: map other features

## 🚀 Quick start

### Requirements

- Node.js version 16+
- NestJS

### Install

#### npm

```sh
npm install --save @openfeature/nestjs-sdk
```

#### yarn

```sh
yarn add @openfeature/nestjs-sdk
```

### Usage

The example bellow shows how to use the `OpenFeatureModule` with OpenFeature's `InMemoryProvider`.

```ts
import { Module } from '@nestjs/common';
import { FlagdProvider } from '@openfeature/flagd-provider';
import { OpenFeatureModule } from '@openfeature/nestjs-sdk';
import { InMemoryProvider } from '@openfeature/web-sdk';

@Module({
  imports: [
    OpenFeatureModule.forRoot({
      defaultProvider: new InMemoryProvider({
        testBooleanFlag: {
          defaultVariant: 'default',
          variants: { default: true },
          disabled: false
        },
      }),
      providers: {
        differentProvider: new InMemoryProvider()
      }
    })
  ]
})
export class AppModule {}
```

With the `OpenFeatureModule` configured it is now possible to inject flag evaluation details into route handlers like in the following code snippet.

```ts
import { Controller, ExecutionContext, Get } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { BooleanFeatureFlag } from '@openfeature/nestjs-sdk';
import { EvaluationDetails } from '@openfeature/server-sdk';
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
        details.value ? 'Welcome to this OpenFeature-enabled Nest.js app!' : 'Welcome to this Nest.js app!',
      ),
    );
  }
}
```

It is also possible to inject the default and a named OpenFeature client into a service via it's constructor with Nest dependency injection system.

```ts
import { Injectable } from '@nestjs/common';
import { Client } from '@openfeature/server-sdk';
import { FeatureClient } from '@openfeature/nestjs-sdk';

@Injectable()
export class OpenFeatureTestService {
  constructor(
    @FeatureClient() private defaultClient: Client,
    @FeatureClient({ name: 'differentProvider' }) private namedClient: Client,
  ) {}

  public async getBoolean() {
    return await this.defaultClient.getBooleanValue('testBooleanFlag', false);
  }
}
```

## Module aditional information

### Flag evaluation context injection

Whenever a flag evaluation occours, context can be provided with information like user e-mail, role, targeting key, etc in order to trigger specific evaluation rules or logic. The `OpenFeatureModule` provides a way to configure context for each request using the `contextFactory` option.
The `contextFactory` is ran in a NestJS interceptor scope to configure the evaluation context and than it is used in every flag evaluation related to this request.
By default the interceptor is cofigured globally, but it can be changed by setting the `useGlobalInterceptor` to `false`. In this case it is still possible to configure a `contextFactory` that can be injected into route, module or controller bound interceptors.
