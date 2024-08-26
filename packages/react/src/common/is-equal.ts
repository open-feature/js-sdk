/**
 * Deeply compare two values to determine if they are equal.
 * Supports primitives and serializable objects.
 * @param {unknown} value First value to compare
 * @param {unknown} other Second value to compare
 * @returns {boolean} True if the values are equal
 */
export function isEqual(value: unknown, other: unknown): boolean {
  if (value === other) {
    return true;
  }

  return JSON.stringify(value) === JSON.stringify(other);
}
