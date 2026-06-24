import { useState, type ReactNode } from 'react';
import { cn } from '@bool/shared';
import styles from './FilterableGrid.module.css';

interface FilterGroup {
  items: string[];
  ariaLabel: string;
  toggle?: boolean;
}

interface Props<T> {
  data: T[];
  filterGroups: FilterGroup[];
  matchFilter: (item: T, groupIndex: number, activeIndex: number) => boolean;
  renderItem: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
  ariaLabel?: string;
  gridClassName?: string;
}

function FilterPills({
  items,
  activeIndex,
  onSelect,
  ariaLabel,
}: {
  items: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className={styles.filterRow} role="tablist" aria-label={ariaLabel}>
      {items.map((item, i) => (
        <button
          key={item}
          type="button"
          className={cn(styles.filterPill, i === activeIndex && styles.filterPillActive)}
          role="tab"
          aria-selected={i === activeIndex}
          onClick={() => onSelect(i)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

export default function FilterableGrid<T>({
  data,
  filterGroups,
  matchFilter,
  renderItem,
  emptyMessage = '',
  ariaLabel = '',
  gridClassName,
}: Props<T>) {
  const [activeIndices, setActiveIndices] = useState<number[]>(
    filterGroups.map((g) => (g.toggle ? -1 : 0))
  );

  const filtered = data.filter((item) =>
    filterGroups.every((_, gi) => matchFilter(item, gi, activeIndices[gi]))
  );

  function handleSelect(groupIndex: number, itemIndex: number) {
    setActiveIndices((prev) => {
      const next = [...prev];
      if (filterGroups[groupIndex].toggle) {
        next[groupIndex] = next[groupIndex] === itemIndex ? -1 : itemIndex;
      } else {
        next[groupIndex] = itemIndex;
      }
      return next;
    });
  }

  return (
    <>
      <div className={styles.filterGroup} role="group" aria-label={ariaLabel}>
        {filterGroups.map((group, gi) => (
          <FilterPills
            key={gi}
            items={group.items}
            activeIndex={activeIndices[gi]}
            onSelect={(i) => handleSelect(gi, i)}
            ariaLabel={group.ariaLabel}
          />
        ))}
      </div>

      <div className={gridClassName || styles.grid}>
        {filtered.length > 0 ? (
          filtered.map((item, i) => renderItem(item, i))
        ) : (
          <p className={styles.emptyState}>{emptyMessage}</p>
        )}
      </div>
    </>
  );
}
