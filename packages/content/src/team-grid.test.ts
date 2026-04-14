import { describe, it, expect } from 'vitest';
import { getTeamGrid } from './team-grid.ts';

describe('getTeamGrid (real en.json)', () => {
  const payload = getTeamGrid();

  it('returns at least one team member', () => {
    expect(payload.members.length).toBeGreaterThan(0);
  });

  it('every member has a resolved portrait image', () => {
    for (const m of payload.members) {
      // resolveImage throws if the file isn't found, so reaching here means
      // every JSON-referenced portrait exists on disk.
      expect(m.image).toBeDefined();
    }
  });

  it('every member has a non-empty name and role', () => {
    for (const m of payload.members) {
      expect(m.name.length).toBeGreaterThan(0);
      expect(m.role.length).toBeGreaterThan(0);
    }
  });

  it('compacts back-face tags (no empty entries)', () => {
    for (const m of payload.members) {
      for (const tag of m.tags) {
        expect(tag.trim()).not.toBe('');
      }
    }
  });

  it('omits linkedin / email when blank in JSON', () => {
    for (const m of payload.members) {
      if (m.linkedin !== undefined) expect(m.linkedin.length).toBeGreaterThan(0);
      if (m.email !== undefined) expect(m.email.length).toBeGreaterThan(0);
    }
  });

  it('exposes the section-chrome labels expected by TeamGridSection', () => {
    expect(payload.labels.heading.length).toBeGreaterThan(0);
    expect(payload.labels.body.length).toBeGreaterThan(0);
    expect(payload.labels.emailAriaPrefix.length).toBeGreaterThan(0);
    expect(payload.labels.linkedinAriaSuffix.length).toBeGreaterThan(0);
  });
});
