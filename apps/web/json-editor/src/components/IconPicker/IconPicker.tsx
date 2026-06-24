import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gradientIconNames, gradientIconPaths } from '../../iconManifest.ts';
import { cn } from '../../lib/cn.ts';
import styles from './IconPicker.module.css';

interface IconPathDef {
  d: string;
  fillRule?: 'evenodd' | 'nonzero';
  clipRule?: 'evenodd' | 'nonzero';
}

interface MaskDef {
  x: number;
  y: number;
  width: number;
  height: number;
  rectPath: string;
}

type IconGroup =
  | { type: 'paths'; paths: IconPathDef[] }
  | { type: 'masked'; mask: MaskDef; paths: IconPathDef[] };

interface IconDef {
  viewBox: string;
  clipPath?: { width: number; height: number };
  groups: IconGroup[];
}

function GradientPreview({ name, size }: { name: string; size: number }) {
  const uid = useId().replace(/:/g, '');
  const icon = gradientIconPaths[name as keyof typeof gradientIconPaths] as unknown as
    | IconDef
    | undefined;
  if (!icon) return null;

  const renderGroup = (group: IconGroup, gi: number) => {
    if (group.type === 'masked') {
      return (
        <g key={gi} mask={`url(#mask-${uid}-${gi})`}>
          {group.paths.map((p, pi) => (
            <path
              key={pi}
              fillRule={p.fillRule}
              clipRule={p.clipRule}
              d={p.d}
              fill={`url(#grad-${uid})`}
            />
          ))}
        </g>
      );
    }
    return (
      <g key={gi}>
        {group.paths.map((p, pi) => (
          <path
            key={pi}
            fillRule={p.fillRule}
            clipRule={p.clipRule}
            d={p.d}
            fill={`url(#grad-${uid})`}
          />
        ))}
      </g>
    );
  };

  return (
    <svg width={size} height={size} viewBox={icon.viewBox} fill="none" aria-hidden="true">
      <defs>
        <linearGradient
          id={`grad-${uid}`}
          x1="14"
          y1="0"
          x2="14"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop style={{ stopColor: 'var(--color-primary, #e7453a)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-primary-gradient-end, #cc2a1f)' }} />
        </linearGradient>
        {icon.clipPath && (
          <clipPath id={`clip-${uid}`}>
            <rect width={icon.clipPath.width} height={icon.clipPath.height} fill="white" />
          </clipPath>
        )}
        {icon.groups.map((group, gi) =>
          group.type === 'masked' ? (
            <mask
              key={`m${gi}`}
              id={`mask-${uid}-${gi}`}
              maskUnits="userSpaceOnUse"
              x={group.mask.x}
              y={group.mask.y}
              width={group.mask.width}
              height={group.mask.height}
            >
              <path fillRule="evenodd" clipRule="evenodd" d={group.mask.rectPath} fill="white" />
            </mask>
          ) : null
        )}
      </defs>
      {icon.clipPath ? (
        <g clipPath={`url(#clip-${uid})`}>{icon.groups.map(renderGroup)}</g>
      ) : (
        icon.groups.map(renderGroup)
      )}
    </svg>
  );
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
}

const POPOVER_MAX_WIDTH = 448; // 28rem, kept in sync with .popover max-inline-size

export default function IconPicker({ value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const isValid = useMemo(() => gradientIconNames.includes(value), [value]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{
    left: number;
    top?: number;
    bottom?: number;
    maxHeight: number;
  } | null>(null);

  // Render the popover in a portal with fixed positioning so it overflows the
  // surrounding cards (which clip via `overflow: hidden`) instead of being cut off.
  useLayoutEffect(() => {
    if (!open) return;

    const reposition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const margin = 8;
      const gap = 4;
      const left = Math.max(
        margin,
        Math.min(rect.left, window.innerWidth - POPOVER_MAX_WIDTH - margin)
      );
      const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
      const spaceAbove = rect.top - gap - margin;
      // Flip above the trigger only when there's clearly more room there.
      const placeAbove = spaceBelow < 200 && spaceAbove > spaceBelow;
      setCoords(
        placeAbove
          ? { left, bottom: window.innerHeight - rect.top + gap, maxHeight: spaceAbove }
          : { left, top: rect.bottom + gap, maxHeight: spaceBelow }
      );
    };

    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || popoverRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className={styles.wrap}>
      <button
        ref={triggerRef}
        type="button"
        className={cn(styles.trigger, !isValid && styles.triggerInvalid)}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {isValid ? (
          <span className={styles.preview}>
            <GradientPreview name={value} size={20} />
          </span>
        ) : (
          <span className={styles.previewMissing} aria-hidden="true">
            ?
          </span>
        )}
        <span className={styles.label}>{value || '— pick an icon —'}</span>
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={popoverRef}
            className={styles.popover}
            role="listbox"
            style={{
              top: coords.top,
              bottom: coords.bottom,
              left: coords.left,
              maxBlockSize: coords.maxHeight,
            }}
          >
            <div className={styles.grid}>
              {gradientIconNames.map((name) => (
                <button
                  type="button"
                  key={name}
                  role="option"
                  aria-selected={name === value}
                  className={cn(styles.option, name === value && styles.optionActive)}
                  onClick={() => {
                    onChange(name);
                    setOpen(false);
                  }}
                  title={name}
                >
                  <GradientPreview name={name} size={28} />
                  <span className={styles.optionName}>{name}</span>
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
