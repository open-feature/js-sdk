import React from 'react';
import { useFlag } from '../evaluation';
import type { FlagQuery } from '../query';
import type { FlagValue, EvaluationDetails } from '@openfeature/core';
import { isEqual } from '../internal';

/**
 * Default predicate function that checks if the expected value equals the actual flag value.
 * @param {T} expected The expected value to match against
 * @param {EvaluationDetails<T>} actual The evaluation details containing the actual flag value
 * @returns {boolean} true if the values match, false otherwise
 */
function equals<T extends FlagValue>(expected: T, actual: EvaluationDetails<T>): boolean {
  return isEqual(expected, actual.value);
}

/**
 * Props for the FeatureFlag component that conditionally renders content based on feature flag state.
 * @interface FeatureFlagProps
 */
interface FeatureFlagProps<T extends FlagValue = FlagValue> {
  /**
   * The key of the feature flag to evaluate.
   */
  flagKey: string;

  /**
   * Optional predicate function for custom matching logic.
   * If provided, this function will be used instead of the default equality check.
   * @param matchValue The value to match (matchValue prop)
   * @param details The evaluation details
   * @returns true if the condition is met, false otherwise
   */
  predicate?: (matchValue: T | undefined, details: EvaluationDetails<T>) => boolean;

  /**
   * Content to render when the feature flag condition is met.
   * Can be a React node or a function that receives flag query details and returns a React node.
   */
  children: React.ReactNode | ((details: FlagQuery<T>) => React.ReactNode);

  /**
   * Optional content to render when the feature flag condition is not met.
   * Can be a React node or a function that receives evaluation details and returns a React node.
   */
  fallback?: React.ReactNode | ((details: EvaluationDetails<T>) => React.ReactNode);
}

/**
 * Configuration for matching flag values.
 * For boolean flags, `match` is optional (defaults to checking truthiness).
 * For non-boolean flags (string, number, object), `match` is required to determine when to render.
 */
type FeatureFlagMatchConfig<T extends FlagValue> = {
  /**
   * Default value to use when the feature flag is not found.
   */
  defaultValue: T;
} & (T extends boolean
  ? {
      /**
       * Optional value to match against the feature flag value.
       */
      matchValue?: T | undefined;
    }
  : {
      /**
       * Value to match against the feature flag value.
       * Required for non-boolean flags to determine when children should render.
       * By default, strict equality is used for comparison.
       */
      matchValue: T;
    });

type FeatureFlagComponentProps<T extends FlagValue> = FeatureFlagProps<T> & FeatureFlagMatchConfig<T>;

/**
 * @experimental This API is experimental, and is subject to change.
 * FeatureFlag component that conditionally renders its children based on the evaluation of a feature flag.
 * @param {FeatureFlagComponentProps} props The properties for the FeatureFlag component.
 * @returns {React.ReactElement | null} The rendered component or null if the feature is not enabled.
 */
export function FeatureFlag<T extends FlagValue = FlagValue>({
  flagKey,
  matchValue,
  predicate,
  defaultValue,
  children,
  fallback = null,
}: FeatureFlagComponentProps<T>): React.ReactElement | null {
  const details = useFlag(flagKey, defaultValue, {
    updateOnContextChanged: true,
  });

  // If the flag evaluation failed, we render the fallback
  if (details.reason === 'ERROR') {
    const fallbackNode: React.ReactNode =
      typeof fallback === 'function' ? fallback(details.details as EvaluationDetails<T>) : fallback;
    return <>{fallbackNode}</>;
  }

  // Use custom predicate if provided, otherwise use default matching logic
  let shouldRender = false;
  if (predicate) {
    shouldRender = predicate(matchValue as T, details.details as EvaluationDetails<T>);
  } else if (matchValue !== undefined) {
    // Default behavior: check if match value equals flag value
    shouldRender = equals(matchValue, details.details as EvaluationDetails<T>);
  } else if (details.type === 'boolean') {
    // If no match value is provided, render if flag is truthy
    shouldRender = Boolean(details.value);
  } else {
    shouldRender = false;
  }

  if (shouldRender) {
    const childNode: React.ReactNode = typeof children === 'function' ? children(details as FlagQuery<T>) : children;
    return <>{childNode}</>;
  }

  const fallbackNode: React.ReactNode =
    typeof fallback === 'function' ? fallback(details.details as EvaluationDetails<T>) : fallback;
  return <>{fallbackNode}</>;
}
