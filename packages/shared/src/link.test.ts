import { describe, it, expect } from 'vitest';
import { resolveLink, withBasePath } from './link.ts';

describe('withBasePath', () => {
  it('returns root-relative internal paths unchanged (site serves from root)', () => {
    expect(withBasePath('/about')).toBe('/about');
    expect(withBasePath('/')).toBe('/');
  });

  it('leaves anchors, absolute URLs, and mailto untouched', () => {
    expect(withBasePath('#section')).toBe('#section');
    expect(withBasePath('https://example.com')).toBe('https://example.com');
    expect(withBasePath('mailto:info@bool.pt')).toBe('mailto:info@bool.pt');
  });
});

describe('resolveLink', () => {
  it('internal (default) renders an anchor with the resolved href', () => {
    expect(resolveLink('/contacts')).toEqual({ isModal: false, href: '/contacts' });
    expect(resolveLink('/contacts', 'internal')).toEqual({
      isModal: false,
      href: '/contacts',
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
