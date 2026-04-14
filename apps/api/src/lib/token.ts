import { createHmac, timingSafeEqual } from 'node:crypto';

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const SEPARATOR = '|';

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function generateToken(
  email: string,
  secret: string,
  ttlMs: number = DEFAULT_TTL_MS
): string {
  const expiresAt = Date.now() + ttlMs;
  const payload = `${email}${SEPARATOR}${expiresAt}`;
  const signature = sign(payload, secret);
  return Buffer.from(`${payload}${SEPARATOR}${signature}`).toString('base64url');
}

export function verifyToken(
  token: string,
  secret: string
): { valid: true; email: string } | { valid: false; email?: undefined } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const lastDot = decoded.lastIndexOf(SEPARATOR);
    if (lastDot === -1) return { valid: false };

    const payload = decoded.slice(0, lastDot);
    const receivedSig = decoded.slice(lastDot + 1);

    const expectedSig = sign(payload, secret);
    const sigMatch = timingSafeEqual(Buffer.from(receivedSig), Buffer.from(expectedSig));
    if (!sigMatch) return { valid: false };

    const firstDot = payload.indexOf(SEPARATOR);
    if (firstDot === -1) return { valid: false };

    const email = payload.slice(0, firstDot);
    const expiresAt = Number(payload.slice(firstDot + 1));

    if (Number.isNaN(expiresAt) || Date.now() > expiresAt) return { valid: false };

    return { valid: true, email };
  } catch {
    return { valid: false };
  }
}
