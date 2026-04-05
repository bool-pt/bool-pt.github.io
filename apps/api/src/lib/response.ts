import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { getCorsHeaders } from './cors.ts';

function json(statusCode: number, body: unknown, origin?: string): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(origin),
    },
    body: JSON.stringify(body),
  };
}

export function ok(origin?: string, data?: unknown): APIGatewayProxyResultV2 {
  return json(200, { success: true, ...(data !== undefined && { data }) }, origin);
}

export function error(
  statusCode: number,
  message: string,
  origin?: string,
): APIGatewayProxyResultV2 {
  return json(statusCode, { success: false, error: message }, origin);
}
