/**
 * Manifest of GradientIcon names exposed by @bool/ui. The IconPicker uses this
 * list as the dropdown's options. The values stored in en.json are these
 * literal strings.
 */
import { gradientIconPaths } from '@bool/ui/primitives/Icon/icon-data';

export const gradientIconNames: string[] = Object.keys(gradientIconPaths).sort();

export function isValidIconName(value: string): boolean {
  return gradientIconNames.includes(value);
}

/** Re-exports the raw paths so the IconPicker can render previews. */
export { gradientIconPaths } from '@bool/ui/primitives/Icon/icon-data';
