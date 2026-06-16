import { describe, it, expect } from 'vitest';
import { classifyField } from './field-kinds';

describe('classifyField', () => {
  describe('media kind', () => {
    it.each([
      ['caseStudies.items.1.coverImage'],
      ['teamGrid.items.1.image'],
      ['hero.backgroundImage'],
      ['servicesHero.heroImage'],
      ['team.items.1.photo'],
      ['testimonials.items.1.avatar'],
      ['featuredTech.items.1.logo'],
      ['someSection.items.1.thumbnail'],
      ['aiReadiness.expertImage'],
      ['knowledgeCenter.article.1.authorAvatar'],
      ['header.logo'],
    ])('classifies %s as media', (key) => {
      expect(classifyField(key)).toBe('media');
    });
  });

  describe('icon kind', () => {
    it.each([
      ['promiseSection.items.1.iconName'],
      ['howWeWork.cards.3.iconName'],
      ['portfolioStats.recognition.2.iconName'],
      ['somewhere.icon'],
    ])('classifies %s as icon', (key) => {
      expect(classifyField(key)).toBe('icon');
    });
  });

  describe('text kind (default)', () => {
    it.each([
      ['caseStudies.items.1.title'],
      ['caseStudies.items.1.client'],
      ['caseStudies.items.1.tags.1'],
      ['hero.slides.1.subtitle'],
      ['nav.about'],
      ['common.close'],
      ['imageAlt'], // not a media field; just an alt-text label
    ])('classifies %s as text', (key) => {
      expect(classifyField(key)).toBe('text');
    });
  });

  describe('link kind', () => {
    it.each([
      ['serviceCards.items.1.href'],
      ['ourPromise.items.2.href'],
      ['hero.slides.1.cta.primary.href'],
      ['featuredTech.items.1.href'],
      ['eventsPreview.meetHref'], // *Href variant, no value needed
    ])('classifies %s as link by suffix', (key) => {
      expect(classifyField(key)).toBe('link');
    });

    it.each([
      ['teamGrid.items.1.linkedin', 'https://linkedin.com/in/andre'],
      ['techStack.platforms.1.linkedin', 'https://linkedin.com/company/bool-pt'],
      ['aiReadiness.expertLinkedin', 'https://www.linkedin.com/company/bool-pt'],
      ['some.field', '/services'],
      ['some.field', '#section'],
      ['some.field', 'mailto:info@bool.pt'],
    ])('classifies %s as link by URL-like value', (key, value) => {
      expect(classifyField(key, value)).toBe('link');
    });

    it.each([
      ['footer.social.linkedin', 'Bool on LinkedIn'], // label, not a URL
      ['contactForm.email', 'Email'], // form field label
      ['teamGrid.items.1.email', 'andre@bool.pt'], // bare email stays a text field
      ['knowledgeCenter.modal.copyLink', 'Copy link'], // label ending in "link"
    ])('keeps %s as text when the value is not a destination', (key, value) => {
      expect(classifyField(key, value)).toBe('text');
    });
  });

  it('matches only the last dot-segment, not arbitrary substrings', () => {
    // 'image' appears as a sub-segment but the suffix is 'alt'
    expect(classifyField('teamPreview.image.alt')).toBe('text');
  });
});
