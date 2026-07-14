export type DataErrorCode =
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'

export class DataError extends Error {
  constructor(
    public readonly code: DataErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'DataError'
  }
}
