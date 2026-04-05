import { Search, Download, Eye, Sun, Moon } from 'lucide-react';
import { useCallback, useRef, useEffect, useState } from 'react';
import { serialize } from '@bool/json-editor-core';
import { useEditor } from '../../context/EditorContext.tsx';
import { l } from '../../locales/index.ts';
import styles from './TopBar.module.css';

interface TopBarProps {
  menuButton?: React.ReactNode;
}

export default function TopBar({ menuButton }: TopBarProps) {
  const { state, dispatch, darkMode, dirtyCount } = useEditor();
  const searchRef = useRef<HTMLInputElement>(null);
  const [localSearch, setLocalSearch] = useState(state.searchQuery);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearch(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
    }, 300);
  }, [dispatch]);

  const handleDownload = useCallback(() => {
    const json = serialize(state.sections, state.metaKeys);
    const blob = new Blob([JSON.stringify(json, null, 2) + '\n'], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.fileName || 'data.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }, [state.sections, state.fileName, state.metaKeys]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleDownload();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          dispatch({ type: 'REDO' });
        } else {
          dispatch({ type: 'UNDO' });
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleDownload, dispatch]);

  return (
    <header className={styles.topBar}>
      {menuButton}
      <button
        type="button"
        className={styles.brand}
        onClick={() => {
          if (dirtyCount > 0 && !window.confirm(l('confirm.unsavedChanges'))) return;
          dispatch({ type: 'SHOW_UPLOAD' });
        }}
        title={l('app.backToUpload')}
      >
        <svg className={styles.logo} width="60" height="27" viewBox="0 0 108 49" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g clipPath="url(#bool-logo)">
            <path d="M47.3617 47.9847C38.2445 47.9847 33.6836 44.5792 33.6836 37.7682V25.3531C33.6836 22.1254 34.8811 19.6087 37.2809 17.8124C39.6759 16.0114 43.0347 15.1133 47.3477 15.1133C51.6607 15.1133 55.024 16.0161 57.4285 17.8264C59.8329 19.6368 61.0398 22.1441 61.0398 25.3531V37.7682C61.0398 42.8343 58.6307 46.0059 53.8218 47.2783C52.0209 47.7461 49.869 47.9847 47.3664 47.9847M47.3664 42.4367C51.1601 42.4367 53.0593 41.0006 53.0593 38.1237V25.0023C53.0593 23.4586 52.5822 22.3499 51.6232 21.6857C50.6643 21.0214 49.2469 20.6893 47.3664 20.6893C43.5679 20.6893 41.6734 22.1254 41.6734 25.0023V38.1237C41.6734 39.6674 42.1459 40.7761 43.0955 41.4403C44.0451 42.1046 45.4672 42.4367 47.3664 42.4367Z" fill="currentColor"/>
            <path d="M76.0843 47.9847C66.9672 47.9847 62.4062 44.5792 62.4062 37.7682V25.3531C62.4062 22.1254 63.6038 19.6087 66.0035 17.8124C68.3986 16.0114 71.7573 15.1133 76.0703 15.1133C80.3833 15.1133 83.7467 16.0161 86.1511 17.8264C88.5602 19.6368 89.7624 22.1441 89.7624 25.3531V37.7682C89.7624 42.8343 87.3533 46.0059 82.5445 47.2783C80.7435 47.7461 78.5917 47.9847 76.089 47.9847M76.089 42.4367C79.8828 42.4367 81.782 41.0006 81.782 38.1237V25.0023C81.782 23.4586 81.3002 22.3499 80.3459 21.6857C79.3869 21.0214 77.9695 20.6893 76.089 20.6893C72.2906 20.6893 70.3961 22.1254 70.3961 25.0023V38.1237C70.3961 39.6674 70.8685 40.7761 71.8181 41.4403C72.7677 42.1046 74.1898 42.4367 76.089 42.4367Z" fill="currentColor"/>
            <path d="M5.74443 0.285374C5.24389 0.294729 4.76675 0.514589 4.44398 0.902853C4.00894 1.41742 3.38678 2.14249 2.87221 2.6056C2.03487 3.35874 1.11801 3.80313 0.551989 4.02767C0.224538 4.15865 0 4.52353 0 4.93518V7.7419C0 8.2705 0.355518 8.69619 0.795238 8.69619H4.9679V23.4268C4.9679 23.4268 4.67319 19.3477 8.14418 16.2135C10.3568 14.2208 12.9483 13.7155 12.9483 13.7155V1.59518C12.9483 0.823329 12.3262 0.201172 11.5543 0.201172L5.73975 0.290051L5.74443 0.285374Z" fill="currentColor"/>
            <path d="M18.6468 47.9847C9.52968 47.9847 4.96875 44.5792 4.96875 37.7682V25.3531C4.96875 22.1254 6.16629 19.6087 8.56603 17.8124C10.9611 16.0114 14.3198 15.1133 18.6328 15.1133C22.9458 15.1133 26.3092 16.0161 28.7136 17.8264C31.1181 19.6368 32.3249 22.1441 32.3249 25.3531V37.7682C32.3249 42.8343 29.9158 46.0059 25.1023 47.2783C23.3013 47.7461 21.1495 47.9847 18.6468 47.9847ZM18.6468 42.4367C22.4406 42.4367 24.3398 41.0006 24.3398 38.1237V25.0023C24.3398 23.4586 23.858 22.3499 22.9037 21.6857C21.9447 21.0214 20.5274 20.6893 18.6468 20.6893C14.8484 20.6893 12.9539 22.1254 12.9539 25.0023V38.1237C12.9539 39.6674 13.4263 40.7761 14.376 41.4403C15.3256 42.1046 16.7476 42.4367 18.6468 42.4367Z" fill="currentColor"/>
            <path d="M4.96875 20.9053V22.8841C5.02021 21.6818 5.42718 18.6506 8.14503 16.1994C10.3577 14.2066 12.9492 13.7014 12.9492 13.7014V11.7227C12.9492 11.7227 10.3577 12.2232 8.14503 14.2206C5.42718 16.6718 5.01553 19.7078 4.96875 20.9053Z" fill="currentColor"/>
            <path d="M105.709 41.8529C104.404 41.7266 100.848 41.3384 100.179 40.7256C99.3561 39.9724 98.9492 38.7141 98.9492 36.9552V13.5237L98.9726 13.5191V1.39401C98.9726 0.622157 98.3504 0 97.5786 0L91.764 0.0888796C91.2634 0.0982353 90.7863 0.318095 90.4635 0.701681C90.0285 1.21625 89.4063 1.94132 88.8917 2.40443C88.0544 3.15756 87.1375 3.60196 86.5668 3.8265C86.2394 3.95748 86.0195 4.32235 86.0195 4.73401V7.54073C86.0195 8.06933 86.375 8.49502 86.8148 8.49502H90.964V37.0675C90.964 40.922 91.8341 43.6726 93.5743 45.3146C95.3145 46.9565 97.9949 47.7798 101.616 47.7798H104.792C105.227 47.7798 105.578 47.4289 105.578 46.9939L106.125 42.3768C106.158 42.1149 105.966 41.8763 105.704 41.8529" fill="currentColor"/>
          </g>
          <defs><clipPath id="bool-logo"><rect width="107.441" height="48.837" fill="white"/></clipPath></defs>
        </svg>
        <span className={styles.appName}>JSON Editor</span>
      </button>

      {state.fileName && <span className={styles.fileName}>{state.fileName}</span>}

      <div className={styles.spacer} />

      <div className={styles.searchWrapper}>
        <Search size={16} className={styles.searchIcon} />
        <input
          ref={searchRef}
          type="text"
          placeholder={l('topBar.search.placeholder')}
          className={styles.searchInput}
          value={localSearch}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => dispatch({ type: 'TOGGLE_PREVIEW' })}
          title={l('topBar.preview')}
        >
          <Eye size={16} />
        </button>
        <button
          type="button"
          className={styles.iconButton}
          onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
          title={darkMode ? l('topBar.themeLight') : l('topBar.themeDark')}
        >
          {darkMode ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button type="button" className={styles.downloadButton} onClick={handleDownload}>
          <Download size={16} />
          <span className={styles.downloadLabel}>{l('topBar.download')}</span>
        </button>
      </div>
    </header>
  );
}
