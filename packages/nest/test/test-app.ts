import { Controller, ExecutionContext, Get, Injectable } from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  BooleanFeatureFlag,
  ObjectFeatureFlag,
  NumberFeatureFlag,
  FeatureClient,
  OpenFeatureModule,
  StringFeatureFlag,
  FeatureContextService,
} from '../src';
import { OpenFeatureClient, EvaluationDetails, FlagValue, InMemoryProvider } from '@openfeature/server-sdk';
import { OpenFeatureContextService } from '../src/feature.service';
import { SharedAsyncLocalStorage } from '../src/async-storage';

@Injectable()
export class OpenFeatureTestService {
  constructor(
    @FeatureClient() public defaultClient: OpenFeatureClient,
    @FeatureClient({ name: 'namedClient' }) public namedClient: OpenFeatureClient,
    @FeatureContextService() public contextService: OpenFeatureContextService,
  ) { }

  public async serviceMethod(flag: EvaluationDetails<FlagValue>) {
    return flag.value;
  }

  public async serviceMethodWithDynamicContext(flagKey: string): Promise<boolean> {
    return this.defaultClient.getBooleanValue(flagKey, false);
  }

  public async serviceMethodWithDynamicAditionalContext(flagKey: string): Promise<boolean> {
    return this.defaultClient.getBooleanValue(flagKey, false, {isAditionalContext: true});
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
  public async handleDynamicContextRequest(
    @BooleanFeatureFlag({
      flagKey: 'testBooleanFlag',
      defaultValue: false,
    })
    feature: Observable<EvaluationDetails<number>>,
  ) {
    return feature.pipe(map((details) => this.testService.serviceMethod(details)));
  }

  @Get('/dynamic-context-in-service')
  public async handleDynamicContextInServiceRequest() {
    return this.testService.serviceMethodWithDynamicContext('testBooleanFlag');
  }

  @Get('/dynamic-aditional-context-in-service')
  public async handleDynamicAditionalContextInServiceRequest() {
    return this.testService.serviceMethodWithDynamicAditionalContext('testBooleanFlag');
  }
}

export async function exampleContextFactory(context: ExecutionContext) {
  const request = await context.switchToHttp().getRequest();

  const userId = request.header('x-user-id');

  if (userId) {
    return {
      targetingKey: userId,
    };
  }

  return undefined;
}

export function getOpenFeatureTestModule() {
  return OpenFeatureModule.forRoot({
    contextFactory: exampleContextFactory,
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
