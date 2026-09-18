import { createSubscriber } from 'svelte/reactivity';
import type { Client, EvaluationDetails, FlagEvaluationOptions, FlagValue } from '@openfeature/web-sdk';
import { ProviderEvents } from '@openfeature/web-sdk';
import type { NormalizedOptions, SvelteFlagEvaluationOptions } from '../options';
import { isEqual } from './is-equal';

/**
 * Selects the client method used to resolve a flag of a given type.
 * @internal
 */
export type EvaluationResolver<T extends FlagValue> = (
  client: Client,
) => (flagKey: string, defaultValue: T, options?: FlagEvaluationOptions) => EvaluationDetails<T>;

/**
 * Evaluation details which re-evaluate on provider readiness, context changes and configuration changes.
 * Reading a property inside a template, `$derived` or `$effect` registers a dependency; client event handlers
 * are attached only while such dependencies exist. Outside of effects, reads re-evaluate the flag.
 * @internal
 */
export class ReactiveEvaluationDetails<T extends FlagValue> implements EvaluationDetails<T> {
  private current: EvaluationDetails<T>;
  // true while event handlers keep `current` up to date (createSubscriber detaches them in a microtask after the last effect is destroyed)
  private listening = false;
  private readonly subscribe: () => void;

  constructor(
    private readonly client: Client,
    readonly flagKey: string,
    private readonly defaultValue: T,
    private readonly resolver: EvaluationResolver<T>,
    private readonly options: SvelteFlagEvaluationOptions | undefined,
    updateOptions: Required<NormalizedOptions>,
  ) {
    this.current = this.evaluate();

    this.subscribe = createSubscriber((update) => {
      const controller = new AbortController();
      const signal = controller.signal;
      // the subscribing effect is still running while handlers are attached, so it reads any refreshed value itself
      let starting = true;
      const refresh = () => {
        if (this.refresh() && !starting) {
          update();
        }
      };

      this.listening = true;
      // the client runs the Ready handler immediately if the provider is already ready,
      // which catches anything that changed between construction and subscription
      client.addHandler(ProviderEvents.Ready, refresh, { signal });

      if (updateOptions.updateOnContextChanged) {
        client.addHandler(ProviderEvents.ContextChanged, refresh, { signal });
      }

      if (updateOptions.updateOnConfigurationChanged) {
        client.addHandler(
          ProviderEvents.ConfigurationChanged,
          (eventDetails) => {
            // without a flagsChanged list we can't tell what changed, so re-evaluate
            if (!eventDetails?.flagsChanged || eventDetails.flagsChanged.includes(this.flagKey)) {
              refresh();
            }
          },
          { signal },
        );
      }

      starting = false;

      return () => {
        controller.abort();
        this.listening = false;
      };
    });
  }

  get details(): EvaluationDetails<T> {
    this.subscribe();
    if (!this.listening) {
      this.refresh();
    }
    return this.current;
  }

  get value(): T {
    return this.details.value;
  }

  get variant() {
    return this.details.variant;
  }

  get reason() {
    return this.details.reason;
  }

  get errorCode() {
    return this.details.errorCode;
  }

  get errorMessage() {
    return this.details.errorMessage;
  }

  get flagMetadata() {
    return this.details.flagMetadata;
  }

  private evaluate(): EvaluationDetails<T> {
    return this.resolver(this.client).call(this.client, this.flagKey, this.defaultValue, this.options);
  }

  // re-evaluates the flag, returning true if the details changed
  private refresh(): boolean {
    const next = this.evaluate();
    if (isEqual(next, this.current)) {
      return false;
    }
    this.current = next;
    return true;
  }
}
