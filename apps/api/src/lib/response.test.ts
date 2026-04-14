import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { describe, it, expect } from 'vitest';
import { ok, error } from './response.ts';

function asStructured(result: unknown): APIGatewayProxyStructuredResultV2 {
  return result as APIGatewayProxyStructuredResultV2;
}

describe('ok', () => {
  it('returns 200 with success: true', () => {
    const result = asStructured(ok('https://bool.pt'));
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body as string)).toEqual({ success: true });
  });

  it('includes CORS headers', () => {
    const result = asStructured(ok('https://bool.pt'));
    const headers = result.headers as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://bool.pt');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('includes data when provided', () => {
    const result = asStructured(ok('https://bool.pt', { id: 42 }));
    expect(JSON.parse(result.body as string)).toEqual({ success: true, data: { id: 42 } });
  });
});

describe('error', () => {
  it('returns specified status code with error message', () => {
    const result = asStructured(error(400, 'Bad request', 'https://bool.pt'));
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body as string)).toEqual({
      success: false,
      error: 'Bad request',
    });
  });

  it('includes CORS headers', () => {
    const result = asStructured(error(500, 'Internal error', 'https://bool.pt'));
    const headers = result.headers as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://bool.pt');
  });

  it('handles undefined origin', () => {
    const result = asStructured(error(400, 'Bad request'));
    const headers = result.headers as Record<string, string>;
    expect(headers['Access-Control-Allow-Origin']).toBe('https://bool.pt');
  });
});
