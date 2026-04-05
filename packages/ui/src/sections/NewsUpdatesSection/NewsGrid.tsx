import FilterableGrid from '../../compositions/FilterableGrid/FilterableGrid';
import Icon from '../../primitives/Icon/Icon';
import styles from './NewsGrid.module.css';

interface NewsItem {
  category: string;
  date: string;
  title: string;
  summary: string;
  href: string;
  tags: string[];
  image?: string;
}

interface Props {
  items: NewsItem[];
  filters: string[];
  labels: {
    readMore: string;
    emptyMessage: string;
    filterAriaLabel: string;
  };
}

function NewsCard({ item, readMoreLabel }: { item: NewsItem; readMoreLabel: string }) {
  return (
    <div className={styles.dashedCard}>
      <a href={item.href} className={styles.card}>
        {item.image && (
          <div className={styles.cardImageWrap}>
            <img src={item.image} alt="" className={styles.cardImage} loading="lazy" />
          </div>
        )}
        <div className={styles.cardBody}>
          <span className={styles.cardCategory}>{item.category}</span>
          <h3 className={styles.cardTitle}>{item.title}</h3>
          <p className={styles.cardSummary}>{item.summary}</p>
          <span className={styles.cardDate}>{item.date}</span>
          <span className={styles.cardCta}>
            {readMoreLabel}
            <Icon name="arrow-right" size={16} strokeWidth={2.5} />
          </span>
        </div>
      </a>
    </div>
  );
}

export default function NewsGrid({ items, filters, labels }: Props) {
  return (
    <FilterableGrid
      data={items}
      filterGroups={[{ items: filters, ariaLabel: labels.filterAriaLabel }]}
      matchFilter={(item, _, activeIndex) => {
        if (activeIndex === 0) return true;
        return item.tags.some((tag) => tag.toUpperCase() === filters[activeIndex].toUpperCase());
      }}
      renderItem={(item, i) => (
        <NewsCard key={`${item.title}-${i}`} item={item} readMoreLabel={labels.readMore} />
      )}
      emptyMessage={labels.emptyMessage}
      ariaLabel={labels.filterAriaLabel}
      gridClassName={styles.grid}
    />
  );
}
