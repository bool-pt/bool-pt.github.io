import { describe, it, expect } from 'vitest';
import { escapeHtml } from './escape-html.ts';

describe('escapeHtml', () => {
  it('escapes ampersands', () => {
    expect(escapeHtml('a & b')).toBe('a &amp; b');
  });

  it('escapes angle brackets', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    );
  });

  it('escapes single quotes', () => {
    expect(escapeHtml("it's")).toBe('it&#39;s');
  });

  it('escapes double quotes', () => {
    expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
  });

  it('returns clean strings unchanged', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });

  it('handles empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('escapes all five special characters in one string', () => {
    expect(escapeHtml(`& < > " '`)).toBe('&amp; &lt; &gt; &quot; &#39;');
  });

  it('escapes mixed HTML content', () => {
    expect(escapeHtml('John <img src=x onerror="alert(1)"> Doe')).toBe(
      'John &lt;img src=x onerror=&quot;alert(1)&quot;&gt; Doe'
    );
  });
});
