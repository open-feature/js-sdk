import { OpenFeatureError } from './error-abstract';
import { ErrorCode } from './codes';

export class TypeMismatchError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, TypeMismatchError.prototype);
    this.name = 'TypeMismatchError';
    this.code = ErrorCode.TYPE_MISMATCH;
  }
}
