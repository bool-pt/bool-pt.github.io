import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseAndValidate, getOrigin } from './validate.ts';

const testSchema = z.object({
  name: z.string().min(1),
  age: z.number(),
});

function makeEvent(body?: string, origin?: string): APIGatewayProxyEventV2 {
  return {
    body,
    headers: { ...(origin && { origin }) },
    requestContext: { http: { sourceIp: '127.0.0.1' } },
  } as unknown as APIGatewayProxyEventV2;
}

describe('parseAndValidate', () => {
  it('returns parsed data on valid input', () => {
    const event = makeEvent(JSON.stringify({ name: 'John', age: 30 }));
    const result = parseAndValidate(event, testSchema);
    expect(result).toEqual({ success: true, data: { name: 'John', age: 30 } });
  });

  it('returns error when body is missing', () => {
    const event = makeEvent(undefined);
    const result = parseAndValidate(event, testSchema);
    expect(result).toEqual({ success: false, error: 'Request body is required' });
  });

  it('returns error on invalid JSON', () => {
    const event = makeEvent('not json');
    const result = parseAndValidate(event, testSchema);
    expect(result).toEqual({ success: false, error: 'Invalid JSON in request body' });
  });

  it('returns error when body exceeds size limit', () => {
    const event = makeEvent('{"name":"' + 'A'.repeat(70_000) + '","age":1}');
    const result = parseAndValidate(event, testSchema);
    expect(result).toEqual({ success: false, error: 'Request body too large' });
  });

  it('returns validation errors on schema mismatch', () => {
    const event = makeEvent(JSON.stringify({ name: '', age: 'not-a-number' }));
    const result = parseAndValidate(event, testSchema);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('Validation failed');
    }
  });
});

describe('getOrigin', () => {
  it('returns the origin header', () => {
    const event = makeEvent('{}', 'https://bool.pt');
    expect(getOrigin(event)).toBe('https://bool.pt');
  });

  it('returns undefined when no origin header', () => {
    const event = makeEvent('{}');
    expect(getOrigin(event)).toBeUndefined();
  });
});
