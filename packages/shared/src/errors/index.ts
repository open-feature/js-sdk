import { ErrorCode } from '../evaluation';

import { FlagNotFoundError } from './flag-not-found-error';
import { GeneralError } from './general-error';
import { InvalidContextError } from './invalid-context-error';
import { OpenFeatureError } from './open-feature-error-abstract';
import { ParseError } from './parse-error';
import { ProviderFatalError } from './provider-fatal-error';
import { ProviderNotReadyError } from './provider-not-ready-error';
import { TargetingKeyMissingError } from './targeting-key-missing-error';
import { TypeMismatchError } from './type-mismatch-error';

const instantiateErrorByErrorCode = (errorCode: ErrorCode, message?: string): OpenFeatureError => {
  switch (errorCode) {
    case ErrorCode.FLAG_NOT_FOUND:
      return new FlagNotFoundError(message);
    case ErrorCode.PARSE_ERROR:
      return new ParseError(message);
    case ErrorCode.TYPE_MISMATCH:
      return new TypeMismatchError(message);
    case ErrorCode.TARGETING_KEY_MISSING:
      return new TargetingKeyMissingError(message);
    case ErrorCode.INVALID_CONTEXT:
      return new InvalidContextError(message);
    case ErrorCode.PROVIDER_NOT_READY:
      return new ProviderNotReadyError(message);
    case ErrorCode.PROVIDER_FATAL:
      return new ProviderFatalError(message);
    default:
      return new GeneralError(message);
  }
};

export {
  FlagNotFoundError,
  GeneralError,
  InvalidContextError,
  ParseError,
  ProviderFatalError,
  ProviderNotReadyError,
  TargetingKeyMissingError,
  TypeMismatchError,
  OpenFeatureError,
  instantiateErrorByErrorCode,
};
