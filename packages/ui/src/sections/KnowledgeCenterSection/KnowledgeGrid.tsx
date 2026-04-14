import { useState } from 'react';
import ArticleModal from '../../compositions/ArticleModal/ArticleModal';
import FilterableGrid from '../../compositions/FilterableGrid/FilterableGrid';
import FlipCard, { flipCardStyles as styles } from '../../compositions/FlipCard/FlipCard';
import Icon from '../../primitives/Icon/Icon';

interface Metric {
  value: string;
  label: string;
}

interface ArticleItem {
  category: string;
  title: string;
  author: string;
  readTime: string;
  views?: string;
  href: string;
  tags: string[];
  frontImage?: string;
  subtitle?: string;
  challenge?: string;
  solution?: string;
  metrics?: Metric[];
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
    challenge: string;
    solution: string;
    techStack: string;
    talkToExpert: string;
    backToArticles: string;
    ctaHref: string;
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

export default function KnowledgeGrid({ articles, filters, labels }: Props) {
  const [selectedArticle, setSelectedArticle] = useState<ArticleItem | null>(null);

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
      <ArticleModal
        article={selectedArticle}
        open={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        labels={labels}
      />
    </>
  );
}
