/**
 * Pre-configured strategy exports for the server SDK.
 * These classes extend the base strategies from @openfeature/core with the
 * server-specific ProviderStatus enum already bound.
 */
import {
  BaseFirstMatchStrategy,
  BaseFirstSuccessfulStrategy,
  BaseComparisonStrategy,
  type BaseStrategyProviderContext,
  type BaseStrategyPerProviderContext,
  type BaseProviderResolutionResult,
  type BaseProviderResolutionSuccessResult,
  type BaseProviderResolutionErrorResult,
  type BaseFinalResult,
  type StrategyEvaluationContext,
  type FlagValue,
} from '@openfeature/core';
import type { Provider } from '../provider';
import { ProviderStatus } from '../provider';

/**
 * Pre-bound type aliases for server SDK.
 * These types have the server-specific ProviderStatus and Provider types already applied,
 * providing backward compatibility for existing consumers.
 */
export type StrategyProviderContext = BaseStrategyProviderContext<ProviderStatus, Provider>;
export type StrategyPerProviderContext = BaseStrategyPerProviderContext<ProviderStatus, Provider>;
export type ProviderResolutionResult<T extends FlagValue> = BaseProviderResolutionResult<T, ProviderStatus, Provider>;
export type ProviderResolutionSuccessResult<T extends FlagValue> = BaseProviderResolutionSuccessResult<
  T,
  ProviderStatus,
  Provider
>;
export type ProviderResolutionErrorResult = BaseProviderResolutionErrorResult<ProviderStatus, Provider>;
export type FinalResult<T extends FlagValue> = BaseFinalResult<T, ProviderStatus, Provider>;
export type { StrategyEvaluationContext };

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
  constructor(fallbackProvider: Provider, onMismatch?: (resolutions: ProviderResolutionResult<FlagValue>[]) => void) {
    super(ProviderStatus, fallbackProvider, onMismatch);
  }
}
