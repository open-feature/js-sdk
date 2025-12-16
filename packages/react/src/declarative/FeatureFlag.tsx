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
   * Optional value to match against the feature flag value.
   * If provided, the component will only render children when the flag value matches this value.
   * By default, strict equality (===) is used for comparison.
   * If a boolean, it will check if the flag is enabled (true) or disabled (false).
   * If a string, it will check if the flag variant equals this string.
   */
  match?: T;

  /**
   * Optional predicate function for custom matching logic.
   * If provided, this function will be used instead of the default equality check.
   * @param expected The expected value (from match prop)
   * @param actual The evaluation details
   * @returns true if the condition is met, false otherwise
   */
  predicate?: (expected: T | undefined, actual: EvaluationDetails<T>) => boolean;

  /**
   * Default value to use when the feature flag is not found.
   */
  defaultValue: T;

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
/**
 * @experimental This API is experimental, and is subject to change.
 *
 * FeatureFlag component that conditionally renders its children based on the evaluation of a feature flag.
 * @param {FeatureFlagProps} props The properties for the FeatureFlag component.
 * @returns {React.ReactElement | null} The rendered component or null if the feature is not enabled.
 */
export function FeatureFlag<T extends FlagValue = FlagValue>({
  flagKey,
  match,
  predicate,
  defaultValue,
  children,
  fallback = null,
}: FeatureFlagProps<T>): React.ReactElement | null {
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
    shouldRender = predicate(match, details.details as EvaluationDetails<T>);
  } else if (match !== undefined) {
    // Default behavior: check if match value equals flag value
    shouldRender = equals(match, details.details as EvaluationDetails<T>);
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
