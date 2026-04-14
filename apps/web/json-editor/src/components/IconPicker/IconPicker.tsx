import { useId, useMemo, useState } from 'react';
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
  const icon = gradientIconPaths[name as keyof typeof gradientIconPaths] as unknown as IconDef | undefined;
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
        <linearGradient id={`grad-${uid}`} x1="14" y1="0" x2="14" y2="28" gradientUnits="userSpaceOnUse">
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
          ) : null,
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

export default function IconPicker({ value, onChange, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const isValid = useMemo(() => gradientIconNames.includes(value), [value]);

  return (
    <div className={styles.wrap}>
      <button
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
          <span className={styles.previewMissing} aria-hidden="true">?</span>
        )}
        <span className={styles.label}>{value || '— pick an icon —'}</span>
      </button>

      {open && (
        <div className={styles.popover} role="listbox">
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
        </div>
      )}
    </div>
  );
}
