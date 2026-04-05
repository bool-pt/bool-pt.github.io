import { useState } from 'react';
import ArticleModal from '../../compositions/ArticleModal/ArticleModal';
import FilterableGrid from '../../compositions/FilterableGrid/FilterableGrid';
import FlipCard, { flipCardStyles as styles } from '../../compositions/FlipCard/FlipCard';
import Icon from '../../primitives/Icon/Icon';

interface CaseItem {
  title: string;
  description: string;
  client: string;
  tags: string[];
  image: string;
  frontImage?: string;
  metrics?: Array<{ value: string; label: string }>;
  challenge?: string;
  solution?: string;
  techStack?: string[];
}

interface Props {
  cases: CaseItem[];
  sectors: string[];
  techFilters: string[];
  labels: {
    close: string;
    fullCaseStudy: string;
    emptyMessage: string;
    filterAriaLabel: string;
    challenge: string;
    solution: string;
    techStack: string;
    talkToExpert: string;
    backToCases: string;
    ctaHref: string;
  };
}

function CaseFlipCard({
  item,
  onOpenModal,
  ctaLabel,
}: {
  item: CaseItem;
  onOpenModal: (item: CaseItem) => void;
  ctaLabel: string;
}) {
  const tagDisplay = item.tags.map((t) => t.toUpperCase()).join(' · ');

  return (
    <FlipCard
      frontContent={
        item.frontImage ? (
          <>
            <img src={item.frontImage} alt="" className={styles.frontImage} loading="lazy" />
            <div className={styles.frontOverlay} />
            <div className={styles.frontContent}>
              <span className={styles.frontLabel}>{item.client}</span>
              <div className={styles.frontTitle}>{item.title}</div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.frontIcon}>
              <Icon name="image-placeholder" size={48} />
            </div>
            <span className={styles.frontLabel}>{item.client}</span>
          </>
        )
      }
      backContent={
        <>
          <div className={styles.backOverlay} />
          <div className={styles.backContent}>
            <span className={styles.backTag}>{tagDisplay}</span>
            <h3 className={styles.backTitle}>{item.title}</h3>
            {item.metrics && item.metrics.length > 0 && (
              <div className={styles.metricsStrip}>
                {item.metrics.map((metric) => (
                  <div key={metric.label}>
                    <div className={styles.metricValue}>{metric.value}</div>
                    <div className={styles.metricLabel}>{metric.label}</div>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              className={styles.backCta}
              onClick={(e) => {
                e.stopPropagation();
                onOpenModal(item);
              }}
            >
              {ctaLabel}
              <Icon name="arrow-right" size={20} strokeWidth={2.5} />
            </button>
          </div>
        </>
      }
    />
  );
}

export default function CaseStudyGrid({ cases, sectors, techFilters, labels }: Props) {
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);

  const modalArticle = selectedCase
    ? {
        category: selectedCase.tags.map((t) => t.toUpperCase()).join(' · '),
        title: selectedCase.title,
        subtitle: `${selectedCase.client} · ${selectedCase.tags[0] || ''}`,
        frontImage: selectedCase.frontImage,
        challenge: selectedCase.challenge,
        solution: selectedCase.solution,
        metrics: selectedCase.metrics,
        techStack: selectedCase.techStack,
        readTime: '',
      }
    : null;

  return (
    <>
      <FilterableGrid
        data={cases}
        filterGroups={[
          { items: sectors, ariaLabel: labels.filterAriaLabel },
          { items: techFilters, ariaLabel: labels.filterAriaLabel, toggle: true },
        ]}
        matchFilter={(item, groupIndex, activeIndex) => {
          if (groupIndex === 0)
            return (
              activeIndex === 0 ||
              item.tags.some((tag) => tag.toUpperCase() === sectors[activeIndex])
            );
          return (
            activeIndex === -1 ||
            item.tags.some((tag) => tag.toUpperCase() === techFilters[activeIndex])
          );
        }}
        renderItem={(item, i) => (
          <CaseFlipCard
            key={`${item.title}-${i}`}
            item={item}
            onOpenModal={setSelectedCase}
            ctaLabel={labels.fullCaseStudy}
          />
        )}
        emptyMessage={labels.emptyMessage}
        ariaLabel={labels.filterAriaLabel}
      />
      <ArticleModal
        article={modalArticle}
        open={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        labels={{
          close: labels.close,
          challenge: labels.challenge,
          solution: labels.solution,
          techStack: labels.techStack,
          talkToExpert: labels.talkToExpert,
          backToArticles: labels.backToCases,
          ctaHref: labels.ctaHref,
        }}
      />
    </>
  );
}
