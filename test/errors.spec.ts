import { GeneralError, ParseError, FlagNotFoundError, TypeMismatchError, TargetingKeyMissingError, InvalidContextError } from '../src/errors';
import { ErrorCode } from '../src/types';

describe('Errors', () => {
  it('GeneralError', () => {
    const error = new GeneralError('message');
    expect(error.message).toBe('message');
    expect(error.code).toBe(ErrorCode.GENERAL);
    expect(error.name).toBe('GeneralError');
    expect(error instanceof GeneralError).toBe(true);
  });

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

  it('TargetingKeyMissingError', () => {
    const error = new TargetingKeyMissingError('message');
    expect(error.message).toBe('message');
    expect(error.code).toBe(ErrorCode.TARGETING_KEY_MISSING);
    expect(error.name).toBe('TargetingKeyMissingError');
    expect(error instanceof TargetingKeyMissingError).toBe(true);
  });

  it('InvalidContextError', () => {
    const error = new InvalidContextError('message');
    expect(error.message).toBe('message');
    expect(error.code).toBe(ErrorCode.INVALID_CONTEXT);
    expect(error.name).toBe('InvalidContextError');
    expect(error instanceof InvalidContextError).toBe(true);
  });
});
