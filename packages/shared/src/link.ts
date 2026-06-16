import { BASE_PATH } from './constants.ts';

/**
 * How a content-authored link behaves. Stored in `en.json` as a sibling
 * `<key>.type` next to `<key>.href`, editable in the json-editor.
 *
 * - `internal` — same-site navigation; `href` is a site-relative path
 *   (e.g. `/about`, `#section`). The base path is applied at render.
 * - `external` — opens in a new tab with `rel="noopener noreferrer"`;
 *   `href` is an absolute URL.
 * - `modal` — does not navigate; `href` holds a modal name and the link
 *   dispatches the `bool:open-<name>` event the modal listens for.
 */
export type LinkType = 'internal' | 'external' | 'modal';

export interface ResolvedLink {
  /** Whether to render a `<button>` (modal) instead of an `<a>`. */
  isModal: boolean;
  /** `<a href>` for internal/external links. */
  href?: string;
  /** `_blank` for external links. */
  target?: '_blank';
  /** `noopener noreferrer` for external links. */
  rel?: string;
  /** Custom event a modal trigger dispatches (e.g. `bool:open-event-schedule`). */
  modalEvent?: string;
}

const isAbsolute = (href: string) => /^(https?:)?\/\//.test(href) || href.startsWith('mailto:');
const isAnchor = (href: string) => href.startsWith('#');

/** Apply the site base path to a root-relative internal href, once. */
export function withBasePath(href: string): string {
  if (isAbsolute(href) || isAnchor(href)) return href;
  if (href.startsWith(`${BASE_PATH}/`) || href === BASE_PATH) return href;
  if (href.startsWith('/')) return `${BASE_PATH}${href}`;
  return href;
}

/**
 * Resolve a content link `{ href, type }` into the attributes a renderer
 * needs. `type` defaults to `internal`. Pure — safe in Astro and React.
 */
export function resolveLink(href: string, type: LinkType = 'internal'): ResolvedLink {
  switch (type) {
    case 'external':
      return { isModal: false, href, target: '_blank', rel: 'noopener noreferrer' };
    case 'modal':
      return { isModal: true, modalEvent: `bool:open-${href || 'event-schedule'}` };
    case 'internal':
    default:
      return { isModal: false, href: withBasePath(href) };
  }
}
