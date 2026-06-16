import { describe, it, expect } from 'vitest';
import { resolveLink, withBasePath } from './link.ts';

describe('withBasePath', () => {
  it('prefixes root-relative internal paths once', () => {
    expect(withBasePath('/about')).toBe('/bool/about');
  });

  it('does not double-prefix already-based paths', () => {
    expect(withBasePath('/bool/about')).toBe('/bool/about');
  });

  it('leaves anchors, absolute URLs, and mailto untouched', () => {
    expect(withBasePath('#section')).toBe('#section');
    expect(withBasePath('https://example.com')).toBe('https://example.com');
    expect(withBasePath('mailto:info@bool.pt')).toBe('mailto:info@bool.pt');
  });
});

describe('resolveLink', () => {
  it('internal (default) applies the base path and renders an anchor', () => {
    expect(resolveLink('/contacts')).toEqual({ isModal: false, href: '/bool/contacts' });
    expect(resolveLink('/contacts', 'internal')).toEqual({
      isModal: false,
      href: '/bool/contacts',
    });
  });

  it('external opens in a new tab with rel=noopener', () => {
    expect(resolveLink('https://linkedin.com/company/bool-pt', 'external')).toEqual({
      isModal: false,
      href: 'https://linkedin.com/company/bool-pt',
      target: '_blank',
      rel: 'noopener noreferrer',
    });
  });

  it('modal dispatches bool:open-<name> and renders no href', () => {
    expect(resolveLink('event-schedule', 'modal')).toEqual({
      isModal: true,
      modalEvent: 'bool:open-event-schedule',
    });
  });
});
