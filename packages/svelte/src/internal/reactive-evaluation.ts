import { createSubscriber } from 'svelte/reactivity';
import type { Client, EvaluationDetails, FlagEvaluationOptions, FlagValue } from '@openfeature/web-sdk';
import { ProviderEvents, ProviderStatus } from '@openfeature/web-sdk';
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
 * Reading `details` inside a template, `$derived` or `$effect` registers a dependency; client event handlers
 * are attached only while such dependencies exist. Outside of effects, reads re-evaluate the flag.
 * @internal
 */
export class ReactiveEvaluationDetails<T extends FlagValue> {
  // evaluated lazily on first read, so an unread flag never runs hooks and the first read evaluates once
  private current: EvaluationDetails<T> | undefined;
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
      // evaluate now, catching anything that changed since the last subscription:
      // the client runs the Ready handler immediately if the provider is ready, otherwise evaluate here
      client.addHandler(ProviderEvents.Ready, refresh, { signal });
      if (client.providerStatus !== ProviderStatus.READY) {
        this.refresh();
      }

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
    if (!this.listening || !this.current) {
      this.refresh();
    }
    return this.current as EvaluationDetails<T>;
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

/**
 * Exposes reactive evaluation details as a plain object with enumerable getters,
 * so it spreads, serializes and compares like the details returned by the client.
 * Each getter reads the flag separately; serializing reads it once.
 * @param {ReactiveEvaluationDetails} reactive the reactive evaluation to expose
 * @returns {EvaluationDetails} evaluation details reading through to the reactive evaluation
 * @internal
 */
export function toEvaluationDetails<T extends FlagValue>(reactive: ReactiveEvaluationDetails<T>): EvaluationDetails<T> {
  const details: EvaluationDetails<T> = {
    flagKey: reactive.flagKey,
    get value() {
      return reactive.details.value;
    },
    get variant() {
      return reactive.details.variant;
    },
    get reason() {
      return reactive.details.reason;
    },
    get errorCode() {
      return reactive.details.errorCode;
    },
    get errorMessage() {
      return reactive.details.errorMessage;
    },
    get flagMetadata() {
      return reactive.details.flagMetadata;
    },
  };
  // non-enumerable, so it doesn't show up when spreading or comparing
  Object.defineProperty(details, 'toJSON', { value: () => reactive.details });
  return details;
}
