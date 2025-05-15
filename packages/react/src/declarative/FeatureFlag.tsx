import React from 'react';
import { useFlag } from '../evaluation';
import type { FlagQuery } from '../query';

/**
 * Props for the Feature component that conditionally renders content based on feature flag state.
 * @interface FeatureProps
 */
interface FeatureProps {
  /**
   * The key of the feature flag to evaluate.
   */
  featureKey: string;

  /**
   * Optional value to match against the feature flag value.
   * If provided, the component will only render children when the flag value matches this value.
   * If a boolean, it will check if the flag is enabled (true) or disabled (false).
   * If a string, it will check if the flag variant equals this string.
   */
  match?: string | boolean;

  /**
   * Default value to use when the feature flag is not found.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultValue: any;

  /**
   * Content to render when the feature flag condition is met.
   * Can be a React node or a function that receives flag query details and returns a React node.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: React.ReactNode | ((details: FlagQuery<any>) => React.ReactNode);

  /**
   * Optional content to render when the feature flag condition is not met.
   */
  fallback?: React.ReactNode;

  /**
   * If true, inverts the condition logic (renders children when condition is NOT met).
   */
  negate?: boolean;
}

/**
 * FeatureFlag component that conditionally renders its children based on the evaluation of a feature flag.
 *
 * @param {FeatureProps} props The properties for the FeatureFlag component.
 * @returns {React.ReactElement | null} The rendered component or null if the feature is not enabled.
 */
export function FeatureFlag({
  featureKey,
  match,
  negate = false,
  defaultValue = true,
  children,
  fallback = null,
}: FeatureProps): React.ReactElement | null {
  const details = useFlag(featureKey, defaultValue, {
    updateOnContextChanged: true,
  });

  // If the flag evaluation failed, we render the fallback
  if (details.reason === 'ERROR') {
    return <>{fallback}</>;
  }

  let isMatch = false;
  if (typeof match === 'string') {
    isMatch = details.variant === match;
  } else if (typeof match !== 'undefined') {
    isMatch = details.value === match;
  }

  // If match is undefined, we assume the flag is enabled
  if (match === void 0) {
    isMatch = true;
  }

  const shouldRender = negate ? !isMatch : isMatch;

  if (shouldRender) {
    console.log('chop chop');
    const childNode: React.ReactNode = typeof children === 'function' ? children(details) : children;
    return <>{childNode}</>;
  }

  return <>{fallback}</>;
}
