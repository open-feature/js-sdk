import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Input,
  OnChanges,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {
  Client,
  ClientProviderEvents,
  ClientProviderStatus,
  EvaluationDetails,
  EventHandler,
  FlagValue,
  JsonValue,
  OpenFeature,
} from '@openfeature/web-sdk';

class FeatureFlagDirectiveContext<T extends FlagValue> {
  $implicit!: T;
  evaluationDetails: EvaluationDetails<T>;

  constructor(details: EvaluationDetails<T>) {
    this.$implicit = details.value;
    this.evaluationDetails = details;
  }
}

@Directive({
  selector: '[featureFlag]',
})
export abstract class FeatureFlagDirective<T extends FlagValue> implements OnDestroy, OnChanges {
  protected _featureFlagDefault: T;
  protected _featureFlagDomain: string | undefined;

  protected _featureFlagKey: string;
  protected _featureFlagValue: T;

  protected _client: Client;
  protected _lastEvaluationResult: EvaluationDetails<T>;
  protected _flagChangeHandler: EventHandler<ClientProviderEvents> | null = null;

  protected _thenTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _thenViewRef: EmbeddedViewRef<unknown> | null;

  protected _elseTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _elseViewRef: EmbeddedViewRef<unknown> | null;

  protected _initializingTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _initializingViewRef: EmbeddedViewRef<unknown> | null;

  protected _reconcilingTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _reconcilingViewRef: EmbeddedViewRef<unknown> | null;

  constructor(
    protected _changeDetectorRef: ChangeDetectorRef,
    protected _viewContainerRef: ViewContainerRef,
    templateRef: TemplateRef<FeatureFlagDirectiveContext<T>>,
  ) {
    this._thenTemplateRef = templateRef;

    this._flagChangeHandler = () => {
      const result = this.getFlagDetails(this._featureFlagKey, this._featureFlagDefault);
      this.onFlagValue(result, this._client.providerStatus);
    };
  }

  set featureFlagDomain(domain: string | undefined) {
    this._featureFlagDomain = domain;

    if (this._client) {
      this.disposeClient(this._client);
    }

    this._client = this.initClient();
  }

  ngOnChanges(): void {
    this._flagChangeHandler?.();
  }

  ngOnDestroy(): void {
    if (this._client) {
      this.disposeClient(this._client);
      this._client = null;
    }
  }

  private initClient(): Client {
    const client = OpenFeature.getClient(this._featureFlagDomain);
    client.addHandler(ClientProviderEvents.ContextChanged, this._flagChangeHandler);
    client.addHandler(ClientProviderEvents.ConfigurationChanged, this._flagChangeHandler);
    client.addHandler(ClientProviderEvents.Ready, this._flagChangeHandler);
    client.addHandler(ClientProviderEvents.Reconciling, this._flagChangeHandler);
    return client;
  }

  private disposeClient(client: Client) {
    if (this._flagChangeHandler) {
      client.removeHandler(ClientProviderEvents.ContextChanged, this._flagChangeHandler);
      client.removeHandler(ClientProviderEvents.ConfigurationChanged, this._flagChangeHandler);
      client.removeHandler(ClientProviderEvents.Ready, this._flagChangeHandler);
      client.removeHandler(ClientProviderEvents.Reconciling, this._flagChangeHandler);
    }
  }

  protected getFlagDetails(flagKey: string, defaultValue: T): EvaluationDetails<T> {
    if (typeof defaultValue === 'boolean') {
      return this._client.getBooleanDetails(flagKey, defaultValue) as EvaluationDetails<T>;
    } else if (typeof defaultValue === 'number') {
      return this._client.getNumberDetails(flagKey, defaultValue) as EvaluationDetails<T>;
    } else if (typeof defaultValue === 'string') {
      return this._client.getStringDetails(flagKey, defaultValue) as EvaluationDetails<T>;
    } else {
      return this._client.getObjectDetails(flagKey, defaultValue) as EvaluationDetails<T>;
    }
  }

  protected onFlagValue(result: EvaluationDetails<T>, status: ClientProviderStatus): void {
    const shouldInitialize = this._initializingTemplateRef && status === ClientProviderStatus.NOT_READY;
    const shouldReconcile = this._reconcilingTemplateRef && status === ClientProviderStatus.RECONCILING;

    const resultChanged = !deepEqual(this._lastEvaluationResult, result);
    const isValueMatch = deepEqual(result.value, this._featureFlagValue);

    if (this._initializingViewRef && shouldInitialize && !resultChanged) {
      return;
    } else if (this._reconcilingViewRef && shouldReconcile && !resultChanged) {
      return;
    } else if (this._thenViewRef && isValueMatch && !shouldInitialize && !shouldReconcile && !resultChanged) {
      return;
    } else if (this._elseViewRef && !isValueMatch && !shouldInitialize && !shouldReconcile && !resultChanged) {
      return;
    }

    this._lastEvaluationResult = result;
    this._viewContainerRef.clear();
    this._initializingViewRef = null;
    this._reconcilingViewRef = null;
    this._thenViewRef = null;
    this._elseViewRef = null;

    const context = new FeatureFlagDirectiveContext(result);

    if (this._initializingTemplateRef && status === ClientProviderStatus.NOT_READY) {
      this._initializingViewRef = this._viewContainerRef.createEmbeddedView(this._initializingTemplateRef, context);
    } else if (this._reconcilingTemplateRef && status === ClientProviderStatus.RECONCILING) {
      this._reconcilingViewRef = this._viewContainerRef.createEmbeddedView(this._reconcilingTemplateRef, context);
    } else if (isValueMatch) {
      this._thenViewRef = this._viewContainerRef.createEmbeddedView(this._thenTemplateRef, context);
    } else if (this._elseTemplateRef) {
      this._elseViewRef = this._viewContainerRef.createEmbeddedView(this._elseTemplateRef, context);
    }

    this._changeDetectorRef.markForCheck();
  }
}

@Directive({
  selector: '[booleanFeatureFlag]',
})
export class BooleanFeatureFlagDirective extends FeatureFlagDirective<boolean> implements OnChanges {
  @Input({ required: true }) booleanFeatureFlag: string;
  @Input({ required: true }) booleanFeatureFlagDefault: boolean;

  override ngOnChanges() {
    this._featureFlagKey = this.booleanFeatureFlag;
    this._featureFlagDefault = this.booleanFeatureFlagDefault;
    this._featureFlagValue = true;
    super.ngOnChanges();
  }

  @Input({ required: false })
  set booleanFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  @Input()
  set booleanFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<boolean>>) {
    this._elseTemplateRef = tpl;
  }

  @Input()
  set booleanFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<boolean>>) {
    this._initializingTemplateRef = tpl;
  }

  @Input()
  set booleanFeatureFlagReconciling(tpl: TemplateRef<FeatureFlagDirectiveContext<boolean>>) {
    this._reconcilingTemplateRef = tpl;
  }
}

@Directive({
  selector: '[numberFeatureFlag]',
})
export class NumberFeatureFlagDirective extends FeatureFlagDirective<number> {
  @Input({ required: true }) numberFeatureFlag: string;
  @Input({ required: true }) numberFeatureFlagDefault: number;
  @Input({ required: true }) numberFeatureFlagValue: number;

  override ngOnChanges() {
    this._featureFlagKey = this.numberFeatureFlag;
    this._featureFlagDefault = this.numberFeatureFlagValue;
    this._featureFlagValue = this.numberFeatureFlagValue;
    super.ngOnChanges();
  }

  @Input({ required: false })
  set numberFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  @Input()
  set numberFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<number>>) {
    this._elseTemplateRef = tpl;
  }

  @Input()
  set numberFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<number>>) {
    this._initializingTemplateRef = tpl;
  }

  @Input()
  set numberFeatureFlagReconciling(tpl: TemplateRef<FeatureFlagDirectiveContext<number>>) {
    this._reconcilingTemplateRef = tpl;
  }
}

@Directive({
  selector: '[stringFeatureFlag]',
})
export class StringFeatureFlagDirective extends FeatureFlagDirective<string> {
  @Input({ required: true }) stringFeatureFlag: string;
  @Input({ required: true }) stringFeatureFlagDefault: string;
  @Input({ required: true }) stringFeatureFlagValue: string;

  override ngOnChanges() {
    this._featureFlagKey = this.stringFeatureFlag;
    this._featureFlagDefault = this.stringFeatureFlagValue;
    this._featureFlagValue = this.stringFeatureFlagValue;
    super.ngOnChanges();
  }

  @Input({ required: false })
  set stringFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  @Input()
  set stringFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<string>>) {
    this._elseTemplateRef = tpl;
  }

  @Input()
  set stringFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<string>>) {
    this._initializingTemplateRef = tpl;
  }

  @Input()
  set stringFeatureFlagReconciling(tpl: TemplateRef<FeatureFlagDirectiveContext<string>>) {
    this._reconcilingTemplateRef = tpl;
  }
}

@Directive({
  selector: '[objectFeatureFlag]',
})
export class ObjectFeatureFlagDirective<T extends JsonValue> extends FeatureFlagDirective<T> {
  @Input({ required: true }) objectFeatureFlag: string;
  @Input({ required: true }) objectFeatureFlagDefault: T;
  @Input({ required: true }) objectFeatureFlagValue: T;

  override ngOnChanges() {
    this._featureFlagKey = this.objectFeatureFlag;
    this._featureFlagDefault = this.objectFeatureFlagValue;
    this._featureFlagValue = this.objectFeatureFlagValue;
    super.ngOnChanges();
  }

  @Input({ required: false })
  set objectFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  @Input()
  set objectFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<T>>) {
    this._elseTemplateRef = tpl;
  }

  @Input()
  set objectFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<T>>) {
    this._initializingTemplateRef = tpl;
  }

  @Input()
  set objectFeatureFlagReconciling(tpl: TemplateRef<FeatureFlagDirectiveContext<T>>) {
    this._reconcilingTemplateRef = tpl;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    // If both objects are identical
    return true;
  }

  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    // One of them is not an object or one of them is null
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    // Different number of properties
    return false;
  }

  for (const key of keys1) {
    if (!keys2.includes(key)) {
      // obj2 does not have a property that obj1 has
      return false;
    }

    // Recursive check for each property
    if (!deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
}
