/**
 * Pre-configured strategy exports for the web SDK.
 * These classes extend the base strategies from @openfeature/core with the
 * web-specific ProviderStatus enum already bound.
 */
import {
  BaseFirstMatchStrategy,
  BaseFirstSuccessfulStrategy,
  BaseComparisonStrategy,
  type ProviderResolutionResult,
  type FlagValue,
} from '@openfeature/core';
import type { Provider } from '../provider';
import { ProviderStatus } from '../provider';

/**
 * Evaluates providers in order and returns the first successful result.
 * Providers that return FLAG_NOT_FOUND are skipped. Any other error stops evaluation.
 */
export class FirstMatchStrategy extends BaseFirstMatchStrategy<ProviderStatus, Provider> {
  constructor() {
    super(ProviderStatus);
  }
}

/**
 * Evaluates providers in order and returns the first successful result.
 * Any error causes that provider to be skipped.
 */
export class FirstSuccessfulStrategy extends BaseFirstSuccessfulStrategy<ProviderStatus, Provider> {
  constructor() {
    super(ProviderStatus);
  }
}

/**
 * Evaluates all providers in parallel and compares results.
 * If all providers agree, returns that result. Otherwise, returns the fallback provider's result.
 */
export class ComparisonStrategy extends BaseComparisonStrategy<ProviderStatus, Provider> {
  constructor(
    fallbackProvider: Provider,
    onMismatch?: (resolutions: ProviderResolutionResult<FlagValue, ProviderStatus, Provider>[]) => void,
  ) {
    super(ProviderStatus, fallbackProvider, onMismatch);
  }
}
