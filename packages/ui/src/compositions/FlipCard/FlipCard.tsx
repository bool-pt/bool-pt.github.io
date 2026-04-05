import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/utils';
import styles from './FlipCard.module.css';

interface Props {
  frontContent: ReactNode;
  backContent: ReactNode;
  className?: string;
}

export default function FlipCard({ frontContent, backContent, className }: Props) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className={cn(styles.flipCard, className)} onClick={() => setFlipped((f) => !f)}>
      <div className={cn(styles.flipCardInner, flipped && styles.flipCardInnerFlipped)}>
        <div className={cn(styles.flipCardFace, styles.flipCardFront)}>{frontContent}</div>
        <div className={cn(styles.flipCardFace, styles.flipCardBack)}>{backContent}</div>
      </div>
    </div>
  );
}

export { styles as flipCardStyles };
