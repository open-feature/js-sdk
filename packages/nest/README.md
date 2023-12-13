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

🧪 This SDK is experimental.

#### Here's a basic example of how to use the OpenFeature NestJS API with `InMemoryProvider`.

#### Registering the Nest.js SDK module in the App Module:

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
        companyName: {
          defaultVariant: 'default',
          variants: { default: "BigCorp" },
          disabled: false
        }
      }),
      providers: {
        differentProvider: new InMemoryProvider()
      }
    })
  ]
})
export class AppModule {}
```

#### Injecting a feature flag with header value in evaluation context into an endpoint handler method

```ts
import { Controller, ExecutionContext, Get } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { BooleanFeatureFlag } from '@openfeature/nestjs-sdk';
import { EvaluationDetails } from '@openfeature/server-sdk';
import { Request } from 'express';

function getContext(executionContext: ExecutionContext) {
  const request = executionContext.switchToHttp().getRequest<Request>();
  const userId = request.header('x-user-id');

  if (!userId) {
    return undefined;
  }

  return {
    targetingKey: userId,
  };
}

@Controller()
export class OpenFeatureController {
  @Get('/welcome')
  public async welcome(
    @BooleanFeatureFlag({
      flagKey: 'testBooleanFlag',
      defaultValue: false,
      contextFactory: getContext,
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

#### Injecting the default and a named client into a service:

```ts
import { Injectable } from '@nestjs/common';
import { Client } from '@openfeature/server-sdk';
import { FeatureClient } from '@openfeature/nestjs-sdk';

@Injectable()
export class OpenFeatureTestService {
  constructor(
    @FeatureClient() private defaultClient: Client,
    @FeatureClient({ name: 'differentServer' }) private namedClient: Client,
  ) {
  }

  public async getMessage() {
    const companyName = await this.defaultClient.getStringValue('companyName', 'Unknown Company');
    return `Hey User from ${companyName}`;
  }
}
```


