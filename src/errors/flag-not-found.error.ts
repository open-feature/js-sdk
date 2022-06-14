import { OpenFeatureError } from './error.abstract'
import { ErrorCode } from './codes'

export class FlagNotFoundError extends OpenFeatureError {
  code: ErrorCode
  constructor(message?: string) {
    super(message)
    Object.setPrototypeOf(this, FlagNotFoundError.prototype)
    this.code = ErrorCode.FLAG_NOT_FOUND
  }
}
