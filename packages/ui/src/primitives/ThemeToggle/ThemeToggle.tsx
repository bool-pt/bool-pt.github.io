import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import { getTheme, setTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

function subscribeToTheme(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => observer.disconnect();
}

function getThemeSnapshot() {
  return getTheme() === 'dark';
}

function getServerSnapshot() {
  return false;
}

interface ThemeToggleProps {
  className?: string;
  switchToLightLabel: string;
  switchToDarkLabel: string;
}

export default function ThemeToggle({ className, switchToLightLabel, switchToDarkLabel }: ThemeToggleProps) {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerSnapshot);

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? switchToLightLabel : switchToDarkLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-full p-2 text-on-dark transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
