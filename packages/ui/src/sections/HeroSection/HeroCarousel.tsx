import { useState, useEffect, useCallback, useRef } from 'react';
import { useSwipe } from '../../lib/useSwipe';
import { cn } from '../../lib/utils';
import styles from './HeroCarousel.module.css';

interface SlideData {
  title: string;
  subtitle: string;
  ctas: {
    primary: { label: string; href: string };
    secondary: { label: string; href: string };
  };
}

interface Props {
  slides: SlideData[];
  className?: string;
  ariaLabels?: { slideIndicators: string; slide: string };
}

const AUTOPLAY_INTERVAL = 8000;

export default function HeroCarousel({ slides, className, ariaLabels }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const count = slides.length;

  const stopAutoplay = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    stopAutoplay();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % count);
    }, AUTOPLAY_INTERVAL);
  }, [count, stopAutoplay]);

  useEffect(() => {
    startAutoplay();
    return stopAutoplay;
  }, [startAutoplay, stopAutoplay]);

  function handleDotClick(index: number) {
    stopAutoplay();
    setActiveIndex(index);
    startAutoplay();
  }

  function handleMouseEnter() {
    stopAutoplay();
  }

  function handleMouseLeave() {
    startAutoplay();
  }

  const swipeNext = useCallback(() => {
    stopAutoplay();
    setActiveIndex((prev) => (prev + 1) % count);
    startAutoplay();
  }, [count, stopAutoplay, startAutoplay]);

  const swipePrev = useCallback(() => {
    stopAutoplay();
    setActiveIndex((prev) => (prev - 1 + count) % count);
    startAutoplay();
  }, [count, stopAutoplay, startAutoplay]);

  const swipeHandlers = useSwipe(swipeNext, swipePrev);

  return (
    <div
      className={cn(styles.carousel, className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...swipeHandlers}
      aria-roledescription="carousel"
    >
      {slides.map((slide, i) => (
        <div
          key={i}
          className={cn(styles.slide, i === activeIndex && styles.slideActive)}
          role="group"
          aria-roledescription="slide"
          aria-label={`${ariaLabels?.slide ?? ''} ${i + 1}`}
        >
          <div className={styles.slideInner}>
            <div className={styles.slideLayout}>
              <div className={styles.content}>
                <h2 className={styles.heading}>{slide.title}</h2>
                <p className={styles.body}>{slide.subtitle}</p>
                <div className={styles.actions}>
                  <a
                    href={slide.ctas.primary.href}
                    className={cn(styles.ctaLink, styles.ctaPrimary)}
                  >
                    {slide.ctas.primary.label}
                  </a>
                  <a
                    href={slide.ctas.secondary.href}
                    className={cn(styles.ctaLink, styles.ctaOutline)}
                  >
                    {slide.ctas.secondary.label}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className={styles.controlsBar}>
        <div className={styles.controlsSpacer} />
        <div className={styles.controls}>
          <span className={styles.controlsLine} aria-hidden="true" />
          <div className={styles.dots} role="tablist" aria-label={ariaLabels?.slideIndicators}>
            {slides.map((_, i) => (
              <span
                key={i}
                className={cn(styles.dot, i === activeIndex && styles.dotActive)}
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`${ariaLabels?.slide ?? ''} ${i + 1}`}
                onClick={() => handleDotClick(i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
