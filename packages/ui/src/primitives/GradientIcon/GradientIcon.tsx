import { useId } from 'react';
import { gradientIconPaths, type GradientIconName } from '../Icon/icon-data';

interface GradientIconProps {
  name: GradientIconName;
  size?: number;
  className?: string;
}

export default function GradientIcon({ name, size = 24, className }: GradientIconProps) {
  const uid = useId().replace(/:/g, '');
  const icon = gradientIconPaths[name];

  const renderPaths = (group: (typeof icon.groups)[number], gi: number) => {
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
    return group.paths.map((p, pi) => (
      <path
        key={`${gi}-${pi}`}
        fillRule={p.fillRule}
        clipRule={p.clipRule}
        d={p.d}
        fill={`url(#grad-${uid})`}
      />
    ));
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient
          id={`grad-${uid}`}
          x1="14"
          y1="0"
          x2="14"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop style={{ stopColor: 'var(--color-primary)' }} />
          <stop offset="1" style={{ stopColor: 'var(--color-primary-gradient-end)' }} />
        </linearGradient>
        {icon.clipPath && (
          <clipPath id={`clip-${uid}`}>
            <rect width={icon.clipPath.width} height={icon.clipPath.height} fill="white" />
          </clipPath>
        )}
        {icon.groups.map(
          (group, gi) =>
            group.type === 'masked' && (
              <mask
                key={gi}
                id={`mask-${uid}-${gi}`}
                style={{ maskType: 'luminance' }}
                maskUnits="userSpaceOnUse"
                x={group.mask.x}
                y={group.mask.y}
                width={group.mask.width}
                height={group.mask.height}
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d={group.mask.rectPath}
                  fill="white"
                />
              </mask>
            ),
        )}
      </defs>

      {icon.clipPath ? (
        <g clipPath={`url(#clip-${uid})`}>{icon.groups.map(renderPaths)}</g>
      ) : (
        icon.groups.map(renderPaths)
      )}
    </svg>
  );
}
