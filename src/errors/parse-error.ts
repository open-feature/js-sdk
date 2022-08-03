import { OpenFeatureError } from './error-abstract';
import { ErrorCode } from './codes';

export class ParseError extends OpenFeatureError {
  code: ErrorCode;
  constructor(message?: string) {
    super(message);
    Object.setPrototypeOf(this, ParseError.prototype);
    this.name = 'ParseError';
    this.code = ErrorCode.PARSE_ERROR;
  }
}
