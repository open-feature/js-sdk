import { ErrorCode } from '../types';
import { OpenFeatureError } from './open-feature-error-abstract';

export class TypeMismatchError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, TypeMismatchError.prototype);
    this.name = 'TypeMismatchError';
    this.code = ErrorCode.TYPE_MISMATCH;
  }
}
