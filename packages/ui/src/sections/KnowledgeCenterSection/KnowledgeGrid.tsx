import { useState } from 'react';
import FilterableGrid from '../../compositions/FilterableGrid/FilterableGrid';
import FlipCard, { flipCardStyles as styles } from '../../compositions/FlipCard/FlipCard';
import InsightArticleModal from '../../compositions/InsightArticleModal/InsightArticleModal';
import type {
  InsightArticleData,
  InsightArticleLabels,
} from '../../compositions/InsightArticleModal/InsightArticleModal';
import Icon from '../../primitives/Icon/Icon';

interface ArticleItem {
  category: string;
  title: string;
  author: string;
  authorAvatar?: string;
  readTime: string;
  views?: string;
  href: string;
  tags: string[];
  frontImage?: string;
  subtitle?: string;
  challenge?: string;
  solution?: string;
  publishDate?: string;
  metrics?: Array<{ value: string; label: string }>;
  techStack?: string[];
}

interface Props {
  articles: ArticleItem[];
  filters: string[];
  labels: {
    close: string;
    readArticle: string;
    readTime: string;
    views: string;
    emptyMessage: string;
    filterAriaLabel: string;
    aboutThisArticle: string;
    published: string;
    relatedTopics: string;
    backToArticles: string;
    copyLink: string;
    copied: string;
    shareChannels: Array<{ key: string; visible: boolean }>;
  };
}

function ArticleFlipCard({
  item,
  onReadArticle,
  labels,
}: {
  item: ArticleItem;
  onReadArticle: (item: ArticleItem) => void;
  labels: { readArticle: string; readTime: string; views: string };
}) {
  return (
    <FlipCard
      frontContent={
        item.frontImage ? (
          <>
            <img
              src={item.frontImage}
              alt={item.title}
              className={styles.frontImage}
              loading="lazy"
              decoding="async"
              width={600}
              height={400}
            />
            <div className={styles.frontOverlay} />
            <div className={styles.frontContent}>
              <span className={styles.frontLabel}>{item.category}</span>
              <div className={styles.frontTitle}>{item.title}</div>
            </div>
          </>
        ) : (
          <div className={styles.frontContent}>
            <span className={styles.frontLabel}>{item.category}</span>
            <div className={styles.frontTitle}>{item.title}</div>
          </div>
        )
      }
      backContent={
        <div className={styles.backContent}>
          <span className={styles.backTag}>{item.category}</span>
          <h3 className={styles.backTitle}>{item.title}</h3>
          <div className={styles.metricsStrip}>
            <div>
              <div className={styles.metricValue}>{item.readTime}</div>
              <div className={styles.metricLabel}>{labels.readTime}</div>
            </div>
            {item.views && (
              <div>
                <div className={styles.metricValue}>{item.views}</div>
                <div className={styles.metricLabel}>{labels.views}</div>
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.backCta}
            onClick={(e) => {
              e.stopPropagation();
              onReadArticle(item);
            }}
          >
            {labels.readArticle}
            <Icon name="arrow-right" size={20} strokeWidth={2.5} />
          </button>
        </div>
      }
    />
  );
}

function toModalArticle(
  item: ArticleItem,
  shareChannels: Array<{ key: string; visible: boolean }>
): InsightArticleData {
  return {
    category: item.category,
    title: item.title,
    description: item.subtitle ?? '',
    frontImage: item.frontImage,
    highlightedContent: item.challenge ?? '',
    content: item.solution ?? '',
    author: item.author,
    authorAvatar: item.authorAvatar,
    readTime: item.readTime,
    publishDate: item.publishDate ?? '',
    relatedTopics: item.techStack ?? [],
    shareChannels,
    url: item.href,
  };
}

export default function KnowledgeGrid({ articles, filters, labels }: Props) {
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

  const modalLabels: InsightArticleLabels = {
    close: labels.close,
    aboutThisArticle: labels.aboutThisArticle,
    readTime: labels.readTime,
    published: labels.published,
    relatedTopics: labels.relatedTopics,
    backToArticles: labels.backToArticles,
    copyLink: labels.copyLink,
    copied: labels.copied,
  };

  return (
    <>
      <FilterableGrid
        data={articles}
        filterGroups={[{ items: filters, ariaLabel: labels.filterAriaLabel }]}
        matchFilter={(item, _, activeIndex) => {
          if (activeIndex === 0) return true;
          return item.tags.some((tag) => tag.toUpperCase() === filters[activeIndex].toUpperCase());
        }}
        renderItem={(item, i) => (
          <ArticleFlipCard
            key={`${item.title}-${i}`}
            item={item}
            onReadArticle={setSelectedArticle}
            labels={{
              readArticle: labels.readArticle,
              readTime: labels.readTime,
              views: labels.views,
            }}
          />
        )}
        emptyMessage={labels.emptyMessage}
        ariaLabel={labels.filterAriaLabel}
      />
      <InsightArticleModal
        article={selectedArticle ? toModalArticle(selectedArticle, labels.shareChannels) : null}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        labels={modalLabels}
      />
    </>
  );
}
