import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  type ReactNode,
  type Dispatch,
} from 'react';
import {
  parseFlatJson,
  serialize,
  updateField,
  addItem,
  removeItem,
  reorderItem,
  addNestedItem,
  removeNestedItem,
  reorderNestedItem,
  upsertModalField,
  type EditorState,
} from '@bool/json-editor-core';

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

export type EditorAction =
  | { type: 'LOAD_JSON'; payload: { json: Record<string, string>; fileName: string } }
  | { type: 'SHOW_UPLOAD' }
  | { type: 'SHOW_EDITOR' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_FIELD'; payload: { key: string; value: string } }
  | { type: 'ADD_ITEM'; payload: { groupPrefix: string } }
  | { type: 'REMOVE_ITEM'; payload: { groupPrefix: string; index: string } }
  | { type: 'REORDER_ITEM'; payload: { groupPrefix: string; from: number; to: number } }
  | {
      type: 'ADD_NESTED_ITEM';
      payload: { parentGroupPrefix: string; parentIndex: string; innerPrefix: string };
    }
  | {
      type: 'REMOVE_NESTED_ITEM';
      payload: {
        parentGroupPrefix: string;
        parentIndex: string;
        innerPrefix: string;
        index: string;
      };
    }
  | {
      type: 'REORDER_NESTED_ITEM';
      payload: {
        parentGroupPrefix: string;
        parentIndex: string;
        innerPrefix: string;
        from: number;
        to: number;
      };
    }
  | { type: 'SET_ACTIVE_SECTION'; payload: { name: string; context: 'page' | 'shared' } }
  | { type: 'TOGGLE_PREVIEW' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_WIDTH'; payload: number }
  | { type: 'TOGGLE_THEME' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'UPSERT_MODAL'; payload: { key: string; suffix: string; value: string } }
  | { type: 'UNDO' }
  | { type: 'REDO' };

/* ------------------------------------------------------------------ */
/*  State with undo history                                            */
/* ------------------------------------------------------------------ */

interface HistoryState {
  current: EditorState;
  past: EditorState[];
  future: EditorState[];
  /** UI-only state (not in undo history) */
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  darkMode: boolean;
  view: 'upload' | 'editor';
}

const MAX_HISTORY = 50;
const DEFAULT_SIDEBAR_WIDTH = 220;

const SESSION_KEY = 'json-editor-session';

interface SessionData {
  json: Record<string, string>;
  fileName: string;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  darkMode: boolean;
  activeSection: string | null;
}

function saveSession(state: HistoryState): void {
  try {
    if (state.current.sections.length === 0) return;
    const json = serialize(state.current.sections, state.current.metaKeys);
    const data: SessionData = {
      json,
      fileName: state.current.fileName,
      sidebarCollapsed: state.sidebarCollapsed,
      sidebarWidth: state.sidebarWidth,
      darkMode: state.darkMode,
      activeSection: state.current.activeSection,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

function hasDangerousKeys(obj: unknown, depth = 0): boolean {
  if (depth > 10 || !obj || typeof obj !== 'object') return false;
  for (const key of Object.keys(obj as Record<string, unknown>)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') return true;
    if (
      typeof (obj as Record<string, unknown>)[key] === 'object' &&
      hasDangerousKeys((obj as Record<string, unknown>)[key], depth + 1)
    )
      return true;
  }
  return false;
}

function restoreSession(): HistoryState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data: SessionData = JSON.parse(raw);
    if (!data.json || typeof data.json !== 'object') return null;
    if (hasDangerousKeys(data)) return null;

    const parsed = parseFlatJson(data.json);
    if (data.darkMode) {
      document.documentElement.classList.add('dark');
    }

    return {
      current: {
        sections: parsed.sections,
        pages: parsed.pages,
        sharedSections: parsed.sharedSections,
        metaKeys: parsed.metaKeys,
        activeSection:
          data.activeSection ??
          parsed.pages[0]?.sectionNames[0] ??
          parsed.sections[0]?.name ??
          null,
        activeSectionContext: 'page',
        searchQuery: '',
        showPreview: false,
        isDirty: true,
        isLoading: false,
        fileName: data.fileName,
        totalKeys: parsed.totalKeys,
        keyOrder: parsed.keyOrder,
      },
      past: [],
      future: [],
      sidebarCollapsed: data.sidebarCollapsed ?? false,
      sidebarWidth: data.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH,
      darkMode: data.darkMode ?? false,
      view: 'editor',
    };
  } catch {
    return null;
  }
}

const emptyEditor: EditorState = {
  sections: [],
  pages: [],
  sharedSections: [],
  activeSection: null,
  activeSectionContext: null,
  metaKeys: {},
  searchQuery: '',
  showPreview: false,
  isDirty: false,
  isLoading: false,
  fileName: '',
  totalKeys: 0,
  keyOrder: [],
};

const initialHistory: HistoryState = {
  current: emptyEditor,
  past: [],
  future: [],
  sidebarCollapsed: false,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  darkMode: false,
  view: 'upload',
};

function pushHistory(state: HistoryState, next: EditorState): HistoryState {
  return {
    ...state,
    current: next,
    past: [...state.past.slice(-(MAX_HISTORY - 1)), state.current],
    future: [],
  };
}

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function editorReducer(state: HistoryState, action: EditorAction): HistoryState {
  const next = editorReducerInner(state, action);
  if (next !== state) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveSession(next), 1000);
  }
  return next;
}

function editorReducerInner(state: HistoryState, action: EditorAction): HistoryState {
  const { current } = state;

  switch (action.type) {
    case 'SHOW_UPLOAD':
      return { ...state, view: 'upload' };

    case 'SHOW_EDITOR':
      return state.current.sections.length > 0 ? { ...state, view: 'editor' } : state;

    case 'SET_LOADING':
      return { ...state, current: { ...current, isLoading: action.payload } };

    case 'LOAD_JSON': {
      const parsed = parseFlatJson(action.payload.json);
      const firstSection = parsed.pages[0]?.sectionNames[0] ?? parsed.sections[0]?.name ?? null;
      const next: EditorState = {
        sections: parsed.sections,
        pages: parsed.pages,
        sharedSections: parsed.sharedSections,
        metaKeys: parsed.metaKeys,
        activeSection: firstSection,
        activeSectionContext: 'page',
        searchQuery: '',
        showPreview: false,
        isDirty: false,
        isLoading: false,
        fileName: action.payload.fileName,
        totalKeys: parsed.totalKeys,
        keyOrder: parsed.keyOrder,
      };
      return { ...state, current: next, past: [], future: [], view: 'editor' };
    }

    case 'UPDATE_FIELD': {
      const sections = updateField(current.sections, action.payload.key, action.payload.value);
      return pushHistory(state, { ...current, sections, isDirty: true });
    }

    case 'ADD_ITEM': {
      const sections = addItem(current.sections, action.payload.groupPrefix);
      const totalKeys = sections.reduce((sum, s) => sum + s.keyCount, 0);
      return pushHistory(state, { ...current, sections, totalKeys, isDirty: true });
    }

    case 'REMOVE_ITEM': {
      const sections = removeItem(
        current.sections,
        action.payload.groupPrefix,
        action.payload.index
      );
      const totalKeys = sections.reduce((sum, s) => sum + s.keyCount, 0);
      return pushHistory(state, { ...current, sections, totalKeys, isDirty: true });
    }

    case 'REORDER_ITEM': {
      const sections = reorderItem(
        current.sections,
        action.payload.groupPrefix,
        action.payload.from,
        action.payload.to
      );
      return pushHistory(state, { ...current, sections, isDirty: true });
    }

    case 'ADD_NESTED_ITEM': {
      const sections = addNestedItem(
        current.sections,
        action.payload.parentGroupPrefix,
        action.payload.parentIndex,
        action.payload.innerPrefix
      );
      const totalKeys = sections.reduce((sum, s) => sum + s.keyCount, 0);
      return pushHistory(state, { ...current, sections, totalKeys, isDirty: true });
    }

    case 'REMOVE_NESTED_ITEM': {
      const sections = removeNestedItem(
        current.sections,
        action.payload.parentGroupPrefix,
        action.payload.parentIndex,
        action.payload.innerPrefix,
        action.payload.index
      );
      const totalKeys = sections.reduce((sum, s) => sum + s.keyCount, 0);
      return pushHistory(state, { ...current, sections, totalKeys, isDirty: true });
    }

    case 'REORDER_NESTED_ITEM': {
      const sections = reorderNestedItem(
        current.sections,
        action.payload.parentGroupPrefix,
        action.payload.parentIndex,
        action.payload.innerPrefix,
        action.payload.from,
        action.payload.to
      );
      return pushHistory(state, { ...current, sections, isDirty: true });
    }

    case 'SET_ACTIVE_SECTION':
      return {
        ...state,
        current: {
          ...current,
          activeSection: action.payload.name,
          activeSectionContext: action.payload.context,
        },
      };

    case 'TOGGLE_PREVIEW':
      return { ...state, current: { ...current, showPreview: !current.showPreview } };

    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed };

    case 'SET_SIDEBAR_WIDTH':
      return { ...state, sidebarWidth: Math.max(180, Math.min(500, action.payload)) };

    case 'TOGGLE_THEME': {
      const next = !state.darkMode;
      document.documentElement.classList.toggle('dark', next);
      return { ...state, darkMode: next };
    }

    case 'SET_SEARCH_QUERY':
      return { ...state, current: { ...current, searchQuery: action.payload } };

    case 'UPSERT_MODAL': {
      const sections = upsertModalField(
        current.sections,
        action.payload.key,
        action.payload.suffix,
        action.payload.value
      );
      const totalKeys = sections.reduce((sum, s) => sum + s.keyCount, 0);
      return pushHistory(state, { ...current, sections, totalKeys, isDirty: true });
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past.at(-1);
      if (!previous) return state;
      return {
        ...state,
        current: previous,
        past: state.past.slice(0, -1),
        future: [state.current, ...state.future.slice(0, MAX_HISTORY - 1)],
      };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        current: next,
        past: [...state.past, state.current],
        future: state.future.slice(1),
      };
    }

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

interface EditorContextValue {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  canUndo: boolean;
  canRedo: boolean;
  dirtyCount: number;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  darkMode: boolean;
  view: 'upload' | 'editor';
}

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [history, dispatch] = useReducer(
    editorReducer,
    initialHistory,
    () => restoreSession() ?? initialHistory
  );

  const dirtyCount = useMemo(() => {
    let count = 0;
    for (const section of history.current.sections) {
      for (const field of section.fields) {
        if (field.isDirty) count++;
      }
      for (const group of section.repeatingGroups) {
        for (const item of group.items) {
          for (const field of item.fields) {
            if (field.isDirty) count++;
          }
          if (item.nestedGroups) {
            for (const nested of item.nestedGroups) {
              for (const innerItem of nested.items) {
                for (const field of innerItem.fields) {
                  if (field.isDirty) count++;
                }
              }
            }
          }
        }
      }
    }
    return count;
  }, [history]);

  const value = useMemo<EditorContextValue>(
    () => ({
      state: history.current,
      dispatch,
      canUndo: history.past.length > 0,
      sidebarCollapsed: history.sidebarCollapsed,
      sidebarWidth: history.sidebarWidth,
      darkMode: history.darkMode,
      view: history.view,
      canRedo: history.future.length > 0,
      dirtyCount,
    }),
    [history, dirtyCount, dispatch]
  );

  return <EditorContext value={value}>{children}</EditorContext>;
}

export function useEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditor must be used within EditorProvider');
  return ctx;
}
