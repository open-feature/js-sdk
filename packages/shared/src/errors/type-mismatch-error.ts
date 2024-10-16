import type { ErrorOptions} from './open-feature-error-abstract';
import { OpenFeatureError } from './open-feature-error-abstract';
import { ErrorCode } from '../evaluation';

export class TypeMismatchError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, TypeMismatchError.prototype);
    this.name = 'TypeMismatchError';
    this.code = ErrorCode.TYPE_MISMATCH;
  }
}
