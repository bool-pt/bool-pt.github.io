import { useState } from 'react';
import ArticleModal from '../../compositions/ArticleModal/ArticleModal';
import FilterableGrid from '../../compositions/FilterableGrid/FilterableGrid';
import FlipCard, { flipCardStyles as styles } from '../../compositions/FlipCard/FlipCard';
import Icon from '../../primitives/Icon/Icon';

export interface CaseFlipItem {
  client: string;
  title: string;
  subtitle: string;
  coverImageSrc: string;
  sector: string;
  tech: string;
  backHeader: string;
  modalSubheading: string;
  metrics: Array<{ value: string; label: string }>;
  challenge: string;
  solution: string;
  benefits: string;
  team: string;
  duration: string;
  tags: string[];
}

interface Props {
  cases: CaseFlipItem[];
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
  item: CaseFlipItem;
  onOpenModal: (item: CaseFlipItem) => void;
  ctaLabel: string;
}) {
  return (
    <FlipCard
      frontContent={
        <>
          <img
            src={item.coverImageSrc}
            alt={item.client}
            className={styles.frontImage}
            loading="lazy"
            decoding="async"
            width={600}
            height={400}
          />
          <div className={styles.frontOverlay} />
          <div className={styles.frontContent}>
            <span className={styles.frontLabel}>{item.title.toUpperCase()}</span>
            <div className={styles.frontTitle}>{item.subtitle}</div>
          </div>
        </>
      }
      backContent={
        <>
          <div className={styles.backOverlay} />
          <div className={styles.backContent}>
            <span className={styles.backTag}>{item.backHeader}</span>
            <h3 className={styles.backTitle}>{item.subtitle}</h3>
            {item.metrics.length > 0 && (
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
  const [selectedCase, setSelectedCase] = useState<CaseFlipItem | null>(null);

  const modalArticle = selectedCase
    ? {
        category: selectedCase.backHeader,
        title: selectedCase.subtitle,
        subtitle: selectedCase.modalSubheading,
        frontImage: selectedCase.coverImageSrc,
        challenge: selectedCase.challenge,
        solution: selectedCase.solution,
        metrics: selectedCase.metrics,
        techStack: selectedCase.tags,
      }
    : null;

  return (
    <div data-testid="case-study-grid">
      <FilterableGrid
        data={cases}
        filterGroups={[
          { items: sectors, ariaLabel: labels.filterAriaLabel },
          { items: techFilters, ariaLabel: labels.filterAriaLabel, toggle: true },
        ]}
        matchFilter={(item, groupIndex, activeIndex) => {
          if (groupIndex === 0) {
            return activeIndex === 0 || item.sector.toUpperCase() === sectors[activeIndex];
          }
          return activeIndex === -1 || item.tech.toUpperCase() === techFilters[activeIndex];
        }}
        renderItem={(item, i) => (
          <CaseFlipCard
            key={`${item.subtitle}-${i}`}
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
    </div>
  );
}
