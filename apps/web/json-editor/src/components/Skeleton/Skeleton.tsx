import { cn } from '../../lib/cn.ts';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  className?: string;
  variant?: 'dark' | 'light';
  style?: React.CSSProperties;
}

/** Base skeleton block — shimmer animation with configurable size via className/style */
export function Skeleton({ className, variant = 'light', style }: SkeletonProps) {
  return (
    <div
      className={cn(styles.skeleton, variant === 'dark' && styles.dark, className)}
      style={style}
      aria-hidden="true"
    />
  );
}

/* ─────────────────────────────────────────────────────────── */
/*  Presets                                                     */
/* ─────────────────────────────────────────────────────────── */

export function SkeletonText({
  short,
  variant = 'light',
}: {
  short?: boolean;
  variant?: 'dark' | 'light';
}) {
  return <Skeleton className={cn(styles.text, short && styles.textShort)} variant={variant} />;
}

export function SkeletonHeading({ variant = 'light' }: { variant?: 'dark' | 'light' }) {
  return <Skeleton className={styles.heading} variant={variant} />;
}

export function SkeletonBadge({ variant = 'light' }: { variant?: 'dark' | 'light' }) {
  return <Skeleton className={styles.badge} variant={variant} />;
}

export function SkeletonButton({
  variant = 'light',
  style,
}: {
  variant?: 'dark' | 'light';
  style?: React.CSSProperties;
}) {
  return <Skeleton className={styles.button} variant={variant} style={style} />;
}

export function SkeletonInput({ variant = 'light' }: { variant?: 'dark' | 'light' }) {
  return <Skeleton className={styles.input} variant={variant} />;
}

/* ─────────────────────────────────────────────────────────── */
/*  Composed skeletons — mimic real component layouts           */
/* ─────────────────────────────────────────────────────────── */

/** Skeleton for a single FieldEditor row (key label + input) */
export function SkeletonField() {
  return (
    <div className={styles.fieldRow} aria-hidden="true">
      <Skeleton className={styles.textTiny} />
      <SkeletonInput />
    </div>
  );
}

/** Skeleton for a Sidebar nav item */
export function SkeletonSidebarItem() {
  return (
    <div className={styles.sidebarItem} aria-hidden="true">
      <Skeleton className={styles.sidebarLabel} variant="dark" />
      <SkeletonBadge variant="dark" />
    </div>
  );
}

/** Skeleton for the full Sidebar (multiple items) */
export function SkeletonSidebar({ count = 12 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonSidebarItem key={i} />
      ))}
    </>
  );
}

/** Skeleton for a RepeatingGroup item card */
export function SkeletonGroupItem({ fieldCount = 3 }: { fieldCount?: number }) {
  return (
    <div className={styles.groupCard} aria-hidden="true">
      <div className={styles.groupCardHeader}>
        <Skeleton style={{ inlineSize: 16, blockSize: 16 }} />
        <Skeleton className={styles.text} style={{ inlineSize: '40%' }} />
        <Skeleton
          style={{
            inlineSize: 28,
            blockSize: 28,
            marginInlineStart: 'auto',
            borderRadius: 'var(--radius-md)',
          }}
        />
      </div>
      <div className={styles.groupCardBody}>
        {Array.from({ length: fieldCount }, (_, i) => (
          <SkeletonField key={i} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a full RepeatingGroup (header + items) */
export function SkeletonRepeatingGroup({
  items = 2,
  fieldsPerItem = 3,
}: {
  items?: number;
  fieldsPerItem?: number;
}) {
  return (
    <div style={{ marginBlockStart: '1.5rem' }} aria-hidden="true">
      <div className={styles.groupHeader}>
        <SkeletonHeading />
        <Skeleton className={styles.textTiny} />
        <SkeletonButton style={{ marginInlineStart: 'auto' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {Array.from({ length: items }, (_, i) => (
          <SkeletonGroupItem key={i} fieldCount={fieldsPerItem} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for a full section card (header + fields + group) */
export function SkeletonSection({
  fieldCount = 5,
  groupCount = 1,
}: {
  fieldCount?: number;
  groupCount?: number;
}) {
  return (
    <div
      style={{
        background: 'var(--color-background, #fff)',
        border: '1px solid var(--color-border, #e5e5e5)',
        borderRadius: 'var(--radius-lg, 0.5rem)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
      aria-hidden="true"
    >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '1rem 1.25rem',
          background: 'var(--color-muted, #f5f5f5)',
          borderBlockEnd: '1px solid var(--color-border, #e5e5e5)',
        }}
      >
        <SkeletonHeading />
        <SkeletonBadge />
      </div>

      {/* Card body */}
      <div style={{ padding: '0.75rem 0.5rem' }}>
        {/* Simple fields */}
        {Array.from({ length: fieldCount }, (_, i) => (
          <SkeletonField key={i} />
        ))}

        {/* Repeating groups */}
        {Array.from({ length: groupCount }, (_, i) => (
          <SkeletonRepeatingGroup key={i} />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for the TopBar */
export function SkeletonTopBar() {
  return (
    <div
      style={{
        position: 'fixed',
        insetBlockStart: 0,
        insetInline: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        blockSize: 56,
        paddingInline: '1.25rem',
        background: 'var(--color-surface-charcoal, #1a1a1a)',
        borderBlockEnd: '1px solid var(--color-border-on-dark, rgba(255,255,255,0.08))',
        zIndex: 20,
      }}
      aria-hidden="true"
    >
      {/* Brand */}
      <Skeleton
        variant="dark"
        style={{ inlineSize: 60, blockSize: 20, borderRadius: 'var(--radius-xs)' }}
      />
      <Skeleton
        variant="dark"
        style={{ inlineSize: 80, blockSize: 14, borderRadius: 'var(--radius-xs)' }}
      />
      <Skeleton
        variant="dark"
        style={{ inlineSize: 90, blockSize: 22, borderRadius: 'var(--radius-sm)' }}
      />

      <div style={{ flex: 1 }} />

      {/* Search */}
      <Skeleton
        variant="dark"
        style={{ inlineSize: 300, blockSize: 36, borderRadius: 'var(--radius-lg)' }}
      />

      {/* Stats */}
      <div className={styles.topBarGroup}>
        <Skeleton
          variant="dark"
          style={{ inlineSize: 60, blockSize: 14, borderRadius: 'var(--radius-xs)' }}
        />
      </div>

      {/* Actions */}
      <div className={styles.topBarGroup}>
        <Skeleton
          variant="dark"
          style={{ inlineSize: 36, blockSize: 36, borderRadius: 'var(--radius-md)' }}
        />
        <Skeleton
          variant="dark"
          style={{ inlineSize: 36, blockSize: 36, borderRadius: 'var(--radius-md)' }}
        />
        <Skeleton
          variant="dark"
          style={{ inlineSize: 36, blockSize: 36, borderRadius: 'var(--radius-md)' }}
        />
        <Skeleton
          variant="dark"
          style={{ inlineSize: 140, blockSize: 36, borderRadius: 'var(--radius-4xl)' }}
        />
      </div>
    </div>
  );
}

/** Full-page skeleton — mimics the entire editor layout while loading */
export function SkeletonEditor() {
  return (
    <>
      <SkeletonTopBar />
      <div style={{ display: 'flex', paddingBlockStart: 56 }}>
        {/* Sidebar */}
        <div
          style={{
            position: 'fixed',
            insetBlock: '56px 0',
            insetInlineStart: 0,
            inlineSize: 260,
            background: 'var(--color-surface-dark)',
            borderInlineEnd: '1px solid var(--color-border-on-dark, rgba(255,255,255,0.08))',
            paddingBlock: '1rem',
          }}
          aria-hidden="true"
        >
          <div
            style={{
              paddingInline: '1.25rem',
              paddingBlockEnd: '0.75rem',
            }}
          >
            <Skeleton
              variant="dark"
              style={{ inlineSize: 70, blockSize: 10, borderRadius: 'var(--radius-xs)' }}
            />
          </div>
          <SkeletonSidebar />
        </div>

        {/* Content */}
        <main
          style={{
            flex: 1,
            marginInlineStart: 260,
            padding: '1.5rem 2rem',
            minBlockSize: 'calc(100dvh - 56px)',
            background: 'var(--color-surface-light, #f8f8f8)',
          }}
        >
          <SkeletonSection fieldCount={6} groupCount={1} />
        </main>
      </div>
    </>
  );
}
