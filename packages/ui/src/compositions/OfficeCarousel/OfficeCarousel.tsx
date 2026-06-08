import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { cn } from '@bool/shared';
import { useSwipe } from '../../lib/useSwipe';
import Icon from '../../primitives/Icon/Icon';
import styles from './OfficeCarousel.module.css';

interface OfficeItem {
  city: string;
  building: string;
  address: string;
  image: string;
}

interface Props {
  offices: OfficeItem[];
  navPosition?: 'sides' | 'top-right';
  autoRotateMs?: number;
  ariaLabels?: { prev: string; next: string; imageAlt?: string };
}

export default function OfficeCarousel({
  offices,
  navPosition = 'sides',
  autoRotateMs = 8000,
  ariaLabels,
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % offices.length);
    }, autoRotateMs);
  }, [offices.length, autoRotateMs]);

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [resetTimer]);

  const scrollPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + offices.length) % offices.length);
    resetTimer();
  }, [offices.length, resetTimer]);

  const scrollNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % offices.length);
    resetTimer();
  }, [offices.length, resetTimer]);

  const handleCardClick = useCallback(
    (i: number) => {
      setActiveIndex(i);
      resetTimer();
    },
    [resetTimer]
  );

  const [mobileCardWidth, setMobileCardWidth] = useState(0);

  useEffect(() => {
    const update = () => {
      setMobileCardWidth(window.innerWidth < 768 ? window.innerWidth - 48 : 0);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const gap = 24;
  const cardWidth = mobileCardWidth || 384;
  const offset = activeIndex * (cardWidth + gap);

  const swipeHandlers = useSwipe(scrollNext, scrollPrev);
  const isTopRight = navPosition === 'top-right';

  const navButtons = (
    <div className={cn(styles.navGroup, isTopRight && styles.navGroupTopRight)}>
      <button
        onClick={scrollPrev}
        aria-label={ariaLabels?.prev}
        className={styles.navBtn}
        type="button"
      >
        <ChevronLeft size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
      <button
        onClick={scrollNext}
        aria-label={ariaLabels?.next}
        className={styles.navBtn}
        type="button"
      >
        <ChevronRight size={18} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <div className={styles.root} {...swipeHandlers}>
      {isTopRight && navButtons}

      <div className={cn(styles.wrapper, isTopRight && styles.wrapperFull)}>
        <div className={styles.viewport}>
          <div className={styles.track} style={{ transform: `translateX(-${offset}px)` }}>
            {offices.map((office, i) => {
              // No card is selected/coloured by default — only on hover.
              // activeIndex still drives the auto-rotating track position below.
              const isColor = i === hoveredIndex;
              return (
                <div
                  key={`${office.city}-${i}`}
                  className={cn(styles.card, isColor && styles.cardActive)}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleCardClick(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleCardClick(i);
                    }
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <span className={cn(styles.badge, isColor && styles.badgeExpanded)}>
                    <span className={styles.badgeIcon}>
                      <Icon name="building-location" size={20} />
                    </span>
                    <span className={styles.badgeLabel}>{office.city}</span>
                  </span>
                  <div className={styles.cardInner}>
                    <img
                      src={office.image}
                      alt={`${office.city} ${ariaLabels?.imageAlt ?? ''}`}
                      className={styles.cardImage}
                      loading="lazy"
                      decoding="async"
                      width={400}
                      height={300}
                    />
                  </div>
                  <div className={cn(styles.overlay, isColor && styles.overlayVisible)}>
                    <span className={styles.overlayIcon}>
                      <MapPin size={20} strokeWidth={2} />
                    </span>
                    <div className={styles.overlayText}>
                      <p className={styles.buildingName}>{office.building}</p>
                      <p className={styles.address}>{office.address}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
