import { AlertCircle } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { TranslationField } from '@bool/json-editor-core';
import { useEditor } from '../../context/EditorContext.tsx';
import { cn } from '../../lib/cn.ts';
import { l } from '../../locales/index.ts';
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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !isLongValue(localValue)) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
    [localValue],
  );

  const useTextarea = isLongValue(field.value) || isLongValue(localValue);

  return (
    <div
      className={cn(
        styles.field,
        field.isDirty && styles.fieldDirty,
        isEmpty && !disabled && styles.fieldEmpty,
        disabled && styles.fieldDisabled,
      )}
    >
      <label className={styles.keyLabel} title={field.key}>
        {getShortKey(field.key)}
      </label>
      <div>
        {useTextarea ? (
          <textarea
            className={cn(styles.input, styles.textarea, disabled && styles.inputDisabled)}
            value={disabled ? field.value : localValue}
            onChange={disabled ? undefined : (e) => setLocalValue(e.target.value)}
            onBlur={disabled ? undefined : handleBlur}
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
        {isEmpty && !disabled && (
          <span className={styles.emptyWarning}>
            <AlertCircle size={12} />
            {l('editor.emptyValue')}
          </span>
        )}
      </div>
    </div>
  );
}
