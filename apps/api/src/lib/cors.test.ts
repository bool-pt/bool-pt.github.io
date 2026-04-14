import { describe, it, expect } from 'vitest';
import { getCorsHeaders } from './cors.ts';

describe('getCorsHeaders', () => {
  it('returns production origin for allowed production origin', () => {
    const headers = getCorsHeaders('https://bool.pt');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://bool.pt');
  });

  it('returns localhost origin for allowed localhost', () => {
    const headers = getCorsHeaders('http://localhost:4321');
    expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:4321');
  });

  it('returns production origin for disallowed origin', () => {
    const headers = getCorsHeaders('https://evil.com');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://bool.pt');
  });

  it('returns production origin when origin is undefined', () => {
    const headers = getCorsHeaders(undefined);
    expect(headers['Access-Control-Allow-Origin']).toBe('https://bool.pt');
  });

  it('always includes allow-methods and allow-headers', () => {
    const headers = getCorsHeaders('https://bool.pt');
    expect(headers['Access-Control-Allow-Methods']).toBe('GET, POST, DELETE, OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });

  it('rejects localhost without port', () => {
    const headers = getCorsHeaders('http://localhost');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://bool.pt');
  });

  it('allows https localhost', () => {
    const headers = getCorsHeaders('https://localhost:3000');
    expect(headers['Access-Control-Allow-Origin']).toBe('https://localhost:3000');
  });
});
