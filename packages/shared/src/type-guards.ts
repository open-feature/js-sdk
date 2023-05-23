export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function stringOrUndefined(value: unknown): string | undefined {
  return isString(value) ? value : undefined;
}

export function isObject<T extends object>(value: unknown): value is T {
  return typeof value === 'object';
}

export function objectOrUndefined<T extends object>(value: unknown): T | undefined {
  return isObject<T>(value) ? value : undefined;
}
