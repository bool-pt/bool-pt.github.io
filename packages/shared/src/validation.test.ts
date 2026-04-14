import { describe, it, expect } from 'vitest';
import { contactFormSchema, contactFormSimpleSchema, newsletterSchema } from './validation.ts';

describe('contactFormSchema', () => {
  const valid = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    message: 'Hello, this is a test message.',
  };

  it('accepts valid input', () => {
    expect(contactFormSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts optional phone', () => {
    expect(contactFormSchema.safeParse({ ...valid, phone: '+351 912 345 678' }).success).toBe(true);
  });

  it('accepts empty phone string', () => {
    expect(contactFormSchema.safeParse({ ...valid, phone: '' }).success).toBe(true);
  });

  it('rejects short firstName', () => {
    expect(contactFormSchema.safeParse({ ...valid, firstName: 'J' }).success).toBe(false);
  });

  it('rejects short lastName', () => {
    expect(contactFormSchema.safeParse({ ...valid, lastName: 'D' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(contactFormSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects short message', () => {
    expect(contactFormSchema.safeParse({ ...valid, message: 'Hi' }).success).toBe(false);
  });

  it('rejects message over 2000 chars', () => {
    expect(contactFormSchema.safeParse({ ...valid, message: 'x'.repeat(2001) }).success).toBe(
      false
    );
  });

  it('rejects invalid phone', () => {
    expect(contactFormSchema.safeParse({ ...valid, phone: 'abc' }).success).toBe(false);
  });

  it('rejects missing required fields', () => {
    expect(contactFormSchema.safeParse({}).success).toBe(false);
  });
});

describe('contactFormSimpleSchema', () => {
  const valid = {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, this is a test message.',
  };

  it('accepts valid input', () => {
    expect(contactFormSimpleSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects short name', () => {
    expect(contactFormSimpleSchema.safeParse({ ...valid, name: 'J' }).success).toBe(false);
  });

  it('rejects name over 100 chars', () => {
    expect(contactFormSimpleSchema.safeParse({ ...valid, name: 'x'.repeat(101) }).success).toBe(
      false
    );
  });
});

describe('newsletterSchema', () => {
  it('accepts valid email', () => {
    expect(newsletterSchema.safeParse({ email: 'test@example.com' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(newsletterSchema.safeParse({ email: 'not-valid' }).success).toBe(false);
  });

  it('rejects empty email', () => {
    expect(newsletterSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('rejects missing email', () => {
    expect(newsletterSchema.safeParse({}).success).toBe(false);
  });
});
