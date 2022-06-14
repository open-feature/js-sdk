import { ErrorCode } from '../src/errors/codes.js';
import { FlagNotFoundError } from '../src/errors/flag-not-found-error.js';
import { ParseError } from '../src/errors/parse-error.js';
import { TypeMismatchError } from '../src/errors/type-mismatch-error';

describe('Errors', () => {
  it('FlagNotFoundError', () => {
    const error = new FlagNotFoundError('message');
    expect(error.message).toBe('message');
    expect(error.code).toBe(ErrorCode.FLAG_NOT_FOUND);
    expect(error.name).toBe('FlagNotFoundError');
    expect(error instanceof FlagNotFoundError).toBe(true);
  });

  it('TypeMismatchError', () => {
    const error = new TypeMismatchError('message');
    expect(error.message).toBe('message');
    expect(error.code).toBe(ErrorCode.TYPE_MISMATCH);
    expect(error.name).toBe('TypeMismatchError');
    expect(error instanceof TypeMismatchError).toBe(true);
  });

  it('ParseError', () => {
    const error = new ParseError('message');
    expect(error.message).toBe('message');
    expect(error.code).toBe(ErrorCode.PARSE_ERROR);
    expect(error.name).toBe('ParseError');
    expect(error instanceof ParseError).toBe(true);
  });
});
