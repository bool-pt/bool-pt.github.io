import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import type { Section, PageMeta } from '@bool/json-editor-core';
import { useEditor } from '../../context/EditorContext.tsx';
import { cn } from '../../lib/cn.ts';
import { l } from '../../locales/index.ts';
import styles from './Sidebar.module.css';

function isSectionDirty(section: Section): boolean {
  for (const field of section.fields) {
    if (field.isDirty) return true;
  }
  for (const group of section.repeatingGroups) {
    for (const item of group.items) {
      for (const field of item.fields) {
        if (field.isDirty) return true;
      }
    }
  }
  return false;
}

export default function Sidebar() {
  const { state, dispatch, sidebarCollapsed, sidebarWidth } = useEditor();
  const { sections, pages, sharedSections, activeSection } = state;
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const hasManuallyResized = useRef(false);
  const [expandedPages, setExpandedPages] = useState<Set<string>>(
    () => new Set(pages.map((p) => p.name))
  );

  const sectionMap = useMemo(() => new Map(sections.map((s) => [s.name, s])), [sections]);

  const dirtySet = useMemo(
    () => new Set(sections.filter(isSectionDirty).map((s) => s.name)),
    [sections]
  );

  // Auto-size sidebar to fit the longest label
  useEffect(() => {
    if (hasManuallyResized.current || sidebarCollapsed) return;
    const list = listRef.current;
    if (!list) return;

    const labels = list.querySelectorAll(`.${styles.label}, .${styles.pageLabel}`);
    if (labels.length === 0) return;

    // Measure natural width using an off-screen element
    const measurer = document.createElement('span');
    measurer.style.cssText =
      'position:absolute;visibility:hidden;white-space:nowrap;pointer-events:none;';
    document.body.appendChild(measurer);

    let maxWidth = 0;
    for (const label of labels) {
      const computed = getComputedStyle(label);
      measurer.style.font = computed.font;
      measurer.style.fontFamily = computed.fontFamily;
      measurer.style.fontSize = computed.fontSize;
      measurer.style.fontWeight = computed.fontWeight;
      measurer.style.letterSpacing = computed.letterSpacing;
      measurer.style.textTransform = computed.textTransform;
      measurer.textContent = label.textContent;
      maxWidth = Math.max(maxWidth, measurer.offsetWidth);
    }
    document.body.removeChild(measurer);

    // Add padding for: indent (2.25rem ≈ 36px) + right padding + dirty dot + buffer
    const totalWidth = Math.ceil(maxWidth + 72);
    if (totalWidth > sidebarWidth) {
      dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: totalWidth });
    }
  }, [sections, pages, sidebarCollapsed, dispatch, sidebarWidth]);

  const handleToggle = useCallback(() => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  }, [dispatch]);

  const togglePage = useCallback((pageName: string) => {
    setExpandedPages((prev) => {
      const next = new Set(prev);
      if (next.has(pageName)) next.delete(pageName);
      else next.add(pageName);
      return next;
    });
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };

      const handleMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const delta = ev.clientX - resizeRef.current.startX;
        dispatch({ type: 'SET_SIDEBAR_WIDTH', payload: resizeRef.current.startWidth + delta });
      };

      const handleUp = () => {
        resizeRef.current = null;
        hasManuallyResized.current = true;
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [sidebarWidth, dispatch]
  );

  // Determine which sections are assigned to pages vs unassigned
  const assignedSections = useMemo(() => {
    const assigned = new Set<string>();
    for (const page of pages) {
      for (const name of page.sectionNames) assigned.add(name);
    }
    for (const name of sharedSections) assigned.add(name);
    return assigned;
  }, [pages, sharedSections]);

  const unassignedSections = useMemo(
    () => sections.filter((s) => !assignedSections.has(s.name) && s.name !== '_meta'),
    [sections, assignedSections]
  );

  const hasPages = pages.length > 0;
  const sharedSet = useMemo(() => new Set(sharedSections), [sharedSections]);

  const renderSectionItem = (sectionName: string, context: 'page' | 'shared') => {
    const section = sectionMap.get(sectionName);
    if (!section) return null;

    const isSharedUnderPage = context === 'page' && sharedSet.has(sectionName);

    return (
      <button
        key={`${sectionName}-${context}`}
        type="button"
        className={cn(
          styles.item,
          activeSection === sectionName && styles.itemActive,
          isSharedUnderPage && styles.itemShared
        )}
        onClick={() =>
          dispatch({ type: 'SET_ACTIVE_SECTION', payload: { name: sectionName, context } })
        }
      >
        <span className={styles.label}>
          {section.label}
          {isSharedUnderPage && <span className={styles.sharedTag}>{l('sidebar.sharedTag')}</span>}
        </span>
        {dirtySet.has(sectionName) && <span className={styles.dirtyDot} />}
      </button>
    );
  };

  const renderPageGroup = (page: PageMeta) => {
    const isExpanded = expandedPages.has(page.name);
    const pageDirty = page.sectionNames.some((name) => dirtySet.has(name));

    return (
      <div key={page.name} className={styles.pageGroup}>
        <button type="button" className={styles.pageHeader} onClick={() => togglePage(page.name)}>
          <ChevronDown
            size={14}
            className={cn(styles.pageChevron, isExpanded && styles.pageChevronOpen)}
          />
          <span className={styles.pageLabel}>{page.label}</span>
          {pageDirty && <span className={styles.dirtyDot} />}
        </button>
        {isExpanded && (
          <div className={styles.pageSections}>
            {page.sectionNames.map((name) => renderSectionItem(name, 'page'))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside
      className={cn(styles.sidebar, sidebarCollapsed && styles.collapsed)}
      style={
        { '--sidebar-width': `${sidebarCollapsed ? 40 : sidebarWidth}px` } as React.CSSProperties
      }
    >
      <div className={styles.header}>
        <span className={styles.heading}>
          {hasPages ? l('sidebar.pages') : l('sidebar.sections')}
        </span>
      </div>

      <div ref={listRef} className={styles.list}>
        {hasPages ? (
          <>
            {pages.map(renderPageGroup)}

            {sharedSections.length > 0 && (
              <div className={styles.pageGroup}>
                <button
                  type="button"
                  className={styles.pageHeader}
                  onClick={() => togglePage('_shared')}
                >
                  <ChevronDown
                    size={14}
                    className={cn(
                      styles.pageChevron,
                      expandedPages.has('_shared') && styles.pageChevronOpen
                    )}
                  />
                  <span className={styles.pageLabel}>{l('sidebar.shared')}</span>
                </button>
                {expandedPages.has('_shared') && (
                  <div className={styles.pageSections}>
                    {sharedSections.map((name) => renderSectionItem(name, 'shared'))}
                  </div>
                )}
              </div>
            )}

            {unassignedSections.length > 0 && (
              <div className={styles.pageGroup}>
                <button
                  type="button"
                  className={styles.pageHeader}
                  onClick={() => togglePage('_other')}
                >
                  <ChevronDown
                    size={14}
                    className={cn(
                      styles.pageChevron,
                      expandedPages.has('_other') && styles.pageChevronOpen
                    )}
                  />
                  <span className={styles.pageLabel}>{l('sidebar.other')}</span>
                </button>
                {expandedPages.has('_other') && (
                  <div className={styles.pageSections}>
                    {unassignedSections.map((s) => renderSectionItem(s.name, 'shared'))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          // Fallback: flat section list (no _meta keys present)
          sections.map((section) => renderSectionItem(section.name, 'shared'))
        )}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={handleToggle}
          title={sidebarCollapsed ? l('sidebar.expand') : l('sidebar.collapse')}
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <div className={styles.resizeHandle} onMouseDown={handleResizeStart} />
    </aside>
  );
}
