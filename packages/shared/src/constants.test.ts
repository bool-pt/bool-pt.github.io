import { describe, it, expect } from 'vitest';
import { COMPANY } from './constants.ts';

describe('COMPANY constants (BOOL-07)', () => {
  it('declares a valid Portuguese VAT number', () => {
    // GDPR Art. 13(1)(a) — the controller must be unambiguously identifiable.
    expect(COMPANY.vatNumber).toMatch(/^PT\d{9}$/);
  });

  it('uses the registered legal address (Kube Coworking, 1700-106 Lisboa)', () => {
    expect(COMPANY.address).toContain('Kube Coworking');
    expect(COMPANY.address).toContain('1700-106 Lisboa');
    // Must not regress to the stale Gonçalves Zarco address.
    expect(COMPANY.address).not.toContain('Zarco');
  });

  it('keeps the public contact details', () => {
    expect(COMPANY.email).toBe('info@bool.pt');
    expect(COMPANY.phone).toBeTruthy();
  });
});
