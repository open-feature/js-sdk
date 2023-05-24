/**
 * Checks whether the parameter is a string.
 * @param {unknown} value The value to check
 * @returns {value is string} True if the value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Returns the parameter if it is a string, otherwise returns undefined.
 * @param {unknown} value The value to check
 * @returns {string|undefined} The parameter if it is a string, otherwise undefined
 */
export function stringOrUndefined(value: unknown): string | undefined {
  return isString(value) ? value : undefined;
}

/**
 * Checks whether the parameter is an object.
 * @param {unknown} value The value to check
 * @returns {value is string} True if the value is an object
 */
export function isObject<T extends object>(value: unknown): value is T {
  return typeof value === 'object';
}

/**
 * Returns the parameter if it is an object, otherwise returns undefined.
 * @param {unknown} value The value to check
 * @returns {object|undefined} The parameter if it is an object, otherwise undefined
 */
export function objectOrUndefined<T extends object>(value: unknown): T | undefined {
  return isObject<T>(value) ? value : undefined;
}
