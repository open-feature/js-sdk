import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef,
  inject,
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
  standalone: true,
  selector: '[featureFlag]',
})
export abstract class FeatureFlagDirective<T extends FlagValue> implements OnInit, OnDestroy, OnChanges {
  protected _changeDetectorRef: ChangeDetectorRef;
  protected _viewContainerRef: ViewContainerRef;

  protected _featureFlagDefault: T;
  protected _featureFlagDomain: string | undefined;

  protected _featureFlagKey: string;
  protected _featureFlagValue?: T;

  protected _client: Client;
  protected _lastEvaluationResult: EvaluationDetails<T>;

  protected _readyHandler: EventHandler<ClientProviderEvents.Ready> | null = null;
  protected _flagChangeHandler: EventHandler<ClientProviderEvents.ConfigurationChanged> | null = null;
  protected _contextChangeHandler: EventHandler<ClientProviderEvents.Error> | null = null;
  protected _reconcilingHandler: EventHandler<ClientProviderEvents.Reconciling> | null = null;

  protected _updateOnContextChanged: boolean = true;
  protected _updateOnConfigurationChanged: boolean = true;

  protected _thenTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _thenViewRef: EmbeddedViewRef<unknown> | null;

  protected _elseTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _elseViewRef: EmbeddedViewRef<unknown> | null;

  protected _initializingTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _initializingViewRef: EmbeddedViewRef<unknown> | null;

  protected _reconcilingTemplateRef: TemplateRef<FeatureFlagDirectiveContext<T>> | null;
  protected _reconcilingViewRef: EmbeddedViewRef<unknown> | null;

  protected constructor() {}

  set featureFlagDomain(domain: string | undefined) {
    /**
     * We have to handle the change of the domain explicitly because we need to get a new client when the domain changes.
     * This can not be done if we simply relay the onChanges method.
     */
    this._featureFlagDomain = domain;
    this.initClient();
  }

  ngOnInit(): void {
    this.initClient();
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

  private initClient(): void {
    if (this._client) {
      this.disposeClient(this._client);
    }
    this._client = OpenFeature.getClient(this._featureFlagDomain);

    const baseHandler = () => {
      const result = this.getFlagDetails(this._featureFlagKey, this._featureFlagDefault);
      this.onFlagValue(result, this._client.providerStatus);
    };

    this._flagChangeHandler = () => {
      if (this._updateOnConfigurationChanged) {
        baseHandler();
      }
    };

    this._contextChangeHandler = () => {
      if (this._updateOnContextChanged) {
        baseHandler();
      }
    };

    this._readyHandler = () => baseHandler();
    this._reconcilingHandler = () => baseHandler();

    this._client.addHandler(ClientProviderEvents.ConfigurationChanged, this._flagChangeHandler);
    this._client.addHandler(ClientProviderEvents.ContextChanged, this._contextChangeHandler);
    this._client.addHandler(ClientProviderEvents.Ready, this._readyHandler);
    this._client.addHandler(ClientProviderEvents.Reconciling, this._reconcilingHandler);
  }

  private disposeClient(client: Client) {
    if (this._contextChangeHandler()) {
      client.removeHandler(ClientProviderEvents.ContextChanged, this._contextChangeHandler);
    }

    if (this._flagChangeHandler) {
      client.removeHandler(ClientProviderEvents.ConfigurationChanged, this._flagChangeHandler);
    }

    if (this._readyHandler) {
      client.removeHandler(ClientProviderEvents.Ready, this._readyHandler);
    }

    if (this._reconcilingHandler) {
      client.removeHandler(ClientProviderEvents.Reconciling, this._reconcilingHandler);
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

    const context = new FeatureFlagDirectiveContext(result);

    const resultChanged = !deepEqual(this._lastEvaluationResult, result);
    const isValueMatch = !this._featureFlagValue || deepEqual(result.value, this._featureFlagValue);

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

/**
 * A structural directive that conditionally includes a template based on the evaluation
 * of a boolean feature flag.
 * When the flag evaluates to true, Angular renders the template provided in a `then` clause,
 * and when false, Angular renders the template provided in an optional `else` clause.
 * The default template for the `else` clause is blank.
 *
 * Usage examples:
 *
 * ```
 * <div *booleanFeatureFlag="'flagKey'; default: false; let value">{{ value }}</div>
 * ```
 * ```
 * <div *booleanFeatureFlag="flagKey; default: false; else: elseTemplate">Content to render when flag is true.</div>
 * <ng-template #elseTemplate>Content to render when flag is false.</ng-template>
 * ```
 *
 * @usageNotes
 *
 * You can specify templates for other statuses such as initializing and reconciling.
 *
 * ```
 * <div *booleanFeatureFlag="flagKey; default:true; else: elseTemplate; initializing: initializingTemplate; reconciling: reconcilingTemplate">Content to render when flag is true.</div>
 * <ng-template #elseTemplate>Content to render when flag is false.</ng-template>
 * <ng-template #initializingTemplate>Loading...</ng-template>
 * <ng-template #reconcilingTemplate>Reconfiguring...</ng-template>
 * ```
 *
 */
@Directive({
  standalone: true,
  selector: '[booleanFeatureFlag]',
})
export class BooleanFeatureFlagDirective extends FeatureFlagDirective<boolean> implements OnChanges {
  override _changeDetectorRef = inject(ChangeDetectorRef);
  override _viewContainerRef = inject(ViewContainerRef);
  override _thenTemplateRef = inject<TemplateRef<FeatureFlagDirectiveContext<boolean>>>(TemplateRef);

  /**
   * The key of the boolean feature flag.
   */
  @Input({ required: true }) booleanFeatureFlag: string;

  /**
   * The default value for the boolean feature flag.
   */
  @Input({ required: true }) booleanFeatureFlagDefault: boolean;

  constructor() {
    super();
  }

  override ngOnChanges() {
    this._featureFlagKey = this.booleanFeatureFlag;
    this._featureFlagDefault = this.booleanFeatureFlagDefault;
    this._featureFlagValue = true;
    super.ngOnChanges();
  }

  /**
   * The domain of the boolean feature flag.
   */
  @Input({ required: false })
  set booleanFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  @Input({ required: false })
  set booleanFeatureFlagUpdateOnConfigurationChanged(enabled: boolean | undefined) {
    this._updateOnConfigurationChanged = enabled ?? true;
  }

  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  @Input({ required: false })
  set booleanFeatureFlagUpdateOnContextChanged(enabled: boolean | undefined) {
    this._updateOnContextChanged = enabled ?? true;
  }

  /**
   * Template to be displayed when the feature flag is false.
   */
  @Input()
  set booleanFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<boolean>>) {
    this._elseTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the provider is not ready.
   */
  @Input()
  set booleanFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<boolean>>) {
    this._initializingTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the provider is reconciling.
   */
  @Input()
  set booleanFeatureFlagReconciling(tpl: TemplateRef<FeatureFlagDirectiveContext<boolean>>) {
    this._reconcilingTemplateRef = tpl;
  }
}

/**
 * A structural directive that conditionally includes a template based on the evaluation
 * of a number feature flag.
 * When the flag matches the provided value or no expected value is given, Angular renders the template provided
 * in a `then` clause, and when it doesn't match, Angular renders the template provided
 * in an optional `else` clause.
 * The default template for the `else` clause is blank.
 *
 * Usage examples:
 *
 * ```
 * <div *numberFeatureFlag="'flagKey'; default: 0; let value">{{ value }}</div>
 * ```
 * ```
 * <div *numberFeatureFlag="'flagKey'; value: 1; default: 0; else: elseTemplate">Content to render when flag matches value.</div>
 * <ng-template #elseTemplate>Content to render when flag does not match value.</ng-template>
 * ```
 *
 * @usageNotes
 *
 * You can specify templates for other statuses such as initializing and reconciling.
 *
 * ```
 * <div *numberFeatureFlag="flagKey; default: 0; value: flagValue; else: elseTemplate; initializing: initializingTemplate; reconciling: reconcilingTemplate">Content to render when flag matches value.</div>
 * <ng-template #elseTemplate>Content to render when flag does not match value.</ng-template>
 * <ng-template #initializingTemplate>Loading...</ng-template>
 * <ng-template #reconcilingTemplate>Reconfiguring...</ng-template>
 * ```
 *
 */
@Directive({
  standalone: true,
  selector: '[numberFeatureFlag]',
})
export class NumberFeatureFlagDirective extends FeatureFlagDirective<number> implements OnChanges {
  override _changeDetectorRef = inject(ChangeDetectorRef);
  override _viewContainerRef = inject(ViewContainerRef);
  override _thenTemplateRef = inject<TemplateRef<FeatureFlagDirectiveContext<number>>>(TemplateRef);

  /**
   * The key of the number feature flag.
   */
  @Input({ required: true }) numberFeatureFlag: string;

  /**
   * The default value for the number feature flag.
   */
  @Input({ required: true }) numberFeatureFlagDefault: number;

  /**
   * The expected value of this number feature flag, for which the `then` template should be rendered.
   */
  @Input({ required: false }) numberFeatureFlagValue?: number;

  constructor() {
    super();
  }

  override ngOnChanges() {
    this._featureFlagKey = this.numberFeatureFlag;
    this._featureFlagDefault = this.numberFeatureFlagDefault;
    this._featureFlagValue = this.numberFeatureFlagValue;
    super.ngOnChanges();
  }

  /**
   * The domain of the number feature flag.
   */
  @Input({ required: false })
  set numberFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  @Input({ required: false })
  set numberFeatureFlagUpdateOnConfigurationChanged(enabled: boolean | undefined) {
    this._updateOnConfigurationChanged = enabled ?? true;
  }

  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  @Input({ required: false })
  set numberFeatureFlagUpdateOnContextChanged(enabled: boolean | undefined) {
    this._updateOnContextChanged = enabled ?? true;
  }

  /**
   * Template to be displayed when the feature flag does not match value.
   */
  @Input()
  set numberFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<number>>) {
    this._elseTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the feature flag is not ready.
   */
  @Input()
  set numberFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<number>>) {
    this._initializingTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the feature flag is not ready.
   */
  @Input()
  set numberFeatureFlagReconciling(tpl: TemplateRef<FeatureFlagDirectiveContext<number>>) {
    this._reconcilingTemplateRef = tpl;
  }
}

/**
 * A structural directive that conditionally includes a template based on the evaluation
 * of a string feature flag.
 * When the flag matches the provided value or no expected value is given, Angular renders the template provided
 * in a `then` clause, and when it doesn't match, Angular renders the template provided
 * in an optional `else` clause.
 * The default template for the `else` clause is blank.
 *
 * Usage examples:
 *
 * ```
 * <div *stringFeatureFlag="'flagKey'; default: 'default'; let value">{{ value }}</div>
 * ```
 * ```
 * <div *stringFeatureFlag="flagKey; default: 'default'; value: flagValue; else: elseTemplate">Content to render when flag matches value.</div>
 * <ng-template #elseTemplate>Content to render when flag does not match value.</ng-template>
 * ```
 *
 * @usageNotes
 *
 * You can specify templates for other statuses such as initializing and reconciling.
 *
 * ```
 * <div *stringFeatureFlag="flagKey; default: 'default'; value: flagValue; else: elseTemplate; initializing: initializingTemplate; reconciling: reconcilingTemplate">Content to render when flag matches value.</div>
 * <ng-template #elseTemplate>Content to render when flag does not match value.</ng-template>
 * <ng-template #initializingTemplate>Loading...</ng-template>
 * <ng-template #reconcilingTemplate>Reconfiguring...</ng-template>
 * ```
 *
 */
@Directive({
  standalone: true,
  selector: '[stringFeatureFlag]',
})
export class StringFeatureFlagDirective extends FeatureFlagDirective<string> implements OnChanges {
  override _changeDetectorRef = inject(ChangeDetectorRef);
  override _viewContainerRef = inject(ViewContainerRef);
  override _thenTemplateRef = inject<TemplateRef<FeatureFlagDirectiveContext<string>>>(TemplateRef);

  /**
   * The key of the string feature flag.
   */
  @Input({ required: true }) stringFeatureFlag: string;

  /**
   * The default value for the string feature flag.
   */
  @Input({ required: true }) stringFeatureFlagDefault: string;

  /**
   * The expected value of this string feature flag, for which the `then` template should be rendered.
   */
  @Input({ required: false }) stringFeatureFlagValue?: string;

  constructor() {
    super();
  }

  override ngOnChanges() {
    this._featureFlagKey = this.stringFeatureFlag;
    this._featureFlagDefault = this.stringFeatureFlagDefault;
    this._featureFlagValue = this.stringFeatureFlagValue;
    super.ngOnChanges();
  }

  /**
   * The domain for the string feature flag.
   */
  @Input({ required: false })
  set stringFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  @Input({ required: false })
  set stringFeatureFlagUpdateOnConfigurationChanged(enabled: boolean | undefined) {
    this._updateOnConfigurationChanged = enabled ?? true;
  }

  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  @Input({ required: false })
  set stringFeatureFlagUpdateOnContextChanged(enabled: boolean | undefined) {
    this._updateOnContextChanged = enabled ?? true;
  }

  /**
   * Template to be displayed when the feature flag does not match value.
   */
  @Input()
  set stringFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<string>>) {
    this._elseTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the feature flag is not ready.
   */
  @Input()
  set stringFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<string>>) {
    this._initializingTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the feature flag is reconciling.
   */
  @Input()
  set stringFeatureFlagReconciling(tpl: TemplateRef<FeatureFlagDirectiveContext<string>>) {
    this._reconcilingTemplateRef = tpl;
  }
}

/**
 * A structural directive that conditionally includes a template based on the evaluation
 * of an object feature flag.
 * When the flag matches the provided value or no expected value is given, Angular renders the template provided
 * in a `then` clause, and when it doesn't match, Angular renders the template provided
 * in an optional `else` clause.
 * The default template for the `else` clause is blank.
 *
 * Usage examples:
 *
 * ```
 * <div *objectFeatureFlag="'flagKey'; default: {}; let value">{{ value }}</div>
 * ```
 * ```
 * <div *objectFeatureFlag="flagKey; default: {}; value: flagValue; else: elseTemplate">Content to render when flag matches value.</div>
 * <ng-template #elseTemplate>Content to render when flag does not match value.</ng-template>
 * ```
 *
 * @usageNotes
 *
 * You can specify templates for other statuses such as initializing and reconciling.
 *
 * ```
 * <div *objectFeatureFlag="flagKey; default: {}; value: flagValue; else: elseTemplate; initializing: initializingTemplate; reconciling: reconcilingTemplate">Content to render when flag matches value.</div>
 * <ng-template #elseTemplate>Content to render when flag does not match value.</ng-template>
 * <ng-template #initializingTemplate>Loading...</ng-template>
 * <ng-template #reconcilingTemplate>Reconfiguring...</ng-template>
 * ```
 *
 */
@Directive({
  standalone: true,
  selector: '[objectFeatureFlag]',
})
export class ObjectFeatureFlagDirective<T extends JsonValue> extends FeatureFlagDirective<T> implements OnChanges {
  override _changeDetectorRef = inject(ChangeDetectorRef);
  override _viewContainerRef = inject(ViewContainerRef);
  override _thenTemplateRef = inject<TemplateRef<FeatureFlagDirectiveContext<T>>>(TemplateRef);

  /**
   * The key of the object feature flag.
   */
  @Input({ required: true }) objectFeatureFlag: string;

  /**
   * The default value for the object feature flag.
   */
  @Input({ required: true }) objectFeatureFlagDefault: T;

  /**
   * The expected value of this object feature flag, for which the `then` template should be rendered.
   */
  @Input({ required: false }) objectFeatureFlagValue?: T;

  constructor() {
    super();
  }

  override ngOnChanges() {
    this._featureFlagKey = this.objectFeatureFlag;
    this._featureFlagDefault = this.objectFeatureFlagDefault;
    this._featureFlagValue = this.objectFeatureFlagValue;
    super.ngOnChanges();
  }

  /**
   * The domain for the object feature flag.
   */
  @Input({ required: false })
  set objectFeatureFlagDomain(domain: string | undefined) {
    super.featureFlagDomain = domain;
  }

  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  @Input({ required: false })
  set objectFeatureFlagUpdateOnConfigurationChanged(enabled: boolean | undefined) {
    this._updateOnConfigurationChanged = enabled ?? true;
  }

  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  @Input({ required: false })
  set objectFeatureFlagUpdateOnContextChanged(enabled: boolean | undefined) {
    this._updateOnContextChanged = enabled ?? true;
  }

  /**
   * Template to be displayed when the feature flag does not match value.
   */
  @Input()
  set objectFeatureFlagElse(tpl: TemplateRef<FeatureFlagDirectiveContext<T>>) {
    this._elseTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the feature flag is not ready.
   */
  @Input()
  set objectFeatureFlagInitializing(tpl: TemplateRef<FeatureFlagDirectiveContext<T>>) {
    this._initializingTemplateRef = tpl;
  }

  /**
   * Template to be displayed when the feature flag is reconciling.
   */
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
