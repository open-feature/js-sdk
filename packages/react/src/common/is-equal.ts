import { type FlagValue } from '@openfeature/web-sdk';

/**
 * Deeply compare two values to determine if they are equal.
 * Supports primitives and serializable objects.
 * @param {FlagValue} value First value to compare
 * @param {FlagValue} other Second value to compare
 * @returns {boolean} True if the values are equal
 */
export function isEqual(value: FlagValue, other: FlagValue): boolean {
  if (value === other) {
    return true;
  }

  if (typeof value !== typeof other) {
    return false;
  }

  if (typeof value === 'object' && value !== null && other !== null) {
    const valueKeys = Object.keys(value as object);
    const otherKeys = Object.keys(other as object);

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
