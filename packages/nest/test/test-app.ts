import { Controller, Get, Injectable, Module } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  BooleanFeatureFlag,
  ObjectFeatureFlag,
  NumberFeatureFlag,
  OpenFeatureClient,
  OpenFeatureModule,
  StringFeatureFlag,
} from '../src';
import { Client, EvaluationDetails, FlagValue, InMemoryProvider } from '@openfeature/server-sdk';
import { FlagdProvider } from '@openfeature/flagd-provider';

@Injectable()
export class OpenFeatureTestService {
  constructor(
    @OpenFeatureClient() public defaultClient: Client,
    @OpenFeatureClient({ name: 'namedClient' }) public namedClient: Client,
  ) {}

  public async serviceMethod(flag: EvaluationDetails<FlagValue>) {
    return flag.value;
  }
}

@Module({
  imports: [
    OpenFeatureModule.forRoot({
      defaultProvider: new FlagdProvider({
        host: 'localhost',
        port: 8013,
        tls: false,
      }),
    }),
  ],
})
export class AppModule {}

@Controller()
export class OpenFeatureController {
  constructor(private testService: OpenFeatureTestService) {}

  @Get('/welcome')
  public async welcome(
    @BooleanFeatureFlag({ flagKey: 'testBooleanFlag', defaultValue: false })
    feature: Observable<EvaluationDetails<boolean>>,
  ) {
    return feature.pipe(
      map((details) =>
        details.value ? 'Welcome to this OpenFeature-enabled Nest.js app!' : 'Welcome to this Nest.js app!',
      ),
    );
  }

  @Get('/boolean')
  public async handleBooleanRequest(
    @BooleanFeatureFlag({ flagKey: 'testBooleanFlag', defaultValue: false })
    feature: Observable<EvaluationDetails<boolean>>,
  ) {
    return feature.pipe(map((details) => this.testService.serviceMethod(details)));
  }

  @Get('/string')
  public async handleStringRequest(
    @StringFeatureFlag({ flagKey: 'testStringFlag', defaultValue: 'default-value' })
    feature: Observable<EvaluationDetails<string>>,
  ) {
    return feature.pipe(map((details) => this.testService.serviceMethod(details)));
  }

  @Get('/number')
  public async handleNumberRequest(
    @NumberFeatureFlag({ flagKey: 'testNumberFlag', defaultValue: 0 })
    feature: Observable<EvaluationDetails<number>>,
  ) {
    return feature.pipe(map((details) => this.testService.serviceMethod(details)));
  }

  @Get('/object')
  public async handleObjectRequest(
    @ObjectFeatureFlag({ flagKey: 'testObjectFlag', defaultValue: {} })
    feature: Observable<EvaluationDetails<number>>,
  ) {
    return feature.pipe(map((details) => this.testService.serviceMethod(details)));
  }
}

export function getOpenFeatureTestModule() {
  return OpenFeatureModule.forRoot({
    defaultProvider: new InMemoryProvider({
      testBooleanFlag: {
        defaultVariant: 'default',
        variants: { default: true },
        disabled: false,
      },
      testStringFlag: {
        defaultVariant: 'default',
        variants: { default: 'expected-string-value-default' },
        disabled: false,
      },
      testNumberFlag: {
        defaultVariant: 'default',
        variants: { default: 10 },
        disabled: false,
      },
      testObjectFlag: {
        defaultVariant: 'default',
        variants: { default: { client: 'default' } },
        disabled: false,
      },
    }),
    providers: {
      namedClient: new InMemoryProvider({
        testBooleanFlag: {
          defaultVariant: 'default',
          variants: { default: true },
          disabled: false,
        },
        testStringFlag: {
          defaultVariant: 'default',
          variants: { default: 'expected-string-value-named' },
          disabled: false,
        },
        testNumberFlag: {
          defaultVariant: 'default',
          variants: { default: 10 },
          disabled: false,
        },
        testObjectFlag: {
          defaultVariant: 'default',
          variants: { default: { client: 'named' } },
          disabled: false,
        },
      }),
    },
  });
}
