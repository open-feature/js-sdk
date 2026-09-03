import type { EvaluationContext, EvaluationContextValue } from '@openfeature/web-sdk';

/**
 * Deep-copies an evaluation context so that in-place mutations of the copy never affect the original.
 * Supports the value types allowed in an {@link EvaluationContext}: primitives, dates, arrays and nested objects.
 * @internal
 * @param {EvaluationContext} context context to copy
 * @returns {EvaluationContext} independent copy of the context
 */
export function cloneContext(context: EvaluationContext): EvaluationContext {
  return cloneValue(context) as EvaluationContext;
}

function cloneValue(value: EvaluationContextValue): EvaluationContextValue {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }
  if (Array.isArray(value)) {
    return value.map(cloneValue);
  }
  if (typeof value === 'object' && value !== null) {
    const copy: { [key: string]: EvaluationContextValue } = {};
    for (const key of Object.keys(value)) {
      // define an own property so that keys like "__proto__" are copied as data, not treated as the prototype
      Object.defineProperty(copy, key, {
        value: cloneValue(value[key]),
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return copy;
  }
  return value;
}
