import { Link } from 'lucide-react';
import { useMemo, useState, useEffect, useTransition } from 'react';
import { useEditor } from '../../context/EditorContext.tsx';
import { useSearch } from '../../hooks/useSearch.ts';
import { l } from '../../locales/index.ts';
import FieldEditor from '../FieldEditor/FieldEditor.tsx';
import RepeatingGroup from '../RepeatingGroup/RepeatingGroup.tsx';
import { SkeletonSection } from '../Skeleton/Skeleton.tsx';
import styles from './SectionEditor.module.css';

export default function SectionEditor() {
  const { state, dispatch } = useEditor();
  const { sections, activeSection, activeSectionContext, sharedSections, searchQuery } = state;
  const [isPending, startTransition] = useTransition();

  // Defer rendering large sections so the skeleton shows during the commit
  const [renderedSection, setRenderedSection] = useState(activeSection);
  useEffect(() => {
    startTransition(() => {
      setRenderedSection(activeSection);
    });
  }, [activeSection, startTransition]);

  const searchResults = useSearch(sections, searchQuery);

  const currentSection = useMemo(
    () => sections.find((s) => s.name === renderedSection),
    [sections, renderedSection],
  );

  // Search mode: show flat results grouped by section
  if (searchQuery.trim()) {
    if (searchResults.length === 0) {
      return (
        <div className={styles.wrapper}>
          <div className={styles.card}>
            <div className={styles.empty}>
              {l('editor.noResults')} &ldquo;{searchQuery}&rdquo;
            </div>
          </div>
        </div>
      );
    }

    const grouped = new Map<string, typeof searchResults>();
    for (const result of searchResults) {
      const existing = grouped.get(result.sectionName) ?? [];
      existing.push(result);
      grouped.set(result.sectionName, existing);
    }

    return (
      <div className={styles.wrapper}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.sectionTitle}>{l('editor.searchResults')}</span>
            <span className={styles.keyCount}>{searchResults.length} {l('editor.matches')}</span>
          </div>
          <div className={styles.cardBody}>
            {[...grouped.entries()].map(([sectionName, results]) => (
              <div key={sectionName}>
                <div className={styles.searchResultSection}>
                  {results[0]?.sectionLabel}
                </div>
                {results.map((r) => (
                  <FieldEditor key={r.field.key} field={r.field} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Skeleton while section is transitioning
  if (isPending || !currentSection) {
    return (
      <div className={styles.wrapper}>
        {isPending ? (
          <SkeletonSection fieldCount={6} groupCount={1} />
        ) : (
          <div className={styles.card}>
            <div className={styles.empty}>{l('editor.select')}</div>
          </div>
        )}
      </div>
    );
  }

  const isSharedReadOnly =
    activeSectionContext === 'page' && sharedSections.includes(currentSection.name);

  return (
    <div className={styles.wrapper}>
      <div className={styles.cardHeader}>
        <span className={styles.sectionTitle}>{currentSection.label}</span>
        <span className={styles.keyCount}>{currentSection.keyCount} {l('editor.keys')}</span>
      </div>

      {isSharedReadOnly && (
        <div className={styles.sharedBanner}>
          <Link size={14} />
          <span>{l('shared.banner')}</span>
          <button
            type="button"
            className={styles.sharedBannerLink}
            onClick={() => dispatch({ type: 'SET_ACTIVE_SECTION', payload: { name: currentSection.name, context: 'shared' } })}
          >
            {l('shared.editLink')}
          </button>
        </div>
      )}

      <div className={styles.card}>
        <div className={styles.cardBody}>
          {currentSection.fields.length > 0 && (
            <>
              <div className={styles.fieldsHeading}>{l('editor.fields')}</div>
              {currentSection.fields.map((field) => (
                <FieldEditor key={field.key} field={field} disabled={isSharedReadOnly} />
              ))}
            </>
          )}
          {!isSharedReadOnly && currentSection.repeatingGroups.map((group) => (
            <RepeatingGroup key={group.prefix} group={group} />
          ))}
          {isSharedReadOnly && currentSection.repeatingGroups.map((group) => (
            <div key={group.prefix}>
              <div className={styles.fieldsHeading}>{group.label}</div>
              {group.items.map((item) =>
                item.fields.map((field) => (
                  <FieldEditor key={field.key} field={field} disabled />
                )),
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
