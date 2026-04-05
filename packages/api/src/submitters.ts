import type { APIResponse } from '@bool/shared';
import { apiFetch } from './client';
import { ApiError } from './errors';

export function createSubmitter<T>(getUrl: () => string, operation: string) {
  return async (data: T): Promise<APIResponse> => {
    const url = getUrl();

    try {
      return await apiFetch<APIResponse>(url, { method: 'POST', body: data });
    } catch (err) {
      if (err instanceof ApiError) {
        throw new ApiError(err.status, err.body, operation);
      }
      throw err;
    }
  };
}
