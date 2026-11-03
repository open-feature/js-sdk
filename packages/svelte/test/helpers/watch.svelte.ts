import { flushSync } from 'svelte';

/**
 * Runs `read` inside a root effect and records every value it produces.
 * The effect re-runs whenever a reactive dependency read by `read` changes,
 * which is exactly what a template or `$derived` would do.
 * @param {Function} read function reading reactive values
 * @returns {object} recorded values and a function to destroy the effect
 */
export function watch<T>(read: () => T): { readonly values: T[]; stop: () => void } {
  const values: T[] = [];
  const stop = $effect.root(() => {
    $effect(() => {
      values.push(read());
    });
  });
  flushSync();
  return { values, stop };
}

/**
 * Flushes pending effects synchronously.
 */
export function flush(): void {
  flushSync();
}
