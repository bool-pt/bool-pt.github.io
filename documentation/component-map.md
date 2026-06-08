# Component Dependency Map

Full dependency tree: **Pages → Sections → Compositions → Primitives**

---

## Pages

### Homepage (`index.astro`)

| #   | Section              | Compositions                                                  | Primitives                                                          | React Islands                         |
| --- | -------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------- |
| 1   | HeroSection          | BoolLettersOverlay                                            | —                                                                   | HeroCarousel `client:load`            |
| 2   | NewsletterBarSection | —                                                             | Section, SectionContainer, TextBlock                                | NewsletterForm `client:visible`       |
| 3   | PowerAISection       | SplitLayout, TextBlockWithActions                             | ButtonLink, RoundedImage, Section, SectionContainer                 | —                                     |
| 4   | ServicesSection      | DottedLineCardGrid                                            | Section, SectionContainer                                           | —                                     |
| 5   | PromiseSection       | SplitLayout, TextBlockWithActions, IconFeatureCard, ArrowLink | Section, SectionContainer, ButtonLink, ResponsiveGrid, GradientIcon | —                                     |
| 6   | TestimonialsSection  | SectionIntro                                                  | Section, SectionContainer                                           | TestimonialsCarousel `client:visible` |
| 7   | PeopleSection        | TextBlockWithActions, ImageTextBanner                         | ButtonLink, Section, ActionRow                                      | —                                     |
| 8   | InsightsSection      | IntroGridSection, ImageOverlayCard, ArrowLink                 | AuthorMeta, CardImageBg, CardTitle                                  | —                                     |
| 9   | EventsSection        | SectionIntro, CalendarEventLayout, EventListCard              | Section, ButtonLink                                                 | —                                     |
| 10  | ContactSection       | ContactInfo, SplitWithForm                                    | Section, SectionContainer                                           | ContactForm `client:load`             |
| 11  | NewsletterCTASection | —                                                             | Section, SectionContainer, TextBlock                                | NewsletterForm `client:visible`       |

---

### About (`about.astro`)

| #   | Section              | Compositions                      | Primitives                                          | React Islands                   |
| --- | -------------------- | --------------------------------- | --------------------------------------------------- | ------------------------------- |
| 1   | AboutHeroSection     | DarkPageHero, SectionIntro        | SectionContainer, ResponsiveGrid, TextBlock         | —                               |
| 2   | BoolInNumbersSection | TrapezoidStatsRow, SkewedCard     | Section, SectionContainer, TextBlock                | —                               |
| 3   | PowerAISection       | SplitLayout, TextBlockWithActions | ButtonLink, RoundedImage, Section, SectionContainer | —                               |
| 4   | FeaturedTechSection  | ArrowLink, IntroGridSection       | —                                                   | —                               |
| 5   | TeamGridSection      | IntroGridSection, PersonCard      | —                                                   | —                               |
| 6   | FromPortugalSection  | SectionIntro                      | Section, SectionContainer                           | OfficeCarousel `client:visible` |
| 7   | ContactSection       | ContactInfo, SplitWithForm        | Section, SectionContainer                           | ContactForm `client:load`       |

---

### Services (`services.astro`)

| #   | Section              | Compositions                                   | Primitives                                                      | React Islands                   |
| --- | -------------------- | ---------------------------------------------- | --------------------------------------------------------------- | ------------------------------- |
| 1   | ServicesHeroSection  | DarkPageHero, BoolLettersOverlay, SectionIntro | SectionContainer                                                | —                               |
| 2   | PowerAISection       | SplitLayout, TextBlockWithActions              | RoundedImage, Section, SectionContainer                         | —                               |
| 3   | SolutionsROISection  | —                                              | Icon, Section, SectionContainer                                 | —                               |
| 4   | AiUseCasesSection    | SectionTag, ImageOverlayCard, ArrowLink        | CardImageBg, CardTitle, Icon, Section, SectionContainer         | —                               |
| 5   | StatsBannerSection   | ImageTextBanner                                | Section                                                         | —                               |
| 6   | TechStackSection     | SectionIntro, ExpertPortrait                   | Section, SectionContainer, TextBlock, CheckListItem, ButtonLink | —                               |
| 7   | HowWeWorkSection     | —                                              | Section, SectionContainer                                       | —                               |
| 8   | LetsBuildCTASection  | CTASection                                     | ButtonLink                                                      | —                               |
| 9   | ContactSection       | ContactInfo, SplitWithForm                     | Section, SectionContainer                                       | ContactForm `client:load`       |
| 10  | NewsletterCTASection | BoolLettersOverlay                             | Section, SectionContainer, TextBlock                            | NewsletterForm `client:visible` |

---

### People (`people.astro`)

| #   | Section                     | Compositions                                                                  | Primitives                              | React Islands                                  |
| --- | --------------------------- | ----------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| 1   | PeopleHeroSection           | SectionTag, DarkPageHero, SectionIntro, TrapezoidStatsRow, BoolLettersOverlay | SectionContainer, ButtonLink, ActionRow | —                                              |
| 2   | ValuesSection               | SectionTag, IntroGridSection, NumberedCard                                    | —                                       | —                                              |
| 3   | BeyondSprintSection         | SectionTag, IntroGridSection, ContentCard                                     | TextBlock                               | —                                              |
| 4   | PhotoGallerySection         | SectionTag, SectionIntro                                                      | Section, SectionContainer               | —                                              |
| 5   | TestimonialsCarouselSection | SectionTag, SectionIntro                                                      | Section, SectionContainer               | PortfolioTestimonialsCarousel `client:visible` |
| 6   | CareersCtaSection           | CTASection                                                                    | ButtonLink                              | —                                              |
| 7   | ContactSection              | ContactInfo, SplitWithForm                                                    | Section, SectionContainer               | ContactForm `client:load`                      |
| 8   | NewsletterCTASection        | —                                                                             | Section, SectionContainer, TextBlock    | NewsletterForm `client:visible`                |

---

### Portfolio (`portfolio/index.astro`)

| #   | Section                     | Compositions                                                                | Primitives                              | React Islands                                  |
| --- | --------------------------- | --------------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------- |
| 1   | PortfolioHeroSection        | SectionTag, SectionIntro, StatsCardGrid, DarkPageHero + local SectorTagGrid | ButtonLink, SectionContainer, ActionRow | —                                              |
| 2   | CaseStudyGridSection        | SectionTag, SectionIntro                                                    | Section, SectionContainer               | CaseStudyGrid `client:visible`                 |
| 3   | TestimonialsCarouselSection | SectionTag, SectionIntro                                                    | Section, SectionContainer               | PortfolioTestimonialsCarousel `client:visible` |
| 4   | PortfolioStatsSection       | SectionTag, SectionIntro, TrapezoidStatsRow, SkewedCard                     | Section, SectionContainer               | —                                              |
| 5   | CertificationsSection       | SectionTag, SectionIntro                                                    | Section, SectionContainer               | —                                              |
| 6   | ClientLogosSection          | SectionTag, SectionIntro                                                    | Section, SectionContainer               | —                                              |
| 7   | LetsBuildCTASection         | CTASection                                                                  | ButtonLink                              | —                                              |
| 8   | ContactSection              | ContactInfo, SplitWithForm                                                  | Section, SectionContainer               | ContactForm `client:load`                      |
| 9   | NewsletterCTASection        | BoolLettersOverlay                                                          | Section, SectionContainer, TextBlock    | NewsletterForm `client:visible`                |

---

### Blog / Insights (`blog/index.astro`)

| #   | Section                | Compositions                                                   | Primitives                                       | React Islands                   |
| --- | ---------------------- | -------------------------------------------------------------- | ------------------------------------------------ | ------------------------------- |
| 1   | InsightsHeroSection    | SectionTag, DarkPageHero, SectionIntro                         | SectionContainer, ButtonLink, ActionRow          | —                               |
| 2   | LatestFromBoolSection  | SectionTag, IntroGridSection, ArrowLink, ImageOverlayCard      | CardLabel, CardTitle, MetaText                   | —                               |
| 3   | KnowledgeCenterSection | SectionTag, SectionIntro                                       | Section, SectionContainer                        | KnowledgeGrid `client:visible`  |
| 4   | NewsUpdatesSection     | SectionTag, SectionIntro                                       | Section, SectionContainer                        | NewsGrid `client:visible`       |
| 5   | PressReleasesSection   | ArrowLink, SectionTag, SectionIntro, ListRow                   | Section, SectionContainer, TextBlock, DashedCard | —                               |
| 6   | EventsCalendarSection  | SectionTag, SectionIntro, CalendarEventLayout, EventDetailCard | Section, SectionContainer                        | —                               |
| 7   | InsightsCTASection     | SectionTag, CTASection                                         | ButtonLink                                       | —                               |
| 8   | ContactSection         | ContactInfo, SplitWithForm                                     | Section, SectionContainer                        | ContactForm `client:load`       |
| 9   | NewsletterCTASection   | —                                                              | Section, SectionContainer, TextBlock             | NewsletterForm `client:visible` |

---

### Contacts (`contacts.astro`)

| #   | Section              | Compositions                                   | Primitives                           | React Islands                   |
| --- | -------------------- | ---------------------------------------------- | ------------------------------------ | ------------------------------- |
| 1   | ContactsHeroSection  | ContactInfo, SplitWithForm, BoolLettersOverlay | Section, SectionContainer            | ContactForm `client:visible`    |
| 2   | NewsletterCTASection | —                                              | Section, SectionContainer, TextBlock | NewsletterForm `client:visible` |

---

### Events (`events.astro`)

| #   | Section               | Compositions                                                   | Primitives                | React Islands                                    |
| --- | --------------------- | -------------------------------------------------------------- | ------------------------- | ------------------------------------------------ |
| 1   | EventsCalendarSection | SectionTag, SectionIntro, CalendarEventLayout, EventDetailCard | Section, SectionContainer | EventCalendar _(nested via CalendarEventLayout)_ |

---

### Careers (`careers.astro`)

| #   | Section            | Compositions               | Primitives | React Islands |
| --- | ------------------ | -------------------------- | ---------- | ------------- |
| 1   | CareersHeroSection | DarkPageHero, SectionIntro | —          | —             |
| 2   | CareersCtaSection  | CTASection                 | ButtonLink | —             |

---

### Legal Pages (`cookies.astro`, `privacy.astro`, `terms.astro`)

| #   | Section          | Compositions               | Primitives                | React Islands |
| --- | ---------------- | -------------------------- | ------------------------- | ------------- |
| 1   | LegalPageSection | DarkPageHero, SectionIntro | Section, SectionContainer | —             |

---

### Blog Post (`blog/[slug].astro`)

Content-driven page — no named sections. Renders MDX content via Astro's `Content` component inside `BaseLayout`.

### Portfolio Case Study (`portfolio/[slug].astro`)

Content-driven page — no named sections. Renders MDX content via Astro's `Content` component inside `BaseLayout`.

### 404 (`404.astro`)

Inline markup only — no named sections. Uses `BoolLettersOverlay` composition directly.

---

## Shared Sections

Sections reused across multiple pages:

| Section                     | Pages                                                 |
| --------------------------- | ----------------------------------------------------- |
| ContactSection              | Homepage, About, Services, People, Portfolio, Blog    |
| NewsletterCTASection        | Homepage, Services, People, Contacts, Portfolio, Blog |
| PowerAISection              | Homepage, About, Services                             |
| TestimonialsCarouselSection | People, Portfolio                                     |
| LetsBuildCTASection         | Services, Portfolio                                   |
| CareersCtaSection           | People, Careers                                       |
| EventsCalendarSection       | Blog, Events                                          |
| LegalPageSection            | Cookies, Privacy, Terms                               |

---

## Compositions → Dependencies

Each composition and what it imports from the primitives and other compositions layers.

| Composition                             | Primitives                                | Other Compositions                  |
| --------------------------------------- | ----------------------------------------- | ----------------------------------- |
| ArrowLink                               | Icon                                      | —                                   |
| ArticleCard                             | CardLabel, CardTitle, MetaText            | ImageOverlayCard                    |
| BoolLettersOverlay                      | BrandLetter, DecorativeOverlay            | —                                   |
| CTASection                              | SectionContainer, TextBlock               | —                                   |
| CalendarEventLayout                     | —                                         | EventCalendar _(React)_             |
| CaseStudyCard                           | ButtonLink, CardTitle, ImagePlaceholder   | TagGroup, MetricsStrip, ContentCard |
| ContactForm _(React)_                   | —                                         | —                                   |
| ContactInfo                             | TextBlock                                 | —                                   |
| ContentCard                             | HoverCard                                 | —                                   |
| DarkPageHero                            | —                                         | —                                   |
| DottedLineCardGrid                      | —                                         | ArrowLink                           |
| EventCalendar _(React)_                 | —                                         | —                                   |
| EventDetailCard                         | HoverCard, CardLabel, CardTitle           | ArrowLink                           |
| EventListCard                           | Tag                                       | —                                   |
| Captcha _(React)_                       | —                                         | —                                   |
| ExpertCard                              | CheckListItem                             | PersonCard                          |
| ExpertPortrait                          | —                                         | —                                   |
| FeaturedStatsCard                       | CardLabel, CardTitle, ButtonLink          | —                                   |
| FilterPills                             | —                                         | —                                   |
| FilterableGrid _(React)_                | —                                         | —                                   |
| IconFeatureCard                         | —                                         | —                                   |
| ImageOverlayCard                        | —                                         | —                                   |
| ImageTextBanner                         | —                                         | —                                   |
| IntroGridSection                        | Section, SectionContainer, ResponsiveGrid | SectionIntro                        |
| ListRow                                 | —                                         | —                                   |
| MetricsStrip                            | —                                         | —                                   |
| NewsCard                                | CardLabel, CardTitle                      | ContentCard, ArrowLink              |
| NewsletterForm _(React)_                | InlineInputButton                         | —                                   |
| NumberedCard                            | HoverCard, NumberedLabel                  | —                                   |
| PersonCard                              | —                                         | —                                   |
| SectionIntro                            | —                                         | —                                   |
| SectionTag                              | —                                         | —                                   |
| SkewedCard                              | —                                         | —                                   |
| SplitBanner                             | —                                         | —                                   |
| SplitLayout                             | —                                         | —                                   |
| SplitWithForm                           | —                                         | SplitLayout                         |
| StatsCardGrid                           | StatItem                                  | —                                   |
| StatsGrid                               | StatItem                                  | —                                   |
| TagGroup                                | Tag                                       | —                                   |
| TestimonialsCarousel _(React)_          | —                                         | —                                   |
| OfficeCarousel _(React)_                | —                                         | —                                   |
| TextBlockWithActions                    | TextBlock                                 | —                                   |
| TrapezoidStatCard                       | StatItem                                  | —                                   |
| TrapezoidStatsRow                       | ResponsiveGrid                            | TrapezoidStatCard                   |
| PortfolioTestimonialsCarousel _(React)_ | —                                         | —                                   |

---

## Local Section Components

Some sections define local helper components (not exported to the barrel):

| Section                | Local Component         | Imports                                                         |
| ---------------------- | ----------------------- | --------------------------------------------------------------- |
| HeroSection            | HeroCarousel _(React)_  | —                                                               |
| TechStackSection       | TechCard                | ExpertPortrait, ButtonLink, CheckListItem, TextBlock, ActionRow |
| CaseStudyGridSection   | CaseStudyGrid _(React)_ | FilterableGrid                                                  |
| KnowledgeCenterSection | KnowledgeGrid _(React)_ | FilterableGrid                                                  |
| KnowledgeCenterSection | ArticleModal _(React)_  | —                                                               |
| NewsUpdatesSection     | NewsGrid _(React)_      | FilterableGrid                                                  |
| PortfolioHeroSection   | SectorTagGrid           | TagGroup, ActionRow, Tag                                        |

---

## React Islands Summary

All interactive components and their hydration strategy:

| Component                     | Type                            | Hydration                             | Used In                                    |
| ----------------------------- | ------------------------------- | ------------------------------------- | ------------------------------------------ |
| HeroCarousel                  | Local to HeroSection            | `client:load`                         | HeroSection                                |
| ContactForm                   | Composition                     | `client:load`                         | ContactSection                             |
| ContactForm                   | Composition                     | `client:visible`                      | ContactsHeroSection                        |
| TestimonialsCarousel          | Composition                     | `client:visible`                      | TestimonialsSection                        |
| PortfolioTestimonialsCarousel | Composition                     | `client:visible`                      | TestimonialsCarouselSection                |
| NewsletterForm                | Composition                     | `client:visible`                      | NewsletterBarSection, NewsletterCTASection |
| CaseStudyGrid                 | Local to CaseStudyGridSection   | `client:visible`                      | CaseStudyGridSection                       |
| KnowledgeGrid                 | Local to KnowledgeCenterSection | `client:visible`                      | KnowledgeCenterSection                     |
| NewsGrid                      | Local to NewsUpdatesSection     | `client:visible`                      | NewsUpdatesSection                         |
| OfficeCarousel                | Composition                     | `client:visible`                      | FromPortugalSection                        |
| EventCalendar                 | Composition                     | _(nested inside CalendarEventLayout)_ | EventsSection, EventsCalendarSection       |

---

## Primitives Reference

All primitives used across the codebase:

| Primitive         | Type  | Used By (sections / compositions)                                                    |
| ----------------- | ----- | ------------------------------------------------------------------------------------ |
| Section           | Astro | 19 sections, IntroGridSection                                                        |
| SectionContainer  | Astro | 18 sections, IntroGridSection, CTASection                                            |
| ButtonLink        | Astro | 10 sections, CaseStudyCard, FeaturedStatsCard, TechCard                              |
| TextBlock         | Astro | 7 sections, TextBlockWithActions, CTASection, ContactInfo                            |
| ResponsiveGrid    | Astro | 3 sections, IntroGridSection                                                         |
| ActionRow         | Astro | 3 sections, HeroContent, TechCard, SectorTagGrid                                     |
| DecorativeOverlay | Astro | 2 sections, BoolLettersOverlay                                                       |
| CardTitle         | Astro | 2 sections, ArticleCard, CaseStudyCard, EventDetailCard, FeaturedStatsCard, NewsCard |
| CardLabel         | Astro | 1 section, ArticleCard, EventDetailCard, FeaturedStatsCard, NewsCard                 |
| MetaText          | Astro | 1 section, ArticleCard                                                               |
| AuthorMeta        | Astro | InsightsSection                                                                      |
| CardImageBg       | Astro | InsightsSection                                                                      |
| BrandLetter       | Astro | BoolLettersOverlay                                                                   |
| CheckListItem     | Astro | ExpertCard, TechCard                                                                 |
| HoverCard         | Astro | ContentCard, NumberedCard, EventDetailCard                                           |
| GradientIcon      | Astro | PromiseSection                                                                       |
| Icon              | Astro | ArrowLink                                                                            |
| ImagePlaceholder  | Astro | CaseStudyCard                                                                        |
| InlineInputButton | React | NewsletterForm                                                                       |
| NumberedLabel     | Astro | NumberedCard                                                                         |
| RoundedImage      | Astro | PowerAISection                                                                       |
| StatItem          | Astro | StatsGrid, StatsCardGrid, TrapezoidStatCard                                          |
| CarouselControls  | Astro | _(available primitive)_                                                              |
| DashedCard        | Astro | PressReleasesSection                                                                 |
| Tag               | Astro | TagGroup, EventListCard, TechCard, SectorTagGrid                                     |
