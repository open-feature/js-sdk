import { ErrorCode } from '../types';
import { OpenFeatureError } from './open-feature-error-abstract';

export class InvalidContextError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, InvalidContextError.prototype);
    this.name = 'InvalidContextError';
    this.code = ErrorCode.INVALID_CONTEXT;
  }
}
