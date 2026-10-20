// Markup for the parts of the site that React used to render only in the browser.
// Everything here produces plain HTML with readable class names (see MODULE_LABELS
// in convert.mjs) so the pages carry their full content and app.js only adds behaviour.

export const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICONS = {
  arrowRight: (size, sw) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>`,
  arrowLeft: (size, sw) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5"></path><path d="m12 19-7-7 7-7"></path></svg>`,
  x: (size) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>`,
  maximize:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3H5a2 2 0 0 0-2 2v3"></path><path d="M21 8V5a2 2 0 0 0-2-2h-3"></path><path d="M3 16v3a2 2 0 0 0 2 2h3"></path><path d="M16 21h3a2 2 0 0 0 2-2v-3"></path></svg>',
  minimize:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path></svg>',
  externalLink:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6"></path><path d="M10 14 21 3"></path><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path></svg>',
  user: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><path d="M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path></svg>',
  linkedin:
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><path d="M2 9h4v12H2z"></path><path d="M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"></path></svg>',
  twitter:
    '<svg width="14" height="14" viewBox="0 0 32 32" aria-hidden="true"><path d="M25.1349 25.3708L17.7196 14.5536L24.5377 6.60806L22.9294 6.59868L17.0005 13.5008L12.2563 6.58827L6.79828 6.5966L13.9595 17.0446L6.81495 25.3694L8.42156 25.3805L14.6789 18.096L19.6918 25.3978L25.1353 25.3704L25.1349 25.3708Z" fill="currentColor"></path><path d="M22.9251 24.2123L20.4497 24.2296L9.00586 7.82702L11.4851 7.81348L22.9251 24.2123Z" fill="var(--color-background)"></path></svg>',
  mail: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><path d="M22 6l-10 7L2 6"></path></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>',
};

const SITE = 'https://bool.pt';
const absolute = (href) => (href && href.startsWith('/') ? SITE + href : href || SITE);

function shareMenu(url, title, channels, labels) {
  const u = encodeURIComponent(absolute(url));
  const t = encodeURIComponent(title);
  const parts = [];
  for (const c of channels.filter((c) => c.visible)) {
    if (c.key === 'linkedin')
      parts.push(`<a href="https://www.linkedin.com/sharing/share-offsite/?url=${u}" target="_blank" rel="noopener noreferrer" class="share-menu__icon-btn" aria-label="LinkedIn">${ICONS.linkedin}</a>`);
    if (c.key === 'x')
      parts.push(`<a href="https://x.com/intent/tweet?url=${u}&amp;text=${t}" target="_blank" rel="noopener noreferrer" class="share-menu__icon-btn" aria-label="X">${ICONS.twitter}</a>`);
    if (c.key === 'email')
      parts.push(`<a href="mailto:?subject=${t}&amp;body=${u}" class="share-menu__icon-btn" aria-label="Email">${ICONS.mail}</a>`);
    if (c.key === 'copyLink')
      parts.push(`<button type="button" class="share-menu__icon-btn" data-copy-url="${esc(absolute(url))}" data-label-copy="${esc(labels.copyLink)}" data-label-copied="${esc(labels.copied)}" aria-label="${esc(labels.copyLink)}" title="${esc(labels.copyLink)}">${ICONS.link}</button>`);
  }
  return `<div class="share-menu__row">${parts.join('')}</div>`;
}

/** One <dialog> per Insights article, mirroring InsightArticleModal.tsx. */
export function insightDialogs(articles, labels, fixUrl) {
  return articles
    .map((a, i) => {
      const id = `insight-${i}`;
      const topics = a.techStack || [];
      const external = /^https?:\/\//.test(a.href || '');
      return `<dialog class="insight-modal__dialog" data-dialog-id="${id}" aria-labelledby="${id}-title">
  <div class="insight-modal__content">
    <div class="insight-modal__toolbar">
      <button type="button" class="insight-modal__toolbar-btn" data-fullscreen aria-label="Fullscreen">${ICONS.maximize}</button>
      <button type="button" class="insight-modal__toolbar-btn" data-modal-close>${ICONS.x(20)}<span class="sr-only">${esc(labels.close)}</span></button>
    </div>
    <span class="insight-modal__category">${esc(a.category)}</span>
    <h2 id="${id}-title" class="insight-modal__title">${esc(a.title)}</h2>
    <p class="insight-modal__description">${esc(a.subtitle || '')}</p>
    ${a.frontImage ? `<div class="insight-modal__image-wrap"><img src="${esc(fixUrl(a.frontImage))}" alt="${esc(a.title)}" class="insight-modal__image" loading="lazy" decoding="async" width="1200" height="500"></div>` : ''}
    ${a.challenge || a.solution ? `<div class="insight-modal__body-columns">${a.challenge ? `<p class="insight-modal__body-highlight">${esc(a.challenge)}</p>` : ''}${a.solution ? `<p class="insight-modal__body-content">${esc(a.solution)}</p>` : ''}</div>` : ''}
    <div class="insight-modal__about-card">
      <h3 class="insight-modal__about-heading">${esc(labels.aboutThisArticle)}</h3>
      <div class="insight-modal__about-inner">
        <div class="insight-modal__author-section">
          <div class="insight-modal__avatar">${a.authorAvatar ? `<img src="${esc(fixUrl(a.authorAvatar))}" alt="${esc(a.author)}" class="insight-modal__avatar-img" width="48" height="48">` : ICONS.user}</div>
          <div class="insight-modal__author-details">
            <div class="insight-modal__author-info"><p class="insight-modal__author-name">${esc(a.author)}</p><p class="insight-modal__author-role">${esc(a.category)}</p></div>
            <div class="insight-modal__author-divider"></div>
            <div class="insight-modal__author-meta"><p class="insight-modal__author-meta-line">${esc(a.readTime)}</p><p class="insight-modal__author-meta-line">${esc(a.publishDate || '')}</p></div>
          </div>
        </div>
        <div class="insight-modal__right-column">
          <div class="insight-modal__topics-section">
            <p class="insight-modal__topics-label">${esc(labels.relatedTopics)}</p>
            <div class="insight-modal__topics-pills">${topics.map((t) => `<span class="insight-modal__topic-pill">${esc(t)}</span>`).join('')}</div>
          </div>
          <div class="insight-modal__share-section">${shareMenu(a.href, a.title, labels.shareChannels || [], labels)}</div>
        </div>
      </div>
    </div>
    <div class="insight-modal__footer">
      <button type="button" class="insight-modal__back-link" data-modal-close>${ICONS.arrowLeft(16, 2.5)}${esc(labels.backToArticles)}</button>
      ${external ? `<a href="${esc(a.href)}" target="_blank" rel="noopener noreferrer" class="insight-modal__external-link">${esc(labels.readFullArticle)}${ICONS.externalLink}</a>` : ''}
    </div>
  </div>
</dialog>`;
    })
    .join('\n');
}

function filterRow(items, { active = 0, toggle = false, ariaLabel, group, values }) {
  return `<div class="filter-grid__filter-row" role="tablist" aria-label="${esc(ariaLabel)}" data-filter-group="${group}"${toggle ? ' data-toggle' : ''}>${items
    .map((label, i) => {
      const on = i === active;
      return `<button type="button" class="filter-grid__filter-pill${on ? ' filter-grid__filter-pill-active' : ''}" role="tab" aria-selected="${on}" data-index="${i}" data-value="${esc(values ? values[i] : label)}">${esc(label)}</button>`;
    })
    .join('')}</div>`;
}

function flipCard({ front, back, attrs }) {
  return `<div class="flip-card__flip-card"${attrs || ''}>
  <div class="flip-card__flip-card-inner">
    <div class="flip-card__flip-card-face flip-card__flip-card-front" role="button" tabindex="0">${front}</div>
    <div class="flip-card__flip-card-face flip-card__flip-card-back">${back}</div>
  </div>
</div>`;
}

/** The Portfolio grid: React rendered it entirely in the browser, so it is built here. */
export function caseStudyGrid(props, fixUrl) {
  const { cases, sectors, techFilters, labels } = props;
  const pills = `<div class="filter-grid__filter-group" role="group" aria-label="${esc(labels.filterAriaLabel)}">
  ${filterRow(sectors, { active: 0, ariaLabel: labels.filterAriaLabel, group: 0 })}
  ${filterRow(techFilters.map((f) => f.label), { active: -1, toggle: true, ariaLabel: labels.filterAriaLabel, group: 1, values: techFilters.map((f) => f.key) })}
</div>`;
  const cards = cases
    .map((c, i) => {
      const front = `<img src="${esc(fixUrl(c.coverImageSrc))}" alt="${esc(c.client)}" class="flip-card__front-image" loading="lazy" decoding="async" width="600" height="400"><div class="flip-card__front-overlay"></div><div class="flip-card__front-content"><span class="flip-card__front-label">${esc(`${c.sector} - ${c.tech}`)}</span><div class="flip-card__front-title">${esc(c.subtitle)}</div>${c.tags.length ? `<div class="flip-card__front-tags">${c.tags.map((t) => `<span class="flip-card__front-tag">${esc(t)}</span>`).join('')}</div>` : ''}</div>`;
      const back = `<div class="flip-card__back-overlay"></div><div class="flip-card__back-content"><span class="flip-card__back-tag">${esc(c.backHeader)}</span>${c.subtitle ? `<h3 class="flip-card__back-title">${esc(c.subtitle)}</h3>` : ''}${c.benefits ? `<p class="flip-card__back-benefits">${esc(c.benefits)}</p>` : ''}${c.metrics.length ? `<div class="flip-card__metrics-strip">${c.metrics.map((m) => `<div><div class="flip-card__metric-value">${esc(m.value)}</div><div class="flip-card__metric-label">${esc(m.label)}</div></div>`).join('')}</div>` : ''}<button type="button" class="flip-card__back-cta" data-open-dialog="case-${i}">${esc(labels.fullCaseStudy)}${ICONS.arrowRight(20, 2.5)}</button></div>`;
      return flipCard({ front, back, attrs: ` data-filter-item data-f0="${esc(c.sector.toUpperCase())}" data-f1="${esc(c.techKey)}"` });
    })
    .join('\n');
  const dialogs = cases
    .map((c, i) => {
      const id = `case-${i}`;
      return `<dialog class="case-modal__dialog" data-dialog-id="${id}" aria-labelledby="${id}-title">
  <div class="case-modal__content">
    <button type="button" class="case-modal__close-button" data-modal-close>${ICONS.x(24)}<span class="sr-only">${esc(labels.close)}</span></button>
    <span class="case-modal__category">${esc(c.backHeader)}</span>
    <h2 id="${id}-title" class="case-modal__title">${esc(c.subtitle)}</h2>
    ${c.benefits ? `<p class="case-modal__benefits">${esc(c.benefits)}</p>` : ''}
    ${c.coverImageSrc ? `<div class="case-modal__image-wrap"><img src="${esc(fixUrl(c.coverImageSrc))}" alt="${esc(c.subtitle)}" class="case-modal__image" loading="lazy" decoding="async" width="1200" height="400"></div>` : ''}
    ${c.challenge || c.solution ? `<div class="case-modal__columns">${c.challenge ? `<div><div class="case-modal__column-label">${esc(labels.challenge)}</div><p class="case-modal__column-text">${esc(c.challenge)}</p></div>` : ''}${c.solution ? `<div><div class="case-modal__column-label">${esc(labels.solution)}</div><p class="case-modal__column-text">${esc(c.solution)}</p></div>` : ''}</div>` : ''}
    ${c.metrics.length ? `<div class="case-modal__metrics-row">${c.metrics.map((m) => `<div class="case-modal__metric-card"><div class="case-modal__metric-value">${esc(m.value)}</div><div class="case-modal__metric-label">${esc(m.label)}</div></div>`).join('')}</div>` : ''}
    ${c.tags.length ? `<div class="case-modal__tech-row"><div class="case-modal__tech-label">${esc(labels.techStack)}</div><div class="case-modal__tech-pills">${c.tags.map((t) => `<span class="case-modal__pill">${esc(t)}</span>`).join('')}</div></div>` : ''}
    <div class="case-modal__footer-row">
      <button type="button" class="case-modal__back-link" data-modal-close>${ICONS.arrowLeft(16, 2.5)}${esc(labels.backToCases)}</button>
      <a href="${esc(labels.ctaHref)}" class="case-modal__cta-button">${esc(labels.talkToExpert)}</a>
    </div>
  </div>
</dialog>`;
    })
    .join('\n');
  return `<div data-testid="case-study-grid" data-filter-grid>
${pills}
<div class="filter-grid__grid">
${cards}
<p class="filter-grid__empty-state" hidden>${esc(labels.emptyMessage)}</p>
</div>
${dialogs}
</div>`;
}
