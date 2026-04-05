import { setStoredLocale, buildLocalizedPath } from '../../lib/locale';
import { cn } from '../../lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '../../primitives/dropdown-menu/dropdown-menu';
import { Check } from '../../primitives/Icon/lucide';
import { Flag } from './flags';

interface LocaleOption {
  code: string;
  flag: string;
  name: string;
}

interface LanguageSelectProps {
  currentLocale: string;
  defaultLocale: string;
  locales: LocaleOption[];
  ariaLabel: string;
  className?: string;
}

export default function LanguageSelect({
  currentLocale,
  defaultLocale,
  locales,
  ariaLabel,
  className,
}: LanguageSelectProps) {
  function handleSelect(targetLocale: string) {
    if (targetLocale === currentLocale) return;
    setStoredLocale(targetLocale);
    const codes = locales.map((l) => l.code);
    window.location.assign(buildLocalizedPath(window.location.pathname, targetLocale, defaultLocale, codes));
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            'text-on-dark focus-visible:ring-ring inline-flex cursor-pointer items-center justify-center rounded-full p-2 transition-opacity duration-150 hover:opacity-80 focus-visible:ring-2 focus-visible:outline-none',
            className
          )}
        >
          <Flag code={currentLocale} className="h-7 w-7" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="min-w-[10rem]">
        {locales.map((option) => (
          <DropdownMenuItem
            key={option.code}
            onSelect={() => handleSelect(option.code)}
            className={cn(
              'flex cursor-pointer items-center gap-2 px-3 py-2',
              option.code === currentLocale && 'font-semibold'
            )}
          >
            <Flag code={option.code} className="h-5 w-5" />
            <span className="flex-1">{option.name}</span>
            {option.code === currentLocale && <Check className="h-4 w-4 shrink-0 opacity-70" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
