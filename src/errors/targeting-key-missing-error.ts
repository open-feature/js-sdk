import { ErrorCode } from '../types';
import { OpenFeatureError } from './open-feature-error-abstract';

export class TargetingKeyMissingError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, TargetingKeyMissingError.prototype);
    this.name = 'TargetingKeyMissingError';
    this.code = ErrorCode.TARGETING_KEY_MISSING;
  }
}
