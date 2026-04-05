import { describe, it, expect } from 'vitest';
import {
  validateContactForm,
  validateContactFormSimple,
  validateNewsletter,
} from './validation-api';

describe('validateContactForm', () => {
  it('accepts valid full contact form data', () => {
    const result = validateContactForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: '+351 912 345 678',
      message: 'Hello, I need help with a project.',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe('john@example.com');
    }
  });

  it('accepts valid data without phone', () => {
    const result = validateContactForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      message: 'Hello, I need help.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects short first name', () => {
    const result = validateContactForm({
      firstName: 'J',
      lastName: 'Doe',
      email: 'john@example.com',
      message: 'Hello, I need help.',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].path).toBe('firstName');
    }
  });

  it('rejects invalid email', () => {
    const result = validateContactForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'not-an-email',
      message: 'Hello, I need help.',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].path).toBe('email');
    }
  });

  it('rejects short message', () => {
    const result = validateContactForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      message: 'Hi',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].path).toBe('message');
    }
  });

  it('rejects invalid phone number', () => {
    const result = validateContactForm({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      phone: 'abc',
      message: 'Hello, I need help.',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].path).toBe('phone');
    }
  });
});

describe('validateContactFormSimple', () => {
  it('accepts valid simple contact form data', () => {
    const result = validateContactFormSimple({
      name: 'John Doe',
      email: 'john@example.com',
      message: 'Hello, I need help with a project.',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing name', () => {
    const result = validateContactFormSimple({
      email: 'john@example.com',
      message: 'Hello, I need help.',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateNewsletter', () => {
  it('accepts valid email', () => {
    const result = validateNewsletter({ email: 'john@example.com' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = validateNewsletter({ email: 'not-valid' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].path).toBe('email');
      expect(result.errors[0].message).toBe('Invalid email address');
    }
  });

  it('rejects empty email', () => {
    const result = validateNewsletter({ email: '' });
    expect(result.success).toBe(false);
  });
});
