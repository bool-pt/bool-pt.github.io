import { renderHook, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { useSwipe } from './useSwipe';

afterEach(cleanup);

function createTouchEvent(clientX: number) {
  return { touches: [{ clientX }] } as unknown as React.TouchEvent;
}

describe('useSwipe', () => {
  it('calls onSwipeLeft when swiped left', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe(onSwipeLeft, onSwipeRight));

    act(() => {
      result.current.onTouchStart(createTouchEvent(200));
      result.current.onTouchMove(createTouchEvent(100));
      result.current.onTouchEnd();
    });

    expect(onSwipeLeft).toHaveBeenCalledOnce();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it('calls onSwipeRight when swiped right', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe(onSwipeLeft, onSwipeRight));

    act(() => {
      result.current.onTouchStart(createTouchEvent(100));
      result.current.onTouchMove(createTouchEvent(200));
      result.current.onTouchEnd();
    });

    expect(onSwipeRight).toHaveBeenCalledOnce();
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it('does not call either callback when distance is below threshold', () => {
    const onSwipeLeft = vi.fn();
    const onSwipeRight = vi.fn();
    const { result } = renderHook(() => useSwipe(onSwipeLeft, onSwipeRight));

    act(() => {
      result.current.onTouchStart(createTouchEvent(100));
      result.current.onTouchMove(createTouchEvent(130));
      result.current.onTouchEnd();
    });

    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
