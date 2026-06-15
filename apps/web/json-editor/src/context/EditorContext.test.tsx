import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorProvider, useEditor } from './EditorContext';

function wrapper({ children }: { children: ReactNode }) {
  return <EditorProvider>{children}</EditorProvider>;
}

beforeEach(() => {
  sessionStorage.clear();
  document.documentElement.classList.remove('dark');
  // Prevent the debounced session-save timer from firing during tests.
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('EditorContext', () => {
  it('starts in upload view with empty history', () => {
    const { result } = renderHook(() => useEditor(), { wrapper });
    expect(result.current.view).toBe('upload');
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.dirtyCount).toBe(0);
  });

  it('toggles the sidebar', () => {
    const { result } = renderHook(() => useEditor(), { wrapper });
    act(() => result.current.dispatch({ type: 'TOGGLE_SIDEBAR' }));
    expect(result.current.sidebarCollapsed).toBe(true);
  });

  it('clamps sidebar width to [180, 500]', () => {
    const { result } = renderHook(() => useEditor(), { wrapper });
    act(() => result.current.dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: 1000 }));
    expect(result.current.sidebarWidth).toBe(500);
    act(() => result.current.dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: 10 }));
    expect(result.current.sidebarWidth).toBe(180);
  });

  it('loads json into the editor and supports undo/redo', () => {
    const { result } = renderHook(() => useEditor(), { wrapper });
    act(() =>
      result.current.dispatch({
        type: 'LOAD_JSON',
        payload: { json: { 'home.title': 'Hi' }, fileName: 'en.json' },
      })
    );
    expect(result.current.view).toBe('editor');
    expect(result.current.state.totalKeys).toBe(1);
    expect(result.current.canUndo).toBe(false);

    act(() =>
      result.current.dispatch({
        type: 'UPDATE_FIELD',
        payload: { key: 'home.title', value: 'Bye' },
      })
    );
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.dispatch({ type: 'UNDO' }));
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('refuses to restore a session with prototype-polluting keys', () => {
    sessionStorage.setItem(
      'json-editor-session',
      '{"json":{"__proto__":"x","home.title":"Hi"},"fileName":"en.json","sidebarCollapsed":false,"sidebarWidth":220,"darkMode":false,"activeSection":null}'
    );
    const { result } = renderHook(() => useEditor(), { wrapper });
    expect(result.current.view).toBe('upload');
  });
});
