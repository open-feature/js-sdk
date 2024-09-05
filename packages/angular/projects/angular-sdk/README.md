<!-- markdownlint-disable MD033 -->
<!-- x-hide-in-docs-start -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/white/openfeature-horizontal-white.svg" />
    <img align="center" alt="OpenFeature Logo" src="https://raw.githubusercontent.com/open-feature/community/0e23508c163a6a1ac8c0ced3e4bd78faafe627c7/assets/logo/horizontal/black/openfeature-horizontal-black.svg" />
  </picture>
</p>

<h2 align="center">OpenFeature Angular SDK</h2>

<!-- x-hide-in-docs-end -->
<!-- The 'github-badges' class is used in the docs -->
<p align="center" class="github-badges">
  <a href="https://github.com/open-feature/spec/releases/tag/v0.8.0">
    <img alt="Specification" src="https://img.shields.io/static/v1?label=specification&message=v0.8.0&color=yellow&style=for-the-badge" />
  </a>
  <!-- x-release-please-start-version -->
  <a href="https://github.com/open-feature/js-sdk/releases/tag/angular-sdk-v0.0.0">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v0.0.0&color=blue&style=for-the-badge" />
  </a>
  <!-- x-release-please-end -->
  <br/>
  <a href="https://codecov.io/gh/open-feature/js-sdk">
    <img alt="codecov" src="https://codecov.io/gh/open-feature/js-sdk/branch/main/graph/badge.svg?token=3DC5XOEHMY" />
  </a>
  <a href="https://www.npmjs.com/package/@openfeature/angular-sdk">
    <img alt="NPM Download" src="https://img.shields.io/npm/dm/%40openfeature%2Fangular-sdk" />
  </a>
</p>
<!-- x-hide-in-docs-start -->

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API for feature flagging that works with your favorite feature flag management tool or in-house solution.

<!-- x-hide-in-docs-end -->

## Overview

The OpenFeature Angular SDK adds Angular-specific functionality to the [OpenFeature Web SDK](https://openfeature.dev/docs/reference/technologies/client/web).

In addition to the feature provided by the [web sdk](https://openfeature.dev/docs/reference/technologies/client/web), capabilities include:

## Table of Contents

- [Quick start](#quick-start)
  - [Requirements](#requirements)
  - [Install](#install)
    - [npm](#npm)
    - [yarn](#yarn)
    - [Required peer dependencies](#required-peer-dependencies)
  - [Minimal Example](#minimal-example)
  - [Flag Types](#flag-types)
    - [Boolean Feature Flag](#boolean-feature-flag)
    - [Number Feature Flag](#number-feature-flag)
    - [String Feature Flag](#string-feature-flag)
    - [Object Feature Flag](#object-feature-flag)
- [Inputs](#inputs)
- [Contributing](#contributing)
- [License](#license)

## Quick start

### Requirements

- ES2022-compatible web browser (Chrome, Edge, Firefox, etc)
- Angular version 16+

### Install

#### npm

```sh
npm install --save @openfeature/angular-sdk
```

#### yarn

```sh
# yarn requires manual installation of the peer dependencies (see below)
yarn add @openfeature/angular-sdk @openfeature/web-sdk @openfeature/core
```

#### Required peer dependencies

The following list contains the peer dependencies of `@openfeature/angular-sdk`.
See the [package.json](./package.json) for the required versions.

* `@openfeature/web-sdk`
* `@angular/common`
* `@angular/core`

#### Usage

#### Module

To include the OpenFeature Angular directives in your application, you need to import the `OpenFeatureModule` and configure it using the `forRoot` method.

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenFeatureModule } from '@openfeature/angular-sdk';

@NgModule({
  declarations: [
    // Other components
  ],
  imports: [
    CommonModule,
    OpenFeatureModule.forRoot({
      provider: yourFeatureProvider,
      domainBoundProviders: {
        domain1: new YourOpenFeatureProvider(),
        domain2: new YourOtherOpenFeatureProvider(),
      },
    })
  ],
})
export class AppModule {
}
```

##### Minimal Example

You don't need to provide all the templates. Here's a minimal example using a boolean feature flag:

If `initializing` and `reconciling` are not given, the feature flag value that is returned by the provider will determine what will be rendered.

```html
<div *booleanFeatureFlag="'isFeatureEnabled'; default: true">
  This is shown when the feature flag is enabled.
</div>
```

This example shows content when the feature flag `isFeatureEnabled` is true with a default value of true. No `else`, `initializing`, or `reconciling` templates are required in this case.

#### Flag Types

The library provides four primary directives for feature flags:

##### Boolean Feature Flag

```html
<div *booleanFeatureFlag="'isFeatureEnabled'; default: true; domain: 'userDomain'; else: booleanFeatureElse; initializing: booleanFeatureInitializing; reconciling: booleanFeatureReconciling">
  This is shown when the feature flag is enabled.
</div>
<ng-template #booleanFeatureElse>
  This is shown when the feature flag is disabled.
</ng-template>
<ng-template #booleanFeatureInitializing>
  This is shown when the feature flag is initializing.
</ng-template>
<ng-template #booleanFeatureReconciling>
  This is shown when the feature flag is reconciling.
</ng-template>
```

##### Number Feature Flag

```html
<div *numberFeatureFlag="'discountRate'; value: 10; default: 5; domain: 'userDomain'; else: numberFeatureElse; initializing: numberFeatureInitializing; reconciling: numberFeatureReconciling">
  This is shown when the feature flag matches the specified discount rate.
</div>
<ng-template #numberFeatureElse>
  This is shown when the feature flag does not match the specified discount rate.
</ng-template>
<ng-template #numberFeatureInitializing>
  This is shown when the feature flag is initializing.
</ng-template>
<ng-template #numberFeatureReconciling>
  This is shown when the feature flag is reconciling.
</ng-template>
```

##### String Feature Flag

```html
<div *stringFeatureFlag="'themeColor'; value: 'dark'; default: 'light'; domain: 'userDomain'; else: stringFeatureElse; initializing: stringFeatureInitializing; reconciling: stringFeatureReconciling">
  This is shown when the feature flag matches the specified theme color.
</div>
<ng-template #stringFeatureElse>
  This is shown when the feature flag does not match the specified theme color.
</ng-template>
<ng-template #stringFeatureInitializing>
  This is shown when the feature flag is initializing.
</ng-template>
<ng-template #stringFeatureReconciling>
  This is shown when the feature flag is reconciling.
</ng-template>
```

##### Object Feature Flag

```html
<div *objectFeatureFlag="'userConfig'; value: { theme: 'dark' }; default: { theme: 'light' }; domain: 'userDomain'; else: objectFeatureElse; initializing: objectFeatureInitializing; reconciling: objectFeatureReconciling">
  This is shown when the feature flag matches the specified user configuration.
</div>
<ng-template #objectFeatureElse>
  This is shown when the feature flag does not match the specified user configuration.
</ng-template>
<ng-template #objectFeatureInitializing>
  This is shown when the feature flag is initializing.
</ng-template>
<ng-template #objectFeatureReconciling>
  This is shown when the feature flag is reconciling.
</ng-template>
```
