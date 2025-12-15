import type { ErrorCode } from '../evaluation';

/**
 * Error Options were added in ES2022. Manually adding the type so that an
 * earlier target can be used.
 */
export type ErrorOptions = {
  cause?: unknown;
};

export abstract class OpenFeatureError extends Error {
  abstract code: ErrorCode;
  cause?: unknown;
  constructor(message?: string, options?: ErrorOptions) {
    super(message);
    Object.setPrototypeOf(this, OpenFeatureError.prototype);
    this.name = 'OpenFeatureError';
    this.cause = options?.cause;
  }
}
