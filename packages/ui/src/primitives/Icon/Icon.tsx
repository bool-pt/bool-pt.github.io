import { iconPaths, type IconName } from './icon-data';

interface IconProps {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function Icon({ name, size = 24, strokeWidth = 1.5, className }: IconProps) {
  const icon = iconPaths[name];
  const viewBox = icon.viewBox ?? '0 0 24 24';

  if (icon.mode === 'stroke') {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className={className}
      >
        {icon.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  }

  if (icon.mode === 'fill') {
    return (
      <svg
        width={size}
        height={size}
        viewBox={viewBox}
        fill="currentColor"
        fillRule={icon.fillRule}
        aria-hidden="true"
        className={className}
      >
        {icon.paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox={viewBox} aria-hidden="true" className={className}>
      {icon.paths.map((p, i) => (
        <path
          key={i}
          d={p.d}
          fill={p.fill ?? 'none'}
          stroke={p.stroke ?? 'none'}
          strokeWidth={p.stroke !== 'none' ? strokeWidth : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
