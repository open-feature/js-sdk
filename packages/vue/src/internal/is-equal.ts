export function isEqual(value: unknown, other: unknown): boolean {
  if (value === other) {
    return true;
  }

  if (typeof value !== typeof other) {
    return false;
  }

  if (typeof value === 'object' && value !== null && typeof other === 'object' && other !== null) {
    if (Array.isArray(value) !== Array.isArray(other)) {
      return false;
    }

    const valueRecord = value as Record<string, unknown>;
    const otherRecord = other as Record<string, unknown>;
    const valueKeys = Object.keys(valueRecord);
    const otherKeys = Object.keys(otherRecord);

    if (valueKeys.length !== otherKeys.length) {
      return false;
    }

    return valueKeys.every((key) => isEqual(valueRecord[key], otherRecord[key]));
  }

  return false;
}
