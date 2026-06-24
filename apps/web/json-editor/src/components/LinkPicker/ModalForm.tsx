import { useState } from 'react';
import type { Section } from '@bool/json-editor-core';
import { slugify } from '@bool/shared';
import { useEditor } from '../../context/EditorContext.tsx';
import MediaPicker from '../MediaPicker/MediaPicker.tsx';
import styles from './LinkPicker.module.css';

const MODAL_PREFIX = 'modal:';

const FIELDS = [
  { suffix: 'title', label: 'Title', kind: 'text' as const },
  { suffix: 'body', label: 'Body', kind: 'textarea' as const },
  { suffix: 'image', label: 'Image', kind: 'media' as const },
  { suffix: 'cta.label', label: 'CTA label', kind: 'text' as const },
  { suffix: 'cta.href', label: 'CTA link', kind: 'text' as const },
];

type Draft = Record<string, string>;
const EMPTY_DRAFT: Draft = { title: '', body: '', image: '', 'cta.label': '', 'cta.href': '' };

function modalSection(sections: Section[]): Section | undefined {
  return sections.find((s) => s.name === 'modals');
}
function fieldValue(sections: Section[], key: string, suffix: string): string {
  return (
    modalSection(sections)?.fields.find((f) => f.key === `modals.${key}.${suffix}`)?.value ?? ''
  );
}
function existingKeys(sections: Section[]): Set<string> {
  const keys = new Set<string>();
  for (const f of modalSection(sections)?.fields ?? []) {
    const m = /^modals\.([^.]+)\./.exec(f.key);
    if (m?.[1]) keys.add(m[1]);
  }
  return keys;
}
function uniqueKey(base: string, taken: Set<string>): string {
  const root = base || 'modal';
  let key = root;
  let n = 2;
  while (taken.has(key)) key = `${root}-${n++}`;
  return key;
}

interface Props {
  /** The button's href value (e.g. `modal:newsletter` or empty). */
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

/**
 * Inline authoring form for a content modal. Writes `modals.<key>.*` into the
 * JSON and points the button at `modal:<key>`. The key is the slugified title,
 * generated once when the modal is first created and kept stable afterwards.
 */
export default function ModalForm({ value, onChange, disabled = false }: Props) {
  const { state, dispatch } = useEditor();
  const sections = state.sections;
  const keys = existingKeys(sections);

  const modalKey = value.startsWith(MODAL_PREFIX) ? value.slice(MODAL_PREFIX.length) : '';
  const isBound = modalKey !== '' && keys.has(modalKey);

  // Until the modal is created, edits live in local draft state.
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  const getValue = (suffix: string) =>
    isBound ? fieldValue(sections, modalKey, suffix) : (draft[suffix] ?? '');

  const setValue = (suffix: string, next: string) => {
    if (isBound) {
      dispatch({ type: 'UPSERT_MODAL', payload: { key: modalKey, suffix, value: next } });
    } else {
      setDraft((d) => ({ ...d, [suffix]: next }));
    }
  };

  // Create the modal once a title exists (committed on blur).
  const createFromDraft = (current: Draft) => {
    const title = (current.title ?? '').trim();
    if (!title) return;
    const key = uniqueKey(slugify(title), keys);
    for (const { suffix } of FIELDS) {
      const v = current[suffix];
      if (v) dispatch({ type: 'UPSERT_MODAL', payload: { key, suffix, value: v } });
    }
    onChange(`${MODAL_PREFIX}${key}`);
  };

  return (
    <div className={styles.modalForm}>
      {FIELDS.map((f) => {
        const v = getValue(f.suffix);
        return (
          <label key={f.suffix} className={styles.modalField}>
            <span className={styles.segLabel}>{f.label}</span>
            {f.kind === 'media' ? (
              <MediaPicker
                fieldKey={`modals.${modalKey || 'new'}.image`}
                value={v}
                disabled={disabled}
                onChange={(next) => setValue('image', next)}
              />
            ) : f.kind === 'textarea' ? (
              <textarea
                className={styles.input}
                rows={3}
                value={v}
                disabled={disabled}
                onChange={(e) => setValue(f.suffix, e.target.value)}
              />
            ) : (
              <input
                type="text"
                className={styles.input}
                value={v}
                disabled={disabled}
                placeholder={f.suffix === 'cta.href' ? 'optional — link or modal:key' : undefined}
                onChange={(e) => setValue(f.suffix, e.target.value)}
                onBlur={f.suffix === 'title' && !isBound ? () => createFromDraft(draft) : undefined}
              />
            )}
          </label>
        );
      })}
      <code className={styles.preview}>{value || '(enter a title to create the modal)'}</code>
    </div>
  );
}
