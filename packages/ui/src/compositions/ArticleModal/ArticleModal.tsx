import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import Icon from '../../primitives/Icon/Icon';
import styles from './ArticleModal.module.css';

interface Metric {
  value: string;
  label: string;
}

export interface ArticleModalData {
  category: string;
  title: string;
  subtitle?: string;
  frontImage?: string;
  challenge?: string;
  solution?: string;
  metrics?: Metric[];
  techStack?: string[];
}

export interface ArticleModalLabels {
  close: string;
  challenge: string;
  solution: string;
  techStack: string;
  talkToExpert: string;
  backToArticles: string;
  ctaHref: string;
}

interface Props {
  article: ArticleModalData | null;
  open: boolean;
  onClose: () => void;
  labels: ArticleModalLabels;
}

export default function ArticleModal({ article, open, onClose, labels }: Props) {
  if (!article) return null;

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
          <div className={styles.content}>
            <DialogPrimitive.Close className={styles.closeButton}>
              <X size={24} aria-hidden="true" />
              <span className="sr-only">{labels.close}</span>
            </DialogPrimitive.Close>

            <span className={styles.category}>{article.category}</span>
            <h2 className={styles.title}>{article.title}</h2>
            {article.subtitle && (
              <DialogPrimitive.Description className="sr-only">
                {article.subtitle}
              </DialogPrimitive.Description>
            )}
            {!article.subtitle && (
              <DialogPrimitive.Description className="sr-only">
                {article.category} — {article.title}
              </DialogPrimitive.Description>
            )}
            {article.subtitle && <p className={styles.subtitle}>{article.subtitle}</p>}

            {article.frontImage && (
              <div className={styles.imageWrap}>
                <img src={article.frontImage} alt="" className={styles.image} loading="lazy" />
              </div>
            )}

            {(article.challenge || article.solution) && (
              <div className={styles.columns}>
                {article.challenge && (
                  <div>
                    <div className={styles.columnLabel}>{labels.challenge}</div>
                    <p className={styles.columnText}>{article.challenge}</p>
                  </div>
                )}
                {article.solution && (
                  <div>
                    <div className={styles.columnLabel}>{labels.solution}</div>
                    <p className={styles.columnText}>{article.solution}</p>
                  </div>
                )}
              </div>
            )}

            {article.metrics && article.metrics.length > 0 && (
              <div className={styles.metricsRow}>
                {article.metrics.map((m) => (
                  <div key={m.label} className={styles.metricCard}>
                    <div className={styles.metricValue}>{m.value}</div>
                    <div className={styles.metricLabel}>{m.label}</div>
                  </div>
                ))}
              </div>
            )}

            {article.techStack && article.techStack.length > 0 && (
              <div className={styles.techRow}>
                <div className={styles.techLabel}>{labels.techStack}</div>
                <div className={styles.techPillsRow}>
                  <div className={styles.techPills}>
                    {article.techStack.map((tech) => (
                      <span key={tech} className={styles.pill}>
                        {tech}
                      </span>
                    ))}
                  </div>
                  <a href={labels.ctaHref} className={styles.ctaButton}>
                    {labels.talkToExpert}
                  </a>
                </div>
              </div>
            )}

            <DialogPrimitive.Title className="sr-only">{article.title}</DialogPrimitive.Title>

            <button type="button" className={styles.backLink} onClick={onClose}>
              <Icon name="arrow-left" size={16} strokeWidth={2.5} />
              {labels.backToArticles}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
