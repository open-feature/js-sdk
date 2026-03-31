import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BooleanFlagKey,
  Client,
  EvaluationDetails,
  type FlagEvaluationOptions,
  FlagValue,
  type JsonValue,
  NumberFlagKey,
  ObjectFlagKey,
  OpenFeature,
  ProviderEvents,
  ProviderStatus,
  StringFlagKey,
} from '@openfeature/web-sdk';
import { isEqual } from './internal/is-equal';

export type AngularFlagEvaluationOptions = {
  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent updating the value when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  updateOnConfigurationChanged?: boolean;
  /**
   * Emit a new value when the OpenFeature context changes.
   * Set to false to prevent updating the value when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  updateOnContextChanged?: boolean;
} & FlagEvaluationOptions;

/**
 * Angular service for evaluating feature flags using OpenFeature.
 *
 * This service provides reactive methods to evaluate feature flags that automatically
 * update when flag values or evaluation context changes. All methods return Observables
 * that emit new values when the underlying flag configuration changes.
 *
 * @example
 * ```typescript
 * @Component({
 *   standalone: true,
 * })
 * export class MyComponent {
 *   private flagService = inject(FeatureFlagService);
 *
 *   // Boolean flag evaluation
 *   isEnabled$ = this.flagService.getBooleanDetails('my-flag', false);
 *
 *   // Using with signals
 *   isEnabledSignal = toSignal(this.isEnabled$);
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  constructor() {}

  /**
   * Evaluates a boolean feature flag and returns an Observable of evaluation details.
   *
   * The returned Observable will emit new values when:
   * - The provider becomes ready (if it wasn't already)
   * - The flag configuration changes (if updateOnConfigurationChanged is true)
   * - The evaluation context changes (if updateOnContextChanged is true)
   *
   * @param flagKey - The key of the feature flag to evaluate
   * @param defaultValue - The default value to return if the flag cannot be evaluated
   * @param domain - Optional domain for the OpenFeature client. If not provided, uses the global client
   * @param options - Optional evaluation options including update behavior configuration
   * @returns Observable that emits EvaluationDetails containing the boolean flag value and metadata
   *
   * @example
   * ```typescript
   * // Basic usage
   * const isFeatureEnabled$ = flagService.getBooleanDetails('feature-toggle', false);
   *
   * // With domain
   * const isDomainFeatureEnabled$ = flagService.getBooleanDetails('feature-toggle', false, 'my-domain');
   *
   * // With options to disable automatic updates
   * const isStaticFeatureEnabled$ = flagService.getBooleanDetails('feature-toggle', false, undefined, {
   *   updateOnConfigurationChanged: false,
   *   updateOnContextChanged: false
   * });
   * ```
   */
  public getBooleanDetails(
    flagKey: BooleanFlagKey,
    defaultValue: boolean,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<boolean>> {
    return this.getFlagDetails<boolean>(flagKey, defaultValue, (client) => client.getBooleanDetails, domain, options);
  }

  /**
   * Evaluates a string feature flag and returns an Observable of evaluation details.
   *
   * The returned Observable will emit new values when:
   * - The provider becomes ready (if it wasn't already)
   * - The flag configuration changes (if updateOnConfigurationChanged is true)
   * - The evaluation context changes (if updateOnContextChanged is true)
   *
   * @param flagKey - The key of the feature flag to evaluate
   * @param defaultValue - The default value to return if the flag cannot be evaluated
   * @param domain - Optional domain for the OpenFeature client. If not provided, uses the global client
   * @param options - Optional evaluation options including update behavior configuration
   * @returns Observable that emits EvaluationDetails containing the string flag value and metadata
   *
   * @example
   * ```typescript
   * // Theme selection
   * const theme$ = flagService.getStringDetails('theme', 'light');
   *
   * // API endpoint selection with domain
   * const apiEndpoint$ = flagService.getStringDetails('api-endpoint', 'https://api.example.com', 'config-domain');
   * ```
   */
  public getStringDetails(
    flagKey: StringFlagKey,
    defaultValue: string,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<string>> {
    return this.getFlagDetails<string>(flagKey, defaultValue, (client) => client.getStringDetails, domain, options);
  }

  /**
   * Evaluates a number feature flag and returns an Observable of evaluation details.
   *
   * The returned Observable will emit new values when:
   * - The provider becomes ready (if it wasn't already)
   * - The flag configuration changes (if updateOnConfigurationChanged is true)
   * - The evaluation context changes (if updateOnContextChanged is true)
   *
   * @param flagKey - The key of the feature flag to evaluate
   * @param defaultValue - The default value to return if the flag cannot be evaluated
   * @param domain - Optional domain for the OpenFeature client. If not provided, uses the global client
   * @param options - Optional evaluation options including update behavior configuration
   * @returns Observable that emits EvaluationDetails containing the number flag value and metadata
   *
   * @example
   * ```typescript
   * // Timeout configuration
   * const timeout$ = flagService.getNumberDetails('request-timeout', 5000);
   * ```
   */
  public getNumberDetails(
    flagKey: NumberFlagKey,
    defaultValue: number,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<number>> {
    return this.getFlagDetails<number>(flagKey, defaultValue, (client) => client.getNumberDetails, domain, options);
  }

  /**
   * Evaluates an object feature flag and returns an Observable of evaluation details.
   *
   * The returned Observable will emit new values when:
   * - The provider becomes ready (if it wasn't already)
   * - The flag configuration changes (if updateOnConfigurationChanged is true)
   * - The evaluation context changes (if updateOnContextChanged is true)
   *
   * @template T - The type of the JSON object, must extend JsonValue
   * @param flagKey - The key of the feature flag to evaluate
   * @param defaultValue - The default value to return if the flag cannot be evaluated
   * @param domain - Optional domain for the OpenFeature client. If not provided, uses the global client
   * @param options - Optional evaluation options including update behavior configuration
   * @returns Observable that emits EvaluationDetails containing the object flag value and metadata
   *
   * @example
   * ```typescript
   * interface FeatureConfig {
   *   maxRetries: number;
   *   retryDelay: number;
   *   enableLogging: boolean;
   * }
   *
   * // Configuration object
   * const defaultConfig: FeatureConfig = {
   *   maxRetries: 3,
   *   retryDelay: 1000,
   *   enableLogging: false
   * };
   *
   * const config$ = flagService.getObjectDetails<FeatureConfig>('api-config', defaultConfig);
   * ```
   */
  public getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: ObjectFlagKey,
    defaultValue: T,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<T>> {
    return this.getFlagDetails<T>(flagKey, defaultValue, (client) => client.getObjectDetails, domain, options);
  }

  private shouldEvaluateFlag(flagKey: string, flagsChanged?: string[]): boolean {
    // if flagsChanged is missing entirely, we don't know what to re-render
    return !flagsChanged || flagsChanged.includes(flagKey);
  }

  private getFlagDetails<T extends FlagValue>(
    flagKey: string,
    defaultValue: T,
    resolver: (
      client: Client,
    ) => (flagKey: string, defaultValue: T, options?: FlagEvaluationOptions) => EvaluationDetails<T>,
    domain: string | undefined,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<T>> {
    const client = domain ? OpenFeature.getClient(domain) : OpenFeature.getClient();

    return new Observable<EvaluationDetails<T>>((subscriber) => {
      let currentResult: EvaluationDetails<T> | undefined = undefined;

      const updateValue = () => {
        const updatedEvaluationDetails = resolver(client).call(client, flagKey, defaultValue, options);
        if (!isEqual(updatedEvaluationDetails, currentResult)) {
          currentResult = updatedEvaluationDetails;
          subscriber.next(currentResult);
        }
      };

      const controller = new AbortController();
      if (client.providerStatus === ProviderStatus.NOT_READY) {
        // update when the provider is ready
        client.addHandler(ProviderEvents.Ready, updateValue, { signal: controller.signal });
      }

      if (options?.updateOnContextChanged ?? true) {
        client.addHandler(ProviderEvents.ContextChanged, updateValue, { signal: controller.signal });
      }

      if (options?.updateOnConfigurationChanged ?? true) {
        client.addHandler(
          ProviderEvents.ConfigurationChanged,
          (eventDetails) => {
            /**
             * Avoid re-rendering if the value hasn't changed. We could expose a means
             * to define a custom comparison function if users require a more
             * sophisticated comparison in the future.
             */
            if (this.shouldEvaluateFlag(flagKey, eventDetails?.flagsChanged)) {
              // update when the provider configuration changes
              updateValue();
            }
          },
          { signal: controller.signal },
        );
      }

      // Initial evaluation
      updateValue();
      return () => {
        controller.abort();
      };
    });
  }
}
