import { ErrorCode, OpenFeatureError } from '@openfeature/core';

/**
 * A custom error for the in-memory provider.
 * Indicates the resolved or default variant doesn't exist.
 */
export class VariantFoundError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, VariantFoundError.prototype);
    this.name = 'VariantFoundError';
    this.code = ErrorCode.GENERAL;
  }
}
