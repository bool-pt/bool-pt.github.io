import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import styles from './ContentModal.module.css';

export interface ContentModalData {
  /** Stable key, referenced by buttons as `modal:<key>`. */
  key: string;
  title: string;
  body: string;
  image?: string;
  ctaLabel?: string;
  ctaHref?: string;
}

interface Props {
  modal: ContentModalData | null;
  open: boolean;
  onClose: () => void;
  closeLabel: string;
}

/**
 * Generic, content-driven modal opened from any button via `modal:<key>`.
 * Content is authored in en.json under `modals.<key>.*`.
 */
export default function ContentModal({ modal, open, onClose, closeLabel }: Props) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content className={styles.dialog}>
          <DialogPrimitive.Close className={styles.closeButton} aria-label={closeLabel}>
            <X size={24} aria-hidden="true" />
          </DialogPrimitive.Close>

          {modal?.image && (
            <div className={styles.imageWrap}>
              <img
                src={modal.image}
                alt=""
                className={styles.image}
                loading="lazy"
                decoding="async"
                width={1200}
                height={500}
              />
            </div>
          )}

          <DialogPrimitive.Title className={styles.title}>
            {modal?.title ?? ''}
          </DialogPrimitive.Title>

          {modal?.body && (
            <DialogPrimitive.Description asChild>
              <p className={styles.body}>{modal.body}</p>
            </DialogPrimitive.Description>
          )}

          {modal?.ctaLabel && modal.ctaHref && (
            <a href={modal.ctaHref} className={styles.cta}>
              {modal.ctaLabel}
            </a>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
