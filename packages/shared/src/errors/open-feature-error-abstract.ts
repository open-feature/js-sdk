import { ErrorCode } from '../types';

export abstract class OpenFeatureError extends Error {
  abstract code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, OpenFeatureError.prototype);
    this.name = 'OpenFeatureError';
  }
}
