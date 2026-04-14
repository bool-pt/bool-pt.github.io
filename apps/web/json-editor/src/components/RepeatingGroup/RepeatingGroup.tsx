import { Plus, Minus, GripVertical, ChevronDown } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import type { RepeatingGroup as RepeatingGroupType } from '@bool/json-editor-core';
import { useEditor } from '../../context/EditorContext.tsx';
import { cn } from '../../lib/cn.ts';
import { l } from '../../locales/index.ts';
import FieldEditor from '../FieldEditor/FieldEditor.tsx';
import NestedRepeatingGroup from '../NestedRepeatingGroup/NestedRepeatingGroup.tsx';
import styles from './RepeatingGroup.module.css';

const previewStyle: React.CSSProperties = { fontWeight: 400, opacity: 0.6, marginInlineStart: '0.5rem' };

interface RepeatingGroupProps {
  group: RepeatingGroupType;
}

export default function RepeatingGroup({ group }: RepeatingGroupProps) {
  const { dispatch } = useEditor();
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const toggleCollapse = useCallback((index: string) => {
    setCollapsedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const handleAdd = useCallback(() => {
    dispatch({ type: 'ADD_ITEM', payload: { groupPrefix: group.prefix } });
  }, [dispatch, group.prefix]);

  const handleRemove = useCallback(
    (index: string) => {
      dispatch({ type: 'REMOVE_ITEM', payload: { groupPrefix: group.prefix, index } });
      setConfirmRemove(null);
    },
    [dispatch, group.prefix],
  );

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    dragOverIdx.current = idx;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragIdx !== null && dragOverIdx.current !== null && dragIdx !== dragOverIdx.current) {
      dispatch({
        type: 'REORDER_ITEM',
        payload: { groupPrefix: group.prefix, from: dragIdx, to: dragOverIdx.current },
      });
    }
    setDragIdx(null);
    dragOverIdx.current = null;
  }, [dragIdx, dispatch, group.prefix]);

  return (
    <div className={styles.group}>
      <div className={styles.groupHeader}>
        <span className={styles.groupLabel}>{group.label}</span>
        <span className={styles.itemCount}>{group.items.length} {l('repeatingGroup.items')}</span>
        <button type="button" className={styles.addButton} onClick={handleAdd}>
          <Plus size={14} />
          {l('repeatingGroup.add')}
        </button>
      </div>

      <div className={styles.items}>
        {group.items.map((item, idx) => {
          const isCollapsed = collapsedItems.has(item.index);
          const isConfirming = confirmRemove === item.index;

          // Use first non-empty field value as preview label
          const previewValue = item.fields.find((f) => f.value.trim())?.value ?? '';
          const previewLabel =
            previewValue.length > 60 ? previewValue.slice(0, 60) + '...' : previewValue;

          return (
            <div
              key={item.index}
              className={cn(styles.item, dragIdx === idx && styles.itemDragging)}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={handleDrop}
              onDragEnd={() => setDragIdx(null)}
            >
              <div className={styles.itemHeader} onClick={() => toggleCollapse(item.index)}>
                <span
                  className={styles.dragHandle}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripVertical size={16} />
                </span>
                <span className={styles.itemLabel}>
                  {group.label} #{item.index}
                  {previewLabel && (
                    <span style={previewStyle}>
                      — {previewLabel}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmRemove(isConfirming ? null : item.index);
                  }}
                  title={l('repeatingGroup.removeItem')}
                >
                  <Minus size={14} />
                </button>
                <ChevronDown
                  size={16}
                  className={cn(styles.chevron, !isCollapsed && styles.chevronOpen)}
                />
              </div>

              {isConfirming && (
                <div className={styles.confirmOverlay}>
                  <span className={styles.confirmText}>{l('repeatingGroup.confirmRemove')}</span>
                  <button
                    type="button"
                    className={styles.confirmYes}
                    onClick={() => handleRemove(item.index)}
                  >
                    {l('repeatingGroup.confirmYes')}
                  </button>
                  <button
                    type="button"
                    className={styles.confirmNo}
                    onClick={() => setConfirmRemove(null)}
                  >
                    {l('repeatingGroup.confirmCancel')}
                  </button>
                </div>
              )}

              {!isCollapsed && (
                <div className={styles.itemBody}>
                  {item.fields.map((field) => (
                    <FieldEditor key={field.key} field={field} />
                  ))}
                  {item.nestedGroups?.map((nested) => (
                    <NestedRepeatingGroup
                      key={nested.prefix}
                      parentGroupPrefix={group.prefix}
                      parentIndex={item.index}
                      group={nested}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
