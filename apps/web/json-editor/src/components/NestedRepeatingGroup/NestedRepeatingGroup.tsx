import { Plus, Minus } from 'lucide-react';
import { useCallback, useState } from 'react';
import type { NestedRepeatingGroup as NestedRepeatingGroupType } from '@bool/json-editor-core';
import { useEditor } from '../../context/EditorContext.tsx';
import { cn } from '../../lib/cn.ts';
import FieldEditor from '../FieldEditor/FieldEditor.tsx';
import styles from './NestedRepeatingGroup.module.css';

interface Props {
  parentGroupPrefix: string;
  parentIndex: string;
  group: NestedRepeatingGroupType;
}

function humanizeInnerPrefix(innerPrefix: string): string {
  return innerPrefix
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

export default function NestedRepeatingGroup({
  parentGroupPrefix,
  parentIndex,
  group,
}: Props) {
  const { dispatch } = useEditor();
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    dispatch({
      type: 'ADD_NESTED_ITEM',
      payload: {
        parentGroupPrefix,
        parentIndex,
        innerPrefix: group.innerPrefix,
      },
    });
  }, [dispatch, parentGroupPrefix, parentIndex, group.innerPrefix]);

  const handleRemove = useCallback(
    (index: string) => {
      dispatch({
        type: 'REMOVE_NESTED_ITEM',
        payload: {
          parentGroupPrefix,
          parentIndex,
          innerPrefix: group.innerPrefix,
          index,
        },
      });
      setConfirmRemove(null);
    },
    [dispatch, parentGroupPrefix, parentIndex, group.innerPrefix],
  );

  const isBareValueList =
    group.template.fieldSuffixes.length === 1 && group.template.fieldSuffixes[0] === '';

  return (
    <div className={styles.nested}>
      <div className={styles.header}>
        <span className={styles.label}>{humanizeInnerPrefix(group.innerPrefix)}</span>
        <span className={styles.count}>{group.items.length}</span>
        <button type="button" className={styles.addButton} onClick={handleAdd}>
          <Plus size={12} />
          Add
        </button>
      </div>
      <ul className={styles.items}>
        {group.items.map((item) => {
          const isConfirming = confirmRemove === item.index;
          return (
            <li key={item.index} className={cn(styles.item, isBareValueList && styles.itemBare)}>
              <span className={styles.indexBadge}>#{item.index}</span>
              <div className={styles.itemFields}>
                {item.fields.map((field) => (
                  <FieldEditor key={field.key} field={field} />
                ))}
              </div>
              <div className={styles.itemActions}>
                {isConfirming ? (
                  <>
                    <button
                      type="button"
                      className={styles.confirmYes}
                      onClick={() => handleRemove(item.index)}
                    >
                      Remove?
                    </button>
                    <button
                      type="button"
                      className={styles.confirmNo}
                      onClick={() => setConfirmRemove(null)}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => setConfirmRemove(item.index)}
                    aria-label="Remove"
                  >
                    <Minus size={12} />
                  </button>
                )}
              </div>
            </li>
          );
        })}
        {group.items.length === 0 && (
          <li className={styles.empty}>
            (empty — click <kbd>Add</kbd> to insert the first one)
          </li>
        )}
      </ul>
    </div>
  );
}
