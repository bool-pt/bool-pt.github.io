interface FlagProps {
  className?: string;
}

function FlagGB({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" role="img">
      <defs>
        <clipPath id="gb-circle">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#gb-circle)">
        <rect width="40" height="40" fill="#012169" />
        <path d="M-4,0 L44,40 M44,0 L-4,40" stroke="#fff" strokeWidth="8" />
        <path d="M-4,0 L44,40 M44,0 L-4,40" stroke="#C8102E" strokeWidth="5" />
        <path d="M20,0 V40 M0,20 H40" stroke="#fff" strokeWidth="12" />
        <path d="M20,0 V40 M0,20 H40" stroke="#C8102E" strokeWidth="7" />
      </g>
    </svg>
  );
}

function FlagPT({ className }: FlagProps) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" role="img">
      <defs>
        <clipPath id="pt-circle">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#pt-circle)">
        <rect width="16" height="40" fill="#006600" />
        <rect x="16" width="24" height="40" fill="#FF0000" />
        <circle cx="16" cy="20" r="7" fill="#FFCC00" />
        <circle cx="16" cy="20" r="5.5" fill="#FF0000" />
        <rect x="14" y="15" width="4" height="10" rx="0.5" fill="#fff" />
      </g>
    </svg>
  );
}

const FLAG_COMPONENTS: Record<string, (props: FlagProps) => React.ReactElement> = {
  en: FlagGB,
  pt: FlagPT,
};

export function Flag({ code, className }: { code: string; className?: string }) {
  const Component = FLAG_COMPONENTS[code];
  if (!Component) return <span className={className}>{code.toUpperCase()}</span>;
  return <Component className={className} />;
}
