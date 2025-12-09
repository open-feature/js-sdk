/**
 * Deeply compare two values to determine if they are equal.
 * Supports primitives and serializable objects.
 *
 * Note: Does not handle Date, RegExp, Map, Set, or circular references.
 * Suitable for comparing EvaluationDetails and other JSON-serializable data.
 * @param {unknown} value First value to compare
 * @param {unknown} other Second value to compare
 * @returns {boolean} True if the values are equal
 */
export function isEqual(value: unknown, other: unknown): boolean {
  if (value === other) {
    return true;
  }

  if (typeof value !== typeof other) {
    return false;
  }

  if (typeof value === 'object' && value !== null && typeof other === 'object' && other !== null) {
    const valueKeys = Object.keys(value);
    const otherKeys = Object.keys(other);

    if (valueKeys.length !== otherKeys.length) {
      return false;
    }

    for (const key of valueKeys) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (!isEqual((value as any)[key], (other as any)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}
