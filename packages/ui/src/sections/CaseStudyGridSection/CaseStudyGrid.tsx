import { useEffect, useState } from 'react';
import ArticleModal from '../../compositions/ArticleModal/ArticleModal';
import FilterableGrid from '../../compositions/FilterableGrid/FilterableGrid';
import FlipCard, { flipCardStyles as styles } from '../../compositions/FlipCard/FlipCard';
import Icon from '../../primitives/Icon/Icon';

/** Shuffle a list (new array, input untouched) so the grid doesn't always lead
 *  with the same cards. Decorate-sort-undecorate avoids index assertions. */
function shuffle<T>(input: T[]): T[] {
  return input
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.value);
}

export interface CaseFlipItem {
  client: string;
  title: string;
  subtitle: string;
  coverImageSrc: string;
  sector: string;
  tech: string;
  techKey: string;
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
  techFilters: Array<{ key: string; label: string }>;
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
            <span className={styles.frontLabel}>{`${item.sector} - ${item.tech}`}</span>
            <div className={styles.frontTitle}>{item.subtitle}</div>
            {item.tags.length > 0 && (
              <div className={styles.frontTags}>
                {item.tags.map((tag) => (
                  <span key={tag} className={styles.frontTag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      }
      backContent={
        <>
          <div className={styles.backOverlay} />
          <div className={styles.backContent}>
            <span className={styles.backTag}>{item.backHeader}</span>
            {item.subtitle && <h3 className={styles.backTitle}>{item.subtitle}</h3>}
            {item.benefits && <p className={styles.backBenefits}>{item.benefits}</p>}
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

  // Randomise card order so the "All" view doesn't always lead with the same
  // cases. The shuffle is client-only (per visit): `orderedCases` starts null
  // (render a skeleton, not the SSR order) and is filled once on mount, so the
  // first real paint is already shuffled and there's no hydration mismatch.
  const [orderedCases, setOrderedCases] = useState<CaseFlipItem[] | null>(null);
  useEffect(() => {
    setOrderedCases(shuffle(cases));
  }, [cases]);

  if (orderedCases === null) {
    return (
      <div data-testid="case-study-grid">
        <div className="cs-skeleton-pills" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => (
            <span key={i} className="cs-skeleton-pill" />
          ))}
        </div>
        <div className="cs-skeleton-grid" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cs-skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  const modalArticle = selectedCase
    ? {
        category: selectedCase.backHeader,
        title: selectedCase.subtitle,
        frontImage: selectedCase.coverImageSrc,
        challenge: selectedCase.challenge,
        solution: selectedCase.solution,
        benefits: selectedCase.benefits,
        metrics: selectedCase.metrics,
        techStack: selectedCase.tags,
      }
    : null;

  return (
    <div data-testid="case-study-grid">
      <FilterableGrid
        data={orderedCases}
        filterGroups={[
          { items: sectors, ariaLabel: labels.filterAriaLabel },
          {
            items: techFilters.map((f) => f.label),
            ariaLabel: labels.filterAriaLabel,
            toggle: true,
          },
        ]}
        matchFilter={(item, groupIndex, activeIndex) => {
          if (groupIndex === 0) {
            return activeIndex === 0 || item.sector.toUpperCase() === sectors[activeIndex];
          }
          return activeIndex === -1 || item.techKey === techFilters[activeIndex].key;
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
