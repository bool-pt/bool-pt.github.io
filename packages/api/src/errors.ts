export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    operation = 'Request'
  ) {
    super(`${operation} failed with status ${status}`);
    this.name = 'ApiError';
  }
}
