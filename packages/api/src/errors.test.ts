import { describe, it, expect } from 'vitest';
import { ApiError } from './errors';

describe('ApiError', () => {
  it('creates error with status, body, and operation', () => {
    const error = new ApiError(404, { message: 'Not found' }, 'fetchUser');
    expect(error.message).toBe('fetchUser failed with status 404');
    expect(error.status).toBe(404);
    expect(error.body).toEqual({ message: 'Not found' });
    expect(error.name).toBe('ApiError');
  });

  it('is an instance of Error', () => {
    const error = new ApiError(500, null, 'test');
    expect(error).toBeInstanceOf(Error);
  });
});
