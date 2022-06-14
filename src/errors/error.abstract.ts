import type { ErrorCode } from './codes'

export abstract class OpenFeatureError extends Error {
  abstract code: ErrorCode
}
