import { getContext, setContext } from 'svelte';
import type { Client } from '@openfeature/web-sdk';
import type { SvelteFlagEvaluationOptions } from '../options';

const SCOPE_KEY = Symbol('@openfeature/svelte-sdk');

/**
 * The client and default options bound to a component subtree.
 * @internal
 */
export type OpenFeatureScope = {
  client: Client;
  options: SvelteFlagEvaluationOptions;
};

/**
 * Stores the scope in the Svelte context of the current component (must be called during component initialization).
 * @internal
 * @param {OpenFeatureScope} scope scope to bind to the current component subtree
 */
export function setScope(scope: OpenFeatureScope): void {
  setContext(SCOPE_KEY, scope);
}

/**
 * Reads the scope from the Svelte context.
 * Svelte throws when no component context is available, and offers no way to check for it, hence the try/catch.
 * @internal
 * @returns {OpenFeatureScope | undefined} the scope for the current component subtree, if any
 */
export function getScope(): OpenFeatureScope | undefined {
  try {
    return getContext<OpenFeatureScope | undefined>(SCOPE_KEY);
  } catch {
    return undefined;
  }
}

/**
 * Indicates whether Svelte context is currently accessible.
 * @internal
 * @returns {boolean} true if Svelte context can be accessed
 */
export function hasComponentContext(): boolean {
  try {
    getContext(SCOPE_KEY);
    return true;
  } catch {
    return false;
  }
}
