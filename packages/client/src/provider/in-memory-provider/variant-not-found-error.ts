import { ErrorCode, OpenFeatureError } from '@openfeature/core';

/**
 * A custom error for the in-memory provider.
 * Indicates the resolved or default variant doesn't exist.
 */
export class VariantNotFoundError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, VariantFoundError.prototype);
    this.name = 'VariantNotFoundError';
    this.code = ErrorCode.GENERAL;
  }
}
