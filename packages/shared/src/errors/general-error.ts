import { ErrorCode } from '../types';
import { OpenFeatureError } from './open-feature-error-abstract';

export class GeneralError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, GeneralError.prototype);
    this.name = 'GeneralError';
    this.code = ErrorCode.GENERAL;
  }
}
