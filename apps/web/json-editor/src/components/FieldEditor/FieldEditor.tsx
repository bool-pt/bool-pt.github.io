import { AlertCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { TranslationField } from '@bool/json-editor-core';
import { useEditor } from '../../context/EditorContext.tsx';
import { cn } from '../../lib/cn.ts';
import { l } from '../../locales/index.ts';
import IconPicker from '../IconPicker/IconPicker.tsx';
import LinkPicker from '../LinkPicker/LinkPicker.tsx';
import MediaPicker from '../MediaPicker/MediaPicker.tsx';
import styles from './FieldEditor.module.css';

interface FieldEditorProps {
  field: TranslationField;
  disabled?: boolean;
}

function getShortKey(key: string): string {
  const parts = key.split('.');
  return parts.length > 2 ? parts.slice(-2).join('.') : key;
}

function isLongValue(value: string): boolean {
  return value.length > 100 || value.includes('<br') || value.includes('\n');
}

export default function FieldEditor({ field, disabled = false }: FieldEditorProps) {
  const { dispatch } = useEditor();
  const [localValue, setLocalValue] = useState(field.value);
  const [trackedFieldValue, setTrackedFieldValue] = useState(field.value);

  // Sync local state only when field.value changes externally (undo/redo/load)
  if (field.value !== trackedFieldValue) {
    setTrackedFieldValue(field.value);
    setLocalValue(field.value);
  }

  const isEmpty = localValue.trim() === '';

  const handleBlur = useCallback(() => {
    if (localValue !== field.value) {
      dispatch({ type: 'UPDATE_FIELD', payload: { key: field.key, value: localValue } });
    }
  }, [localValue, field.key, field.value, dispatch]);

  // Undo/redo while the field is focused. First Ctrl+Z reverts uncommitted
  // typing to the last committed value; with nothing pending it falls through
  // to app-level undo. Returns true when it handled the event.
  const handleUndoRedo = useCallback(
    (e: React.KeyboardEvent): boolean => {
      if (!(e.ctrlKey || e.metaKey)) return false;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (localValue !== field.value) {
          setLocalValue(field.value);
        } else {
          dispatch({ type: 'UNDO' });
        }
        return true;
      }
      if (key === 'y' || (key === 'z' && e.shiftKey)) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
        return true;
      }
      return false;
    },
    [localValue, field.value, dispatch]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (handleUndoRedo(e)) return;
      if (e.key === 'Enter' && !isLongValue(localValue)) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    [handleUndoRedo, localValue]
  );

  const handleSpecializedChange = useCallback(
    (next: string) => {
      setLocalValue(next);
      if (next !== field.value) {
        dispatch({ type: 'UPDATE_FIELD', payload: { key: field.key, value: next } });
      }
    },
    [dispatch, field.key, field.value]
  );

  const useTextarea = isLongValue(field.value) || isLongValue(localValue);
  const kind = field.kind ?? 'text';
  // Boolean fields are visible unless the stored value is exactly "false",
  // mirroring `isVisible()` in @bool/i18n.
  const boolChecked = (disabled ? field.value : localValue) !== 'false';

  return (
    <div
      className={cn(
        styles.field,
        field.isDirty && styles.fieldDirty,
        isEmpty && !disabled && kind === 'text' && styles.fieldEmpty,
        disabled && styles.fieldDisabled
      )}
    >
      <label className={styles.keyLabel} title={field.key}>
        {getShortKey(field.key)}
      </label>
      <div>
        {kind === 'media' ? (
          <MediaPicker
            fieldKey={field.key}
            value={disabled ? field.value : localValue}
            onChange={handleSpecializedChange}
            disabled={disabled}
          />
        ) : kind === 'icon' ? (
          <IconPicker
            value={disabled ? field.value : localValue}
            onChange={handleSpecializedChange}
            disabled={disabled}
          />
        ) : kind === 'link' ? (
          <LinkPicker
            value={disabled ? field.value : localValue}
            onChange={handleSpecializedChange}
            disabled={disabled}
          />
        ) : kind === 'select' && field.options ? (
          <select
            className={cn(styles.input, disabled && styles.inputDisabled)}
            value={disabled ? field.value : localValue}
            disabled={disabled}
            onChange={
              disabled
                ? undefined
                : (e) => {
                    setLocalValue(e.target.value);
                    dispatch({
                      type: 'UPDATE_FIELD',
                      payload: { key: field.key, value: e.target.value },
                    });
                  }
            }
          >
            {field.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : kind === 'boolean' ? (
          <label className={cn(styles.toggle, disabled && styles.inputDisabled)}>
            <input
              type="checkbox"
              role="switch"
              className={styles.toggleInput}
              checked={boolChecked}
              disabled={disabled}
              onChange={
                disabled
                  ? undefined
                  : (e) => handleSpecializedChange(e.target.checked ? 'true' : 'false')
              }
            />
            <span className={styles.toggleTrack} aria-hidden="true">
              <span className={styles.toggleThumb} />
            </span>
            <span className={styles.toggleValue}>{boolChecked ? 'true' : 'false'}</span>
          </label>
        ) : useTextarea ? (
          <textarea
            className={cn(styles.input, styles.textarea, disabled && styles.inputDisabled)}
            value={disabled ? field.value : localValue}
            onChange={disabled ? undefined : (e) => setLocalValue(e.target.value)}
            onBlur={disabled ? undefined : handleBlur}
            onKeyDown={disabled ? undefined : handleUndoRedo}
            rows={3}
            disabled={disabled}
          />
        ) : (
          <input
            type="text"
            className={cn(styles.input, disabled && styles.inputDisabled)}
            value={disabled ? field.value : localValue}
            onChange={disabled ? undefined : (e) => setLocalValue(e.target.value)}
            onBlur={disabled ? undefined : handleBlur}
            onKeyDown={disabled ? undefined : handleKeyDown}
            disabled={disabled}
          />
        )}
        {isEmpty && !disabled && kind === 'text' && (
          <span className={styles.emptyWarning}>
            <AlertCircle size={12} />
            {l('editor.emptyValue')}
          </span>
        )}
      </div>
    </div>
  );
}
