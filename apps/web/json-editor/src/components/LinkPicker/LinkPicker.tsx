import { useState } from 'react';
import { cn } from '../../lib/cn.ts';
import { LINK_BASE, LINK_PAGES } from '../../linkManifest.ts';
import styles from './LinkPicker.module.css';
import ModalForm from './ModalForm.tsx';

interface Props {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

type Mode = 'internal' | 'external' | 'modal';

interface Parsed {
  mode: Mode;
  pagePath: string;
  sectionId: string;
  cardId: string;
}

function parse(value: string): Parsed {
  if (value.startsWith('modal:')) {
    return { mode: 'modal', pagePath: LINK_PAGES[0]?.path ?? LINK_BASE, sectionId: '', cardId: '' };
  }
  if (value.startsWith(LINK_BASE)) {
    const hashIdx = value.indexOf('#');
    const path = hashIdx === -1 ? value : value.slice(0, hashIdx);
    const hash = hashIdx === -1 ? '' : value.slice(hashIdx + 1);
    const page = LINK_PAGES.find((p) => p.path === path);
    if (page) {
      let sectionId = '';
      let cardId = '';
      if (hash) {
        const exact = page.sections.find((s) => s.id === hash);
        if (exact) {
          sectionId = exact.id;
        } else {
          // `<sectionId>-<cardId>` form
          const withCard = page.sections.find((s) =>
            s.cards?.some((c) => hash === `${s.id}-${c.id}`)
          );
          if (withCard) {
            sectionId = withCard.id;
            cardId = hash.slice(withCard.id.length + 1);
          } else {
            sectionId = hash; // unknown anchor — keep verbatim
          }
        }
      }
      return { mode: 'internal', pagePath: page.path, sectionId, cardId };
    }
  }
  return {
    mode: 'external',
    pagePath: LINK_PAGES[0]?.path ?? LINK_BASE,
    sectionId: '',
    cardId: '',
  };
}

export default function LinkPicker({ value, onChange, disabled = false }: Props) {
  const parsed = parse(value);

  // `mode` is the only persistent UI state — it lets the editor switch to a
  // custom/external value even when the current value looks internal, and back.
  // Everything else is derived from `value` (controlled). Re-sync mode when the
  // value changes externally (undo/redo/load).
  const [mode, setMode] = useState<Mode>(parsed.mode);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setMode(parse(value).mode);
  }

  const currentPage = LINK_PAGES.find((p) => p.path === parsed.pagePath) ?? LINK_PAGES[0];
  const sections = currentPage?.sections ?? [];
  const currentSection = sections.find((s) => s.id === parsed.sectionId);
  const cards = currentSection?.cards ?? [];

  const selectInternal = () => {
    setMode('internal');
    if (!value.startsWith(LINK_BASE) && currentPage) onChange(currentPage.path);
  };

  const tabs = (
    <div className={styles.tabs} role="tablist" aria-label="Link type">
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'internal'}
        className={cn(styles.tab, mode === 'internal' && styles.tabActive)}
        onClick={() => !disabled && selectInternal()}
        disabled={disabled}
      >
        Internal page
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'external'}
        className={cn(styles.tab, mode === 'external' && styles.tabActive)}
        onClick={() => !disabled && setMode('external')}
        disabled={disabled}
      >
        External / custom
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'modal'}
        className={cn(styles.tab, mode === 'modal' && styles.tabActive)}
        onClick={() => !disabled && setMode('modal')}
        disabled={disabled}
      >
        Open modal
      </button>
    </div>
  );

  if (mode === 'modal') {
    return (
      <div className={styles.wrap}>
        {tabs}
        <ModalForm value={value} onChange={onChange} disabled={disabled} />
      </div>
    );
  }

  if (mode === 'external') {
    return (
      <div className={styles.wrap}>
        {tabs}
        <input
          type="text"
          className={styles.input}
          value={value}
          disabled={disabled}
          placeholder="https://example.com  ·  mailto:…  ·  /custom/path"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      {tabs}
      <div className={styles.row}>
        <label className={styles.seg}>
          <span className={styles.segLabel}>Base</span>
          <select className={styles.select} value={LINK_BASE} disabled aria-label="Base path">
            <option value={LINK_BASE}>{LINK_BASE}/</option>
          </select>
        </label>
        <label className={styles.seg}>
          <span className={styles.segLabel}>Page</span>
          <select
            className={styles.select}
            value={parsed.pagePath}
            disabled={disabled}
            aria-label="Page"
            onChange={(e) => onChange(e.target.value)}
          >
            {LINK_PAGES.map((page) => (
              <option key={page.path} value={page.path}>
                {page.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.seg}>
          <span className={styles.segLabel}>Section</span>
          <select
            className={styles.select}
            value={parsed.sectionId}
            disabled={disabled}
            aria-label="Section anchor"
            onChange={(e) =>
              onChange(parsed.pagePath + (e.target.value ? `#${e.target.value}` : ''))
            }
          >
            <option value="">(top of page)</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.label}
              </option>
            ))}
          </select>
        </label>
        {cards.length > 0 && (
          <label className={styles.seg}>
            <span className={styles.segLabel}>Card</span>
            <select
              className={styles.select}
              value={parsed.cardId}
              disabled={disabled}
              aria-label="Card anchor"
              onChange={(e) =>
                onChange(
                  `${parsed.pagePath}#${parsed.sectionId}${e.target.value ? `-${e.target.value}` : ''}`
                )
              }
            >
              <option value="">(whole section)</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <code className={styles.preview}>{value || `${LINK_BASE}/`}</code>
    </div>
  );
}
