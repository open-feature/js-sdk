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
  <a href="https://github.com/open-feature/js-sdk/releases/tag/angular-sdk-v0.0.10">
    <img alt="Release" src="https://img.shields.io/static/v1?label=release&message=v0.0.10&color=blue&style=for-the-badge" />
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

[OpenFeature](https://openfeature.dev) is an open specification that provides a vendor-agnostic, community-driven API
for feature flagging that works with your favorite feature flag management tool or in-house solution.

<!-- x-hide-in-docs-end -->

## Overview

The OpenFeature Angular SDK adds Angular-specific functionality to
the [OpenFeature Web SDK](https://openfeature.dev/docs/reference/technologies/client/web).

In addition to the features provided by the [web sdk](https://openfeature.dev/docs/reference/technologies/client/web), capabilities include:

- [Overview](#overview)
- [Quick start](#quick-start)
    - [Requirements](#requirements)
    - [Install](#install)
        - [npm](#npm)
        - [yarn](#yarn)
        - [Required peer dependencies](#required-peer-dependencies)
    - [Usage](#usage)
        - [Module](#module)
            - [Minimal Example](#minimal-example)
        - [How to use](#how-to-use)
            - [Boolean Feature Flag](#boolean-feature-flag)
            - [Number Feature Flag](#number-feature-flag)
            - [String Feature Flag](#string-feature-flag)
            - [Object Feature Flag](#object-feature-flag)
            - [Opting-out of automatic re-rendering](#opting-out-of-automatic-re-rendering)
            - [Consuming the evaluation details](#consuming-the-evaluation-details)
            - [Setting Evaluation Context](#setting-evaluation-context)
- [FAQ and troubleshooting](#faq-and-troubleshooting)
- [Resources](#resources)

## Quick start

### Requirements

- ES2015-compatible web browser (Chrome, Edge, Firefox, etc)
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

### Usage

#### Module

To include the OpenFeature Angular directives in your application, you need to import the `OpenFeatureModule` and
configure it using the `forRoot` method.

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
      // domainBoundProviders are optional, mostly needed if more than one provider is used in the application.
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

If `initializing` and `reconciling` are not given, the feature flag value that is returned by the provider will
determine what will be rendered.

```html
<div *booleanFeatureFlag="'isFeatureEnabled'; default: true">
  This is shown when the feature flag is enabled.
</div>
```

This example shows content when the feature flag `isFeatureEnabled` is true with a default value of true.
No `else`, `initializing`, or `reconciling` templates are required in this case.

#### How to use

The library provides two main ways to work with feature flags:

1. **Structural Directives** - For template-based conditional rendering
2. **FeatureFlagService** - For programmatic access with Observables

##### Structural Directives

The library provides four primary directives for feature flags, `booleanFeatureFlag`,
`numberFeatureFlag`, `stringFeatureFlag` and `objectFeatureFlag`.

The first value given to the directive is the flag key that should be evaluated.

For all directives, the default value passed to OpenFeature has to be provided by the `default` parameter.

For all non-boolean directives, the value to compare the evaluation result to can be provided by the `value` parameter.
This parameter is optional, if omitted, the `thenTemplate` will always be rendered.

The `domain` parameter is _optional_ and will be used as domain when getting the OpenFeature provider.

The `updateOnConfigurationChanged` and `updateOnContextChanged` parameter are _optional_ and used to disable the
automatic re-rendering on flag value or context change. They are set to `true` by default.

The template referenced in `else` will be rendered if the evaluated feature flag is `false` for the `booleanFeatureFlag`
directive and if the `value` does not match evaluated flag value for all other directives.
This parameter is _optional_.

The template referenced in `initializing` and `reconciling` will be rendered if OpenFeature provider is in the
corresponding states.
This parameter is _optional_, if omitted, the `then` and `else` templates will be rendered according to the flag value.

###### Boolean Feature Flag

```html
<div
  *booleanFeatureFlag="'isFeatureEnabled'; default: true; domain: 'userDomain'; else: booleanFeatureElse; initializing: booleanFeatureInitializing; reconciling: booleanFeatureReconciling">
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

###### Number Feature Flag

```html
<div
  *numberFeatureFlag="'discountRate'; value: 10; default: 5; domain: 'userDomain'; else: numberFeatureElse; initializing: numberFeatureInitializing; reconciling: numberFeatureReconciling">
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

###### String Feature Flag

```html
<div
  *stringFeatureFlag="'themeColor'; value: 'dark'; default: 'light'; domain: 'userDomain'; else: stringFeatureElse; initializing: stringFeatureInitializing; reconciling: stringFeatureReconciling">
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

###### Object Feature Flag

```html
<div
  *objectFeatureFlag="'userConfig'; value: { theme: 'dark' }; default: { theme: 'light' }; domain: 'userDomain'; else: objectFeatureElse; initializing: objectFeatureInitializing; reconciling: objectFeatureReconciling">
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

###### Opting-out of automatic re-rendering

By default, the directive re-renders when the flag value changes or the context changes.

In cases, this is not desired, re-rendering can be disabled for both events:

```html
<div *booleanFeatureFlag="'isFeatureEnabled'; default: true; updateOnContextChanged: false; updateOnConfigurationChanged: false;">
  This is shown when the feature flag is enabled.
</div>
```

###### Consuming the evaluation details

The `evaluation details` can be used when rendering the templates.
The directives [`$implicit`](https://angular.dev/guide/directives/structural-directives#structural-directive-shorthand)
value will be bound to the flag value and additionally the value `evaluationDetails` will be
bound to the whole evaluation details.
They can be referenced in all templates.

The following example shows `value` being implicitly bound and `details` being bound to the evaluation details.

```html
<div
  *stringFeatureFlag="'themeColor'; value: 'dark'; default: 'light'; else: stringFeatureElse; let value; let details = evaluationDetails">
  It was a match!
  The theme color is {{ value }} because of {{ details.reason }}
</div>
<ng-template #stringFeatureElse let-value let-details='evaluationDetails'>
  It was no match!
  The theme color is {{ value }} because of {{ details.reason }}
</ng-template>
```

When the expected flag value is omitted, the template will always be rendered.
This can be used to just render the flag value or details without conditional rendering.

```html
<div *stringFeatureFlag="'themeColor'; default: 'light'; let value;">
  The theme color is {{ value }}.
</div>
```

##### FeatureFlagService

The `FeatureFlagService` provides programmatic access to feature flags through reactive patterns. All methods return
Observables that automatically emit new values when flag configurations or evaluation context changes.

###### Using with Observables

```typescript
import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FeatureFlagService } from '@openfeature/angular-sdk';

@Component({
  selector: 'my-component',
  standalone: true,
  imports: [AsyncPipe],
  template: `
    <div *ngIf="(isFeatureEnabled$ | async)?.value">
      Feature is enabled! Reason: {{ (isFeatureEnabled$ | async)?.reason }}
    </div>
    <div>Theme: {{ (currentTheme$ | async)?.value }}</div>
    <div>Max items: {{ (maxItems$ | async)?.value }}</div>
  `
})
export class MyComponent {
  private flagService = inject(FeatureFlagService);

  // Boolean flag
  isFeatureEnabled$ = this.flagService.getBooleanDetails('my-feature', false);

  // String flag
  currentTheme$ = this.flagService.getStringDetails('theme', 'light');

  // Number flag
  maxItems$ = this.flagService.getNumberDetails('max-items', 10);

  // Object flag with type safety
  config$ = this.flagService.getObjectDetails<{ timeout: number }>('api-config', { timeout: 5000 });
}
```

###### Using with Angular Signals

You can convert any Observable from the service to an Angular Signal using `toSignal()`:

```typescript
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FeatureFlagService } from '@openfeature/angular-sdk';

@Component({
  selector: 'my-component',
  standalone: true,
  template: `
    <div *ngIf="isFeatureEnabled()?.value">
      Feature is enabled! Reason: {{ isFeatureEnabled()?.reason }}
    </div>
    <div>Theme: {{ currentTheme()?.value }}</div>
  `
})
export class MyComponent {
  private flagService = inject(FeatureFlagService);

  // Convert Observables to Signals
  isFeatureEnabled = toSignal(this.flagService.getBooleanDetails('my-feature', false));
  currentTheme = toSignal(this.flagService.getStringDetails('theme', 'light'));
}
```

###### Service Options

The service methods accept the [same options as the directives](#opting-out-of-automatic-re-rendering):

```typescript
const flag$ = this.flagService.getBooleanDetails('my-flag', false, 'my-domain', {
  updateOnConfigurationChanged: false,  // default: true
  updateOnContextChanged: false,        // default: true
});
```

##### Setting evaluation context

To set the initial evaluation context, you can add the `context` parameter to the `OpenFeatureModule` configuration.
This context can be either an object or a factory function that returns an `EvaluationContext`.

> [!TIP]
> Updating the context can be done directly via the global OpenFeature API using `OpenFeature.setContext()`

Here’s how you can define and use the initial client evaluation context:

###### Using a static object

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenFeatureModule } from '@openfeature/angular-sdk';

const initialContext = {
  user: {
    id: 'user123',
    role: 'admin',
  }
};

@NgModule({
  imports: [
    CommonModule,
    OpenFeatureModule.forRoot({
      provider: yourFeatureProvider,
      context: initialContext
    })
  ],
})
export class AppModule {}
```

###### Using a factory function

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenFeatureModule, EvaluationContext } from '@openfeature/angular-sdk';

const contextFactory = (): EvaluationContext => loadContextFromLocalStorage();

@NgModule({
  imports: [
    CommonModule,
    OpenFeatureModule.forRoot({
      provider: yourFeatureProvider,
      context: contextFactory
    })
  ],
})
export class AppModule {}
```

## FAQ and troubleshooting

> I can import things form the `@openfeature/angular-sdk`, `@openfeature/web-sdk`, and `@openfeature/core`; which should I use?

The `@openfeature/angular-sdk` re-exports everything from its peers (`@openfeature/web-sdk` and `@openfeature/core`), and adds the Angular-specific features.
You can import everything from the `@openfeature/angular-sdk` directly.
Avoid importing anything from `@openfeature/web-sdk` or `@openfeature/core`.

## Resources

- [Example repo](https://github.com/open-feature/angular-test-app)
