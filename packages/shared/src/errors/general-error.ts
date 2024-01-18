import { OpenFeatureError } from './open-feature-error-abstract';
import { ErrorCode } from '../evaluation';

export class GeneralError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, GeneralError.prototype);
    this.name = 'GeneralError';
    this.code = ErrorCode.GENERAL;
  }
}
