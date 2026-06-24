import { useEffect, useState } from 'react';
import ContentModal, { type ContentModalData } from '../ContentModal/ContentModal';

interface Props {
  modals: ContentModalData[];
  closeLabel: string;
}

const PREFIX = 'modal:';

/**
 * Single global listener that turns any `<a href="modal:<key>">` on the page
 * into a button that opens the matching content modal. Buttons stay static
 * server-rendered links (progressively enhanced) — this island just intercepts
 * the click and renders the dialog.
 */
export default function ModalHost({ modals, closeLabel }: Props) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  useEffect(() => {
    const keys = new Set(modals.map((m) => m.key));

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const target = e.target as HTMLElement | null;
      const link = target?.closest<HTMLAnchorElement>(`a[href^="${PREFIX}"]`);
      if (!link) return;
      const key = (link.getAttribute('href') ?? '').slice(PREFIX.length);
      if (!keys.has(key)) return;
      e.preventDefault();
      setActiveKey(key);
    };

    document.addEventListener('click', onClick);
    // a11y: announce that these links open a dialog.
    document
      .querySelectorAll(`a[href^="${PREFIX}"]`)
      .forEach((el) => el.setAttribute('aria-haspopup', 'dialog'));

    return () => document.removeEventListener('click', onClick);
  }, [modals]);

  const active = modals.find((m) => m.key === activeKey) ?? null;

  return (
    <ContentModal
      modal={active}
      open={active !== null}
      onClose={() => setActiveKey(null)}
      closeLabel={closeLabel}
    />
  );
}
