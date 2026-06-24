import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';
import Icon from '../../primitives/Icon/Icon';
import ShareMenu from '../ShareMenu/ShareMenu';
import styles from './InsightArticleModal.module.css';

export interface ShareChannel {
  key: string;
  visible: boolean;
}

export interface InsightArticleData {
  category: string;
  title: string;
  description: string;
  frontImage?: string;
  highlightedContent: string;
  content: string;
  author: string;
  authorAvatar?: string;
  readTime: string;
  publishDate: string;
  relatedTopics: string[];
  shareChannels: ShareChannel[];
  url: string;
}

export interface InsightArticleLabels {
  close: string;
  aboutThisArticle: string;
  readTime: string;
  published: string;
  relatedTopics: string;
  backToArticles: string;
  copyLink: string;
  copied: string;
}

interface Props {
  article: InsightArticleData | null;
  open: boolean;
  onClose: () => void;
  labels: InsightArticleLabels;
}

export default function InsightArticleModal({ article, open, onClose, labels }: Props) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!article) return null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
          setFullscreen(false);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.overlay} />
        <DialogPrimitive.Content
          className={`${styles.dialog} ${fullscreen ? styles.dialogFullscreen : ''}`}
        >
          <div className={styles.content}>
            <div className={styles.toolbar}>
              <button
                type="button"
                className={styles.toolbarBtn}
                onClick={() => setFullscreen(!fullscreen)}
                aria-label={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              >
                {fullscreen ? (
                  <Minimize2 size={18} strokeWidth={2} />
                ) : (
                  <Maximize2 size={18} strokeWidth={2} />
                )}
              </button>
              <DialogPrimitive.Close className={styles.toolbarBtn}>
                <X size={20} aria-hidden="true" />
                <span className="sr-only">{labels.close}</span>
              </DialogPrimitive.Close>
            </div>

            <span className={styles.category}>{article.category}</span>
            <DialogPrimitive.Title className={styles.title}>{article.title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className={styles.description}>
              {article.description}
            </DialogPrimitive.Description>

            {article.frontImage && (
              <div className={styles.imageWrap}>
                <img
                  src={article.frontImage}
                  alt={article.title}
                  className={styles.image}
                  loading="lazy"
                  decoding="async"
                  width={1200}
                  height={500}
                />
              </div>
            )}

            <div className={styles.bodyColumns}>
              <p className={styles.bodyHighlight}>{article.highlightedContent}</p>
              <p className={styles.bodyContent}>{article.content}</p>
            </div>

            <div className={styles.aboutCard}>
              <h3 className={styles.aboutHeading}>{labels.aboutThisArticle}</h3>
              <div className={styles.aboutInner}>
                <div className={styles.authorSection}>
                  <div className={styles.avatar}>
                    {article.authorAvatar ? (
                      <img
                        src={article.authorAvatar}
                        alt={article.author}
                        className={styles.avatarImg}
                        width={48}
                        height={48}
                      />
                    ) : (
                      <Icon name="user" size={24} strokeWidth={2} />
                    )}
                  </div>
                  <div className={styles.authorDetails}>
                    <div className={styles.authorInfo}>
                      <p className={styles.authorName}>{article.author}</p>
                      <p className={styles.authorRole}>{article.category}</p>
                    </div>
                    <div className={styles.authorDivider} />
                    <div className={styles.authorMeta}>
                      <p className={styles.authorMetaLine}>{article.readTime}</p>
                      <p className={styles.authorMetaLine}>{article.publishDate}</p>
                    </div>
                  </div>
                </div>

                <div className={styles.rightColumn}>
                  <div className={styles.topicsSection}>
                    <p className={styles.topicsLabel}>{labels.relatedTopics}</p>
                    <div className={styles.topicsPills}>
                      {article.relatedTopics.map((topic) => (
                        <span key={topic} className={styles.topicPill}>
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.shareSection}>
                    <ShareMenu
                      url={article.url}
                      title={article.title}
                      channels={article.shareChannels}
                      labels={{
                        copyLink: labels.copyLink,
                        copied: labels.copied,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.footer}>
              <button type="button" className={styles.backLink} onClick={onClose}>
                <Icon name="arrow-left" size={16} strokeWidth={2.5} />
                {labels.backToArticles}
              </button>
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
