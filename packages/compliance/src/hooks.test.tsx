import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CONSENT_STORAGE_KEY } from './config';
import { useConsent } from './hooks';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe('useConsent', () => {
  it('starts with null consent and hasDecided false when no stored consent', () => {
    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toBeNull();
    expect(result.current.hasDecided).toBe(false);
  });

  it('loads stored consent on mount', () => {
    const stored = { analytics: true, marketing: false, timestamp: Date.now() };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));

    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toEqual(stored);
    expect(result.current.hasDecided).toBe(true);
  });

  it('acceptAll sets analytics and marketing to true', () => {
    const { result } = renderHook(() => useConsent());

    act(() => {
      result.current.accept();
    });

    expect(result.current.consent?.analytics).toBe(true);
    expect(result.current.consent?.marketing).toBe(true);
    expect(result.current.hasDecided).toBe(true);

    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    const stored = JSON.parse(raw as string) as {
      analytics: boolean;
      marketing: boolean;
      timestamp: number;
    };
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(true);
    expect(typeof stored.timestamp).toBe('number');
  });

  it('rejectAll sets analytics and marketing to false', () => {
    const { result } = renderHook(() => useConsent());

    act(() => {
      result.current.reject();
    });

    expect(result.current.consent?.analytics).toBe(false);
    expect(result.current.consent?.marketing).toBe(false);
    expect(result.current.hasDecided).toBe(true);
  });

  it('savePreferences stores custom choices', () => {
    const { result } = renderHook(() => useConsent());

    act(() => {
      result.current.savePreferences({ analytics: true, marketing: false });
    });

    expect(result.current.consent?.analytics).toBe(true);
    expect(result.current.consent?.marketing).toBe(false);
    expect(result.current.hasDecided).toBe(true);
  });

  it('reset clears consent and hasDecided', () => {
    const { result } = renderHook(() => useConsent());

    act(() => {
      result.current.accept();
    });
    expect(result.current.hasDecided).toBe(true);

    act(() => {
      result.current.reset();
    });
    expect(result.current.consent).toBeNull();
    expect(result.current.hasDecided).toBe(false);
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });

  it('clears expired consent on mount', () => {
    const expired = { analytics: true, marketing: true, timestamp: 1 };
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(expired));

    const { result } = renderHook(() => useConsent());
    expect(result.current.consent).toBeNull();
    expect(result.current.hasDecided).toBe(false);
    expect(localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
  });
});
