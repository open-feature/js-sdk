import type { ErrorOptions} from './open-feature-error-abstract';
import { OpenFeatureError } from './open-feature-error-abstract';
import { ErrorCode } from '../evaluation';

export class ParseError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    Object.setPrototypeOf(this, ParseError.prototype);
    this.name = 'ParseError';
    this.code = ErrorCode.PARSE_ERROR;
  }
}
