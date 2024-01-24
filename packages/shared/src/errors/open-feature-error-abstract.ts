import { ErrorCode } from '../evaluation';

export abstract class OpenFeatureError extends Error {
  abstract code: ErrorCode;
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, OpenFeatureError.prototype);
    this.name = 'OpenFeatureError';
  }
}
