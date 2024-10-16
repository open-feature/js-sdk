import { Controller, Get, Injectable, UseInterceptors } from '@nestjs/common';
import type { Observable} from 'rxjs';
import { map } from 'rxjs';
import { BooleanFeatureFlag, ObjectFeatureFlag, NumberFeatureFlag, OpenFeatureClient, StringFeatureFlag } from '../src';
import type { Client, EvaluationDetails, FlagValue } from '@openfeature/server-sdk';
import { EvaluationContextInterceptor } from '../src';

@Injectable()
export class OpenFeatureTestService {
  constructor(
    @OpenFeatureClient() public defaultClient: Client,
    @OpenFeatureClient({ domain: 'domainScopedClient' }) public domainScopedClient: Client,
  ) {}

  public async serviceMethod(flag: EvaluationDetails<FlagValue>) {
    return flag.value;
  }

  public async serviceMethodWithDynamicContext(flagKey: string): Promise<boolean> {
    return this.defaultClient.getBooleanValue(flagKey, false);
  }
}

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
}

@Controller()
@UseInterceptors(EvaluationContextInterceptor)
export class OpenFeatureControllerContextScopedController {
  constructor(private testService: OpenFeatureTestService) {}

  @Get('/controller-context')
  public async handleDynamicContextRequest(
    @BooleanFeatureFlag({
      flagKey: 'testBooleanFlag',
      defaultValue: false,
    })
    feature: Observable<EvaluationDetails<number>>,
  ) {
    return feature.pipe(map((details) => this.testService.serviceMethod(details)));
  }
}
