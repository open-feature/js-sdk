import type { FlagEvaluationOptions } from '@openfeature/web-sdk';

export type ReactFlagEvaluationOptions = (
  | {
      /**
       * Enable or disable all suspense functionality.
       * Cannot be used in conjunction with `suspendUntilReady` and `suspendWhileReconciling` options.
       * @experimental Suspense is an experimental feature subject to change in future versions.
       */
      suspend?: boolean;
      suspendUntilReady?: never;
      suspendWhileReconciling?: never;
    }
  | {
      /**
       * Suspend flag evaluations while the provider is not ready.
       * Set to false if you don't want to show suspense fallbacks until the provider is initialized.
       * Defaults to false.
       * Cannot be used in conjunction with `suspend` option.
       * @experimental Suspense is an experimental feature subject to change in future versions.
       */
      suspendUntilReady?: boolean;
      /**
       * Suspend flag evaluations while the provider's context is being reconciled.
       * Set to true if you want to show suspense fallbacks while flags are re-evaluated after context changes.
       * Defaults to false.
       * Cannot be used in conjunction with `suspend` option.
       * @experimental Suspense is an experimental feature subject to change in future versions.
       */
      suspendWhileReconciling?: boolean;
      suspend?: never;
    }
) & {
  /**
   * Update the component if the provider emits a ConfigurationChanged event.
   * Set to false to prevent components from re-rendering when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  updateOnConfigurationChanged?: boolean;
  /**
   * Update the component when the OpenFeature context changes.
   * Set to false to prevent components from re-rendering when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  updateOnContextChanged?: boolean;
} & FlagEvaluationOptions;

// suspense options removed for the useSuspenseFlag hooks
export type ReactFlagEvaluationNoSuspenseOptions = Omit<ReactFlagEvaluationOptions, 'suspend' | 'suspendUntilReady' | 'suspendWhileReconciling'>;

export type NormalizedOptions = Omit<ReactFlagEvaluationOptions, 'suspend'>;
