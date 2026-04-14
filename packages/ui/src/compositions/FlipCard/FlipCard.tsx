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

  return (
    <div
      className={cn(styles.flipCard, className)}
      role="button"
      tabIndex={0}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setFlipped((f) => !f);
        }
      }}
    >
      <div className={cn(styles.flipCardInner, flipped && styles.flipCardInnerFlipped)}>
        <div className={cn(styles.flipCardFace, styles.flipCardFront)}>{frontContent}</div>
        <div className={cn(styles.flipCardFace, styles.flipCardBack)}>{backContent}</div>
      </div>
    </div>
  );
}

export { styles as flipCardStyles };
