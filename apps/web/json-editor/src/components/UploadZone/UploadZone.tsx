import { Upload, ArrowLeft } from 'lucide-react';
import { useRef, useState, useCallback, type DragEvent } from 'react';
import { useEditor } from '../../context/EditorContext.tsx';
import { cn } from '../../lib/cn.ts';
import { l } from '../../locales/index.ts';
import styles from './UploadZone.module.css';

export default function UploadZone() {
  const { state, dispatch } = useEditor();
  const hasData = state.sections.length > 0;
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const justDroppedRef = useRef(false);

  const processFile = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith('.json') && file.type !== 'application/json') {
        setError(l('upload.error.notJson'));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => {
        setError(l('upload.error.readFailed'));
      };
      reader.onload = (e) => {
        try {
          const raw = e.target?.result;
          if (typeof raw !== 'string') {
            setError(l('upload.error.readFailed'));
            return;
          }
          const json = JSON.parse(raw);

          if (typeof json !== 'object' || json === null || Array.isArray(json)) {
            setError(l('upload.error.notObject'));
            return;
          }

          // Prevent prototype pollution
          const dangerousKeys = Object.keys(json).some(
            (k) => k === '__proto__' || k === 'constructor' || k === 'prototype',
          );
          if (dangerousKeys) {
            setError(l('upload.error.dangerous'));
            return;
          }

          const hasNonString = Object.values(json).some((v) => typeof v !== 'string');
          if (hasNonString) {
            setError(l('upload.error.notStrings'));
            return;
          }

          // Show skeleton while parsing, then load
          dispatch({ type: 'SET_LOADING', payload: true });
          requestAnimationFrame(() => {
            dispatch({ type: 'LOAD_JSON', payload: { json, fileName: file.name } });
          });
        } catch {
          setError(l('upload.error.invalid'));
        }
      };
      reader.readAsText(file);
    },
    [dispatch],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      justDroppedRef.current = true;
      setTimeout(() => { justDroppedRef.current = false; }, 300);
      const file = e.dataTransfer.files[0];
      if (file) {
        processFile(file);
      } else {
        setError(l('upload.error.notJson'));
      }
    },
    [processFile],
  );

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    if (justDroppedRef.current) return;
    inputRef.current?.click();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  return (
    <div
      className={styles.wrapper}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className={cn(styles.card, isDragOver && styles.cardDragOver)}
        onClick={handleClick}
        role="button"
        aria-label={l('upload.chooseFile')}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClick();
        }}
      >
        <Upload size={48} className={styles.icon} />
        <h1 className={styles.title}>{isDragOver ? l('upload.titleDragOver') : l('upload.title')}</h1>
        <p className={styles.subtitle}>
          {l('upload.subtitle')}
        </p>
        <button type="button" className={styles.button}>
          <Upload size={18} />
          {l('upload.chooseFile')}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".json"
          className={styles.hiddenInput}
          onChange={handleChange}
        />
        {error && <p className={styles.error}>{error}</p>}
      </div>
      {hasData && (
        <button
          type="button"
          className={styles.backToEditor}
          onClick={() => dispatch({ type: 'SHOW_EDITOR' })}
        >
          <ArrowLeft size={16} />
          {l('upload.backToEditor')}
        </button>
      )}
    </div>
  );
}
