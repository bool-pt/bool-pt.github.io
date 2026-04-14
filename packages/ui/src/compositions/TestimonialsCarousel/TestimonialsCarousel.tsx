import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useCallback } from 'react';
import { cn } from '@bool/shared';
import { useSwipe } from '../../lib/useSwipe';
import styles from './TestimonialsCarousel.module.css';

interface TestimonialItem {
  quote: string;
  company: string;
  designation: string;
  /** Optional per-item avatar URL. Falls back to `avatarSrc`. */
  avatar?: string;
}

interface Props {
  testimonials?: TestimonialItem[];
  variant?: 'light' | 'dark';
  /** Default avatar shown when an item has no `avatar`. */
  avatarSrc?: string;
  prevLabel: string;
  nextLabel: string;
}

export default function TestimonialsCarousel({
  testimonials = [],
  variant = 'dark',
  avatarSrc,
  prevLabel,
  nextLabel,
}: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const scrollNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const isLight = variant === 'light';
  const swipeHandlers = useSwipe(scrollNext, scrollPrev);

  return (
    <div className={styles.wrapper} {...swipeHandlers}>
      <button
        onClick={scrollPrev}
        aria-label={prevLabel}
        className={cn(styles.navBtn, styles.navBtnPrev, isLight && styles.navBtnLight)}
        type="button"
      >
        <ChevronLeft size={24} strokeWidth={3} aria-hidden="true" />
      </button>

      <div className={styles.viewport}>
        <div
          className={styles.track}
          style={{ '--slide-offset': `${currentIndex * 100}%` } as React.CSSProperties}
        >
          {testimonials.map((item) => (
            <div key={item.company} className={styles.card}>
              <div className={styles.avatar}>
                <img
                  src={item.avatar ?? avatarSrc}
                  alt=""
                  className={styles.avatarImg}
                  loading="lazy"
                />
              </div>
              <p className={styles.quote}>{item.quote}</p>
              <p className={styles.company}>{item.company}</p>
              <p className={styles.designation}>{item.designation}</p>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={scrollNext}
        aria-label={nextLabel}
        className={cn(styles.navBtn, styles.navBtnNext, isLight && styles.navBtnLight)}
        type="button"
      >
        <ChevronRight size={24} strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  );
}
