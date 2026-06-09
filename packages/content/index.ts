export { collections } from './src/collections/config.ts';
export { getBlogPosts, getEvents, getUpcomingEvents } from './src/queries.ts';
export type { BlogPost } from './src/schemas/blog.ts';
export type { Event } from './src/schemas/events.ts';
export { transformEvent, transformBlogPost } from './src/transformers.ts';

// JSON-driven section loaders (replaces MDX queries above for sections that moved into en.json)
export { getCaseStudies } from './src/case-studies.ts';
export type {
  CaseStudy,
  CaseStudyMetric,
  CaseStudiesPayload,
  TechFilter,
} from './src/case-studies.ts';
export { getTeamGrid } from './src/team-grid.ts';
export type { TeamGridPayload, TeamMemberCard } from './src/team-grid.ts';
export { resolveImage, resolveSvgUrl, resolveMedia } from './src/media.ts';
export { collectArray, collectNestedList } from './src/sections.ts';
export { validateLocale, KNOWN_GRADIENT_ICONS } from './src/validation.ts';
export type { ValidationReport, MediaError, IconError } from './src/validation.ts';

// Layout & shared label getters
export {
  getHeaderLabels,
  getFooterLabels,
  getNewsletterLabels,
  getCalendarLabels,
  getContactFormLabels,
  getContactSectionProps,
  getEventScheduleLabels,
} from './src/labels.ts';
