import type { FlagEvaluationOptions } from '@openfeature/web-sdk';

export type SvelteFlagEvaluationOptions = {
  /**
   * Re-evaluate the flag if the provider emits a ConfigurationChanged event.
   * Set to false to prevent effects and templates from updating when flag value changes
   * are received by the associated provider.
   * Defaults to true.
   */
  updateOnConfigurationChanged?: boolean;
  /**
   * Re-evaluate the flag when the OpenFeature evaluation context changes.
   * Set to false to prevent effects and templates from updating when attributes which
   * may be factors in flag evaluation change.
   * Defaults to true.
   */
  updateOnContextChanged?: boolean;
} & FlagEvaluationOptions;

export type NormalizedOptions = Pick<
  SvelteFlagEvaluationOptions,
  'updateOnConfigurationChanged' | 'updateOnContextChanged'
>;
