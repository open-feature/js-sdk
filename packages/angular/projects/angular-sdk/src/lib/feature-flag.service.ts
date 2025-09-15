import { Injectable, Signal } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Client,
  EvaluationDetails,
  type FlagEvaluationOptions,
  FlagValue,
  type JsonValue,
  OpenFeature,
  ProviderEvents,
  ProviderStatus,
} from '@openfeature/web-sdk';
import { isEqual } from './internal/is-equal';
import { toSignal } from '@angular/core/rxjs-interop';

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

@Injectable({
  providedIn: 'root',
})
export class FeatureFlagService {
  constructor() {}

  public getBooleanDetails(
    flagKey: string,
    defaultValue: boolean,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<boolean>> {
    return this.getFlagDetails<boolean>(flagKey, defaultValue, (client) => client.getBooleanDetails, domain, options);
  }

  public getBooleanDetailsSignal(
    flagKey: string,
    defaultValue: boolean,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Signal<EvaluationDetails<boolean>> {
    return toSignal(this.getBooleanDetails(flagKey, defaultValue, domain, options));
  }

  public getStringDetails(
    flagKey: string,
    defaultValue: string,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<string>> {
    return this.getFlagDetails<string>(flagKey, defaultValue, (client) => client.getStringDetails, domain, options);
  }

  public getStringDetailsSignal(
    flagKey: string,
    defaultValue: string,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Signal<EvaluationDetails<string>> {
    return toSignal(this.getStringDetails(flagKey, defaultValue, domain, options));
  }

  public getNumberDetails(
    flagKey: string,
    defaultValue: number,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<number>> {
    return this.getFlagDetails<number>(flagKey, defaultValue, (client) => client.getNumberDetails, domain, options);
  }

  public getNumberDetailsSignal(
    flagKey: string,
    defaultValue: number,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Signal<EvaluationDetails<number>> {
    return toSignal(this.getNumberDetails(flagKey, defaultValue, domain, options));
  }

  public getObjectDetails<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Observable<EvaluationDetails<T>> {
    return this.getFlagDetails<T>(flagKey, defaultValue, (client) => client.getObjectDetails, domain, options);
  }

  public getObjectDetailsSignal<T extends JsonValue = JsonValue>(
    flagKey: string,
    defaultValue: T,
    domain?: string,
    options?: AngularFlagEvaluationOptions,
  ): Signal<EvaluationDetails<T>> {
    return toSignal(this.getObjectDetails(flagKey, defaultValue, domain, options));
  }

  private shouldEvaluateFlag(flagKey: string, flagsChanged?: string[]): boolean {
    // if flagsChange is missing entirely, we don't know what to re-render
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

      // Initial evaluation
      updateValue();

      const controller = new AbortController();
      if (client.providerStatus === ProviderStatus.NOT_READY) {
        // update when the provider is ready
        client.addHandler(ProviderEvents.Ready, updateValue, { signal: controller.signal });
      }

      if (options?.updateOnContextChanged ?? true) {
        // update when the context changes
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
      return () => {
        controller.abort();
      };
    });
  }
}
