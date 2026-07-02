import { describe, it, expect } from 'vitest';
import {
  contactFormSchema,
  contactFormSimpleSchema,
  eventScheduleSchema,
  newsletterSchema,
} from './validation.ts';

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
  const valid = { name: 'John Doe', email: 'test@example.com' };

  it('accepts valid name and email', () => {
    expect(newsletterSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(newsletterSchema.safeParse({ ...valid, email: 'not-valid' }).success).toBe(false);
  });

  it('rejects empty email', () => {
    expect(newsletterSchema.safeParse({ ...valid, email: '' }).success).toBe(false);
  });

  it('rejects missing email', () => {
    expect(newsletterSchema.safeParse({ name: 'John' }).success).toBe(false);
  });

  it('rejects short name', () => {
    expect(newsletterSchema.safeParse({ ...valid, name: 'J' }).success).toBe(false);
  });

  it('rejects name over 100 chars', () => {
    expect(newsletterSchema.safeParse({ ...valid, name: 'x'.repeat(101) }).success).toBe(false);
  });

  it('rejects missing name', () => {
    expect(newsletterSchema.safeParse({ email: 'test@example.com' }).success).toBe(false);
  });
});

describe('eventScheduleSchema', () => {
  const valid = {
    fullName: 'Jane Doe',
    phone: '+351 912 345 678',
    email: 'jane@example.com',
    time: 'Morning',
    message: 'Looking forward to it.',
  };

  it('accepts valid input', () => {
    expect(eventScheduleSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts an empty phone (now optional)', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, phone: '' }).success).toBe(true);
  });

  it('accepts a missing phone', () => {
    const { phone: _phone, ...withoutPhone } = valid;
    expect(eventScheduleSchema.safeParse(withoutPhone).success).toBe(true);
  });

  it('rejects a malformed phone', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, phone: 'abc' }).success).toBe(false);
  });

  it('rejects short fullName', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, fullName: 'J' }).success).toBe(false);
  });

  it('rejects invalid email', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, email: 'not-an-email' }).success).toBe(false);
  });

  it('rejects empty time', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, time: '' }).success).toBe(false);
  });

  it('rejects empty message', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, message: '' }).success).toBe(false);
  });

  it('rejects message over 5000 chars', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, message: 'x'.repeat(5001) }).success).toBe(
      false
    );
  });

  it('accepts message at exactly 5000 chars', () => {
    expect(eventScheduleSchema.safeParse({ ...valid, message: 'x'.repeat(5000) }).success).toBe(
      true
    );
  });
});
