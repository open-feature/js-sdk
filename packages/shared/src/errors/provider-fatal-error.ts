import type { ErrorOptions } from './open-feature-error-abstract';
import { OpenFeatureError } from './open-feature-error-abstract';
import { ErrorCode } from '../evaluation';

export class ProviderFatalError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, ProviderFatalError.prototype);
    this.name = 'ProviderFatalError';
    this.code = ErrorCode.PROVIDER_FATAL;
  }
}
