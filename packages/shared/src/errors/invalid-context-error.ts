import type { ErrorOptions } from './open-feature-error-abstract';
import { OpenFeatureError } from './open-feature-error-abstract';
import { ErrorCode } from '../evaluation';

export class InvalidContextError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, InvalidContextError.prototype);
    this.name = 'InvalidContextError';
    this.code = ErrorCode.INVALID_CONTEXT;
  }
}
