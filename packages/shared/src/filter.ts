/**
 * Checks if a value is not null or undefined and returns it as type assertion
 * @template T
 * @param {T} input The value to check
 * @returns {T} If the value is not null or undefined
 */
export function isDefined<T>(input?: T | null | undefined): input is T {
  return typeof input !== 'undefined' && input !== null;
}
