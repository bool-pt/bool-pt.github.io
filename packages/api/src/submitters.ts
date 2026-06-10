import type { APIResponse } from '@bool/shared';
import { apiFetch } from './client';
import { ApiError } from './errors';

function getApiBaseUrl(): string {
  const url = import.meta.env.PUBLIC_API_BASE_URL;
  if (!url) throw new Error('Missing PUBLIC_API_BASE_URL environment variable');
  return url.replace(/\/+$/, '');
}

export async function post(
  path: string,
  body: Record<string, unknown>,
  operation: string
): Promise<APIResponse> {
  try {
    return await apiFetch<APIResponse>(`${getApiBaseUrl()}${path}`, { method: 'POST', body });
  } catch (err) {
    if (err instanceof ApiError) {
      throw new ApiError(err.status, err.body, operation);
    }
    throw err;
  }
}
