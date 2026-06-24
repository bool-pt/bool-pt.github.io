import { useState, type ReactNode } from 'react';
import { cn } from '@bool/shared';
import styles from './FlipCard.module.css';

interface Props {
  frontContent: ReactNode;
  backContent: ReactNode;
  className?: string;
}

export default function FlipCard({ frontContent, backContent, className }: Props) {
  const [flipped, setFlipped] = useState(false);

  const toggle = () => setFlipped((f) => !f);

  return (
    <div className={cn(styles.flipCard, className)}>
      <div className={cn(styles.flipCardInner, flipped && styles.flipCardInnerFlipped)}>
        <div
          className={cn(styles.flipCardFace, styles.flipCardFront)}
          role="button"
          tabIndex={0}
          onClick={toggle}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggle();
            }
          }}
        >
          {frontContent}
        </div>
        <div
          className={cn(styles.flipCardFace, styles.flipCardBack)}
          onClick={(e) => {
            if (e.target === e.currentTarget) toggle();
          }}
        >
          {backContent}
        </div>
      </div>
    </div>
  );
}

export { styles as flipCardStyles };
