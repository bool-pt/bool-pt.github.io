import { describe, it, expect, vi, afterEach } from 'vitest';
import { generateToken, verifyToken } from './token.ts';

const SECRET = 'test-secret-256-bit-key-for-hmac';

describe('token', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips a valid token', () => {
    const token = generateToken('user@example.com', SECRET);
    const result = verifyToken(token, SECRET);
    expect(result).toEqual({ valid: true, email: 'user@example.com' });
  });

  it('rejects an expired token', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const token = generateToken('user@example.com', SECRET, 1000);

    vi.setSystemTime(new Date('2025-01-01T00:00:02Z'));
    const result = verifyToken(token, SECRET);
    expect(result).toEqual({ valid: false });
  });

  it('rejects a tampered token', () => {
    const token = generateToken('user@example.com', SECRET);
    const tampered = token.slice(0, -2) + 'XX';
    const result = verifyToken(tampered, SECRET);
    expect(result).toEqual({ valid: false });
  });

  it('rejects a token signed with a different secret', () => {
    const token = generateToken('user@example.com', 'secret-a');
    const result = verifyToken(token, 'secret-b');
    expect(result).toEqual({ valid: false });
  });

  it('rejects garbage input', () => {
    expect(verifyToken('not-a-token', SECRET)).toEqual({ valid: false });
    expect(verifyToken('', SECRET)).toEqual({ valid: false });
  });

  it('handles emails with special characters', () => {
    const email = 'user+tag@sub.example.com';
    const token = generateToken(email, SECRET);
    const result = verifyToken(token, SECRET);
    expect(result).toEqual({ valid: true, email });
  });
});
