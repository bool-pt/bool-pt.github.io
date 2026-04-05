import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';
import { useSwipe } from '../../lib/useSwipe';
import styles from './PortfolioTestimonialsCarousel.module.css';

interface TestimonialItem {
  quote: string;
  company: string;
  designation: string;
  avatar?: string;
}

interface Props {
  testimonials: TestimonialItem[];
  ariaLabels?: { prev: string; next: string };
}

function AvatarFallback({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return <span className={styles.avatarFallback}>{initial}</span>;
}

export default function PortfolioTestimonialsCarousel({ testimonials, ariaLabels }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const scrollNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

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

  return (
    <div className={styles.root} {...swipeHandlers}>
      <div className={styles.navGroup}>
        <button
          onClick={scrollPrev}
          aria-label={ariaLabels?.prev}
          className={styles.navBtn}
          type="button"
        >
          <ChevronLeft size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
        <button
          onClick={scrollNext}
          aria-label={ariaLabels?.next}
          className={styles.navBtn}
          type="button"
        >
          <ChevronRight size={16} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.viewport}>
        <div className={styles.track} style={{ transform: `translateX(-${offset}px)` }}>
          {testimonials.map((item, i) => (
            <div key={`${item.company}-${i}`} className={styles.card}>
              <div className={styles.cardBody}>
                <span className={styles.quoteIcon} aria-hidden="true">
                  &ldquo;
                </span>
                <p className={styles.quoteText}>{item.quote}</p>
              </div>
              <div className={styles.cardFooter}>
                <div className={styles.avatar}>
                  {item.avatar ? (
                    <img
                      src={item.avatar}
                      alt={item.company}
                      className={styles.avatarImage}
                      loading="lazy"
                    />
                  ) : (
                    <AvatarFallback name={item.company} />
                  )}
                </div>
                <div className={styles.authorInfo}>
                  <p className={styles.authorName}>{item.company}</p>
                  <p className={styles.authorRole}>{item.designation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
