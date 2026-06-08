/** What kind of editor a field should render in the UI. */
export type FieldKind = 'text' | 'media' | 'icon' | 'select';

export interface SelectOption {
  value: string;
  label: string;
}

/** A single translatable field */
export interface TranslationField {
  /** Full dot-notation key, e.g. "people.testimonials.1.quote" */
  key: string;
  value: string;
  isDirty: boolean;
  /** Hint for the UI on which editor to render. Defaults to 'text' when omitted. */
  kind?: FieldKind;
  /** Available options when kind === 'select'. */
  options?: SelectOption[];
}

/** Defines the field template for items in a repeating group */
export interface RepeatingGroupTemplate {
  /** Key prefix before the numeric/named index, e.g. "people.testimonials" */
  prefix: string;
  /** Field suffixes that each item contains, e.g. ["quote", "name", "role"] */
  fieldSuffixes: string[];
  /**
   * Inner numeric repeating groups inside each item.
   * Example: for `caseStudies.items.N.tags.M`, this would contain
   * `[{ innerPrefix: 'tags' }]`.
   */
  nestedTemplates?: NestedRepeatingTemplate[];
}

export interface NestedRepeatingTemplate {
  /** The segment after the item index that holds the inner numeric group, e.g. "tags". */
  innerPrefix: string;
  /** Field suffixes for the inner items; empty string means the inner item is a bare value. */
  fieldSuffixes: string[];
}

/** A single item within a repeating group */
export interface RepeatingGroupItem {
  /** The identifier (numeric string like "1", "2" or named like "outsystems") */
  index: string;
  fields: TranslationField[];
  /** Inner numeric repeating groups (one per `nestedTemplates` entry on the parent template). */
  nestedGroups?: NestedRepeatingGroup[];
}

/** A nested repeating group hanging off a parent item, e.g. `tags.M` inside `items.N`. */
export interface NestedRepeatingGroup {
  /** The inner key prefix, e.g. "caseStudies.items.1.tags". */
  prefix: string;
  /** The same `innerPrefix` as on the parent template (e.g. "tags"). */
  innerPrefix: string;
  template: NestedRepeatingTemplate;
  items: NestedRepeatingItem[];
}

export interface NestedRepeatingItem {
  index: string;
  fields: TranslationField[];
}

/** A detected repeating group within a section */
export interface RepeatingGroup {
  /** Full prefix path, e.g. "people.testimonials" */
  prefix: string;
  /** Human-readable label, e.g. "Testimonials" */
  label: string;
  template: RepeatingGroupTemplate;
  items: RepeatingGroupItem[];
}

/** A top-level section grouping */
export interface Section {
  /** Raw key prefix, e.g. "nav", "hero", "services" */
  name: string;
  /** Human-readable label, e.g. "Navigation", "Hero" */
  label: string;
  /** Simple (non-repeating) fields in this section */
  fields: TranslationField[];
  /** Detected repeating groups */
  repeatingGroups: RepeatingGroup[];
  /** Total keys in this section */
  keyCount: number;
}

/** A page in the sitemap — lists which sections it uses */
export interface PageMeta {
  /** Page key, e.g. "home", "about" */
  name: string;
  /** Human-readable label, e.g. "Home", "About" */
  label: string;
  /** Section names used on this page (references Section.name) */
  sectionNames: string[];
}

/** The full parsed tree from a flat JSON file */
export interface ParsedTree {
  sections: Section[];
  /** Pages extracted from _meta.pages.* keys */
  pages: PageMeta[];
  /** Section names listed in _meta.shared */
  sharedSections: string[];
  /** Preserved _meta keys (not part of sections, needed for round-trip) */
  metaKeys: Record<string, string>;
  totalKeys: number;
  /** Original key order for serialization fidelity */
  keyOrder: string[];
}

/** Editor UI state */
export interface EditorState {
  sections: Section[];
  pages: PageMeta[];
  sharedSections: string[];
  activeSection: string | null;
  activeSectionContext: 'page' | 'shared' | null;
  searchQuery: string;
  showPreview: boolean;
  /** Preserved _meta keys for round-trip serialization */
  metaKeys: Record<string, string>;
  isDirty: boolean;
  isLoading: boolean;
  fileName: string;
  totalKeys: number;
  keyOrder: string[];
}
