import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '../../primitives/sheet/sheet';

interface NavLink {
  readonly label: string;
  readonly href: string;
}

interface MobileNavLabels {
  open: string;
  title: string;
  navAria: string;
  linkLabels: Record<string, string>;
}

interface MobileNavProps {
  links: readonly NavLink[];
  logoSrc: string;
  labels: MobileNavLabels;
}

export default function MobileNav({ links, logoSrc, labels }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="hover:bg-muted focus-visible:ring-ring rounded-md p-2 focus-visible:outline-none focus-visible:ring-2 text-white"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" id="mobile-nav" className="bg-surface-dark text-on-dark">
          <SheetTitle className="sr-only">{labels.title}</SheetTitle>
          <a href="/" onClick={() => setOpen(false)}>
            <img src={logoSrc} alt="Bool" width={40} height={40} />
          </a>
          <nav aria-label={labels.navAria}>
            <ul className="mt-6 flex flex-col gap-1" role="list">
              {links.map(({ label, href }) => (
                <li key={href}>
                  <a
                    href={href}
                    onClick={() => setOpen(false)}
                    className="hover:bg-surface-charcoal focus-visible:ring-ring flex items-center rounded-md px-3 py-2 text-sm font-medium text-on-dark focus-visible:outline-none focus-visible:ring-2"
                  >
                    {labels.linkLabels[label] ?? label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
