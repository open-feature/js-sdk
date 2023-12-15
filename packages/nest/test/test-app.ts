import { Controller, Get, Injectable } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  BooleanFeatureFlag,
  ObjectFeatureFlag,
  NumberFeatureFlag,
  FeatureClient,
  OpenFeatureModule,
  StringFeatureFlag,
  BooleanFFlagDetails,
  ResolveFeatureFlags,
} from '../src';
import { Client, EvaluationDetails, FlagValue, InMemoryProvider } from '@openfeature/server-sdk';

@Injectable()
export class OpenFeatureTestService {
  constructor(
    @FeatureClient() public defaultClient: Client,
    @FeatureClient({ name: 'namedClient' }) public namedClient: Client,
  ) { }

  public async serviceMethod(flag: EvaluationDetails<FlagValue>) {
    return flag.value;
  }

  @ResolveFeatureFlags
  public injectedFlagWithContextMethod(
    @BooleanFFlagDetails({flag: 'testBooleanFlag', defaultValue: false}) featureDetails: any = {},
  ) {
    console.log({ featureDetails });
    return featureDetails.value;
  }
}

@Controller()
export class OpenFeatureController {
  constructor(private testService: OpenFeatureTestService) { }

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

  @Get('/dynamic-context')
  @ResolveFeatureFlags
  public async handleDynamicContextRequest(
    @BooleanFFlagDetails({ flag: 'testBooleanFlag', defaultValue: false }) featureDetails: any,
  ) {
    return this.testService.serviceMethod(featureDetails);
  }

  @Get('/dynamic-context/service')
  public handleDynamicContextForService() {
    return this.testService.injectedFlagWithContextMethod();
  }

}

/**
 *
 */
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
