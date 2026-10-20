// One-off converter: Astro `dist/` -> plain static site.
// Usage: node convert.mjs <distDir> <outDir> <repoNodeModules>
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const [distDir, outDir, nm] = process.argv.slice(2).map((p) => path.resolve(p));
const require = createRequire(path.join(nm, 'x.js'));
const { JSDOM } = require(path.join(nm, '.pnpm/jsdom@29.0.2/node_modules/jsdom'));
const sharp = require(path.join(nm, '.pnpm/sharp@0.34.5/node_modules/sharp'));
const prettier = require(path.join(nm, 'prettier'));
const { insightDialogs, caseStudyGrid, esc: escHtml } = await import('./islands.mjs');

// CSS-module class names come out of the Astro build as `_name_hash_line`.
// Each hash is one component stylesheet; give it a readable label so the final
// HTML and CSS read as `office-carousel__card` instead of `_card_pysy0_46`.
const MODULE_LABELS = {
  hwbf9: 'insight-modal', '1p2vv': 'case-modal', '1vyrb': 'flip-card', firu1: 'hero', pysy0: 'office-carousel',
  wajh3: 'event-modal', '1gjaa': 'contact-form', '8nndy': 'calendar', '1ptbb': 'testimonials', '1vaau': 'cookie-banner',
  '1ifi5': 'portfolio-testimonials', '13i54': 'newsletter', '13l6n': 'news-grid', '1v0dy': 'content-modal',
  dr43x: 'inline-input', '1ga38': 'filter-grid', '6l0am': 'share-menu',
};
const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
const HASHED_CLASS = /^_([A-Za-z][A-Za-z0-9]*)_([a-z0-9]{5})_(\d+)$/;
const readableClass = (name, hash) => `${MODULE_LABELS[hash] || 'ui-' + hash}__${kebab(name)}`;
const unknownHashes = new Set();

const ASTRO = '/_astro/';
const pages = fs
  .readdirSync(distDir, { recursive: true })
  .filter((p) => (p.endsWith('index.html') || p === '404.html') && !p.startsWith('_astro') && !p.includes('json-editor'))
  .map((p) => p.replace(/\\/g, '/'));

// ---------- pass 1: collect every /_astro asset referenced by pages and css ----------
const cssOrder = []; // global order of css files, respecting each page's own <link> order
const cssSequences = []; // per page
const pageDocs = []; // original DOMs, used to test which scoped rules ever matched
const assetRefs = new Map(); // hashed filename -> { ext, base, widths:Set }
const dehash = (file) => {
  // name.HASH.ext  |  name.HASH_HASH2.ext  -> { base, ext }
  const m = file.match(/^(.*)\.([A-Za-z0-9_-]{6,})\.(\w+)$/);
  return m ? { base: m[1], ext: m[3] } : { base: file.replace(/\.\w+$/, ''), ext: file.split('.').pop() };
};
const noteAsset = (file, width) => {
  if (!assetRefs.has(file)) assetRefs.set(file, { ...dehash(file), widths: new Set() });
  if (width) assetRefs.get(file).widths.add(width);
};
// Astro keeps original file names, so an asset URL may contain spaces (raw or %20).
// The extension must be followed by a delimiter, because Astro keeps the source
// extension inside the name ("Ahold_Delhaize.svg.HASH_HASH.webp").
const ASSET_RE = /\/_astro\/(.+?\.(?:webp|avif|png|jpe?g|svg|gif|ico|woff2?|ttf|otf|css|js|pdf|mp4))(?=["'\s),]|$)/g;
const fileOf = (m) => decodeURIComponent(m);
const scanAttr = (value) => {
  for (const m of value.matchAll(ASSET_RE)) noteAsset(fileOf(m[1]));
};
for (const rel of pages) {
  const html = fs.readFileSync(path.join(distDir, rel), 'utf8');
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  pageDocs.push(doc);
  cssSequences.push([...doc.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.getAttribute('href').replace(ASTRO, '')));
  doc.querySelectorAll('[src],[href],[srcset],[style],[content],[poster]').forEach((el) => {
    for (const a of ['src', 'href', 'style', 'content', 'poster']) {
      const v = el.getAttribute(a);
      if (v && v.includes(ASTRO)) scanAttr(v);
    }
    const ss = el.getAttribute('srcset');
    if (ss) for (const m of ss.matchAll(new RegExp(ASSET_RE.source + '(?:\\s+(\\d+w))?', 'g'))) noteAsset(fileOf(m[1]), m[2]);
  });
  doc.querySelectorAll('style').forEach((s) => scanAttr(s.textContent));
  // Images that only exist in island props (case-study covers, author avatars).
  doc.querySelectorAll('astro-island[props]').forEach((isl) => scanAttr(isl.getAttribute('props')));
}
// Cascade order matters (the global Tailwind sheet comes after page styles on
// every page), so merge the per-page sequences with a topological sort.
{
  const after = new Map(); // file -> files that must come after it
  const all = new Set();
  for (const seq of cssSequences) seq.forEach((f, i) => { all.add(f); if (!after.has(f)) after.set(f, new Set()); if (i > 0) after.get(seq[i - 1]).add(f); });
  const indeg = new Map([...all].map((f) => [f, 0]));
  for (const s of after.values()) for (const f of s) indeg.set(f, indeg.get(f) + 1);
  const queue = [...all].filter((f) => indeg.get(f) === 0);
  while (queue.length) { const f = queue.shift(); cssOrder.push(f); for (const g of after.get(f) || []) { indeg.set(g, indeg.get(g) - 1); if (indeg.get(g) === 0) queue.push(g); } }
  for (const f of all) if (!cssOrder.includes(f)) cssOrder.push(f); // cycle fallback
}
for (const f of cssOrder) scanAttr(fs.readFileSync(path.join(distDir, '_astro', f), 'utf8'));

// ---------- assign de-hashed names (images that share base+ext get a -<width> suffix) ----------
const byBase = new Map();
for (const [file, info] of assetRefs) {
  if (['css', 'js'].includes(info.ext)) continue;
  const k = `${info.base}.${info.ext}`;
  if (!byBase.has(k)) byBase.set(k, []);
  byBase.get(k).push(file);
}
const newName = new Map(); // hashed -> new relative path under assets/
for (const [k, files] of byBase) {
  const { base: rawBase, ext } = assetRefs.get(files[0]);
  // URL-safe, human-readable file names: "Case Study - Banking Portal" -> "case-study-banking-portal"
  const base = rawBase
    .replace(/\.(svg|png|jpe?g|webp|avif)$/i, '') // source extension Astro keeps in the name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const isFont = ['woff2', 'woff', 'ttf', 'otf'].includes(ext);
  const dir = isFont ? 'fonts' : 'img';
  if (files.length === 1) {
    newName.set(files[0], `${dir}/${base}.${ext}`);
  } else {
    for (const f of files) {
      const meta = await sharp(path.join(distDir, '_astro', f)).metadata();
      newName.set(f, `${dir}/${base}-${meta.width}.${ext}`);
    }
  }
}
// copy assets
for (const [hashed, rel] of newName) {
  const dest = path.join(outDir, 'assets', rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(distDir, '_astro', hashed), dest);
}
// public files (no hash): copy whole dirs/files except _astro and pages
for (const entry of fs.readdirSync(distDir)) {
  if (['_astro', '~partytown', 'sitemap-index.xml', 'sitemap-0.xml', 'index.html'].includes(entry)) continue;
  const src = path.join(distDir, entry);
  if (fs.statSync(src).isDirectory()) {
    const inner = fs.readdirSync(src);
    if (inner.includes('index.html') && inner.length === 1) continue; // a page dir
    for (const f of inner) if (f !== 'index.html') { fs.mkdirSync(path.join(outDir, entry), { recursive: true }); fs.cpSync(path.join(src, f), path.join(outDir, entry, f), { recursive: true }); }
  } else fs.copyFileSync(src, path.join(outDir, entry));
}

// ---------- css: concatenate, rename astro scoping, rewrite urls ----------
// Astro scopes each component's styles with a `[data-astro-cid-<hash>]` attribute
// selector, and puts that attribute on the component's elements. The attribute is
// part of the cascade (specificity, and some rules only match where it is), so it
// stays, under a readable name: `data-c-section-intro` instead of `data-astro-cid-fe6exug5`.
const rawCss = cssOrder.map((f) => fs.readFileSync(path.join(distDir, '_astro', f), 'utf8')).join('\n');
const cidLabel = new Map();
{
  const votes = new Map(); // cid -> { className: count }
  for (const m of rawCss.matchAll(/\.([a-zA-Z][\w-]*)\[data-astro-cid-([a-z0-9]+)\]/g)) {
    const [, cls, cid] = m;
    if (!votes.has(cid)) votes.set(cid, new Map());
    votes.get(cid).set(cls, (votes.get(cid).get(cls) || 0) + 1);
  }
  const used = new Set();
  const allCids = new Set([...rawCss.matchAll(/data-astro-cid-([a-z0-9]+)/g)].map((m) => m[1]));
  for (const d of pageDocs) d.querySelectorAll('*').forEach((el) => { for (const a of el.attributes) if (a.name.startsWith('data-astro-cid-')) allCids.add(a.name.slice(15)); });
  for (const cid of allCids) {
    const v = votes.get(cid);
    let label = v ? [...v.entries()].sort((a, b) => b[1] - a[1])[0][0] : cid;
    label = label.replace(/--.*$/, '').replace(/[^a-z0-9-]/gi, '').toLowerCase() || cid;
    if (used.has(label)) label = `${label}-${cid.slice(0, 4)}`;
    used.add(label);
    cidLabel.set(cid, label);
  }
}
const renameCid = (css) => css.replace(/data-astro-cid-([a-z0-9]+)/g, (_, cid) => `data-c-${cidLabel.get(cid) || cid}`);
const stripCid = renameCid;
const rewriteCssUrls = (css) =>
  css.replace(/url\((['"]?)\/_astro\/([^'")]+)\1\)/g, (_, q, f) => `url(${q}${newName.get(fileOf(f))}${q})`);
let cssOut = '';
const inlineSeen = new Set();
for (const f of cssOrder) {
  cssOut += `/* ---- ${dehash(f).base} ---- */\n` + rewriteCssUrls(stripCid(fs.readFileSync(path.join(distDir, '_astro', f), 'utf8'))) + '\n';
}

// ---------- pass 2: rewrite pages ----------
const toRel = (depth) => (depth === 0 ? './' : '../'.repeat(depth));
const rewriteHref = (href, prefix) => {
  if (!href || !href.startsWith('/') || href.startsWith('//')) return href;
  const m = href.match(/^\/([^#?]*)(#.*)?$/);
  if (!m) return href;
  let p = m[1].replace(/\/$/, '');
  const hash = m[2] || '';
  if (p === '') return `${prefix}index.html${hash}`;
  if (/\.[a-z0-9]+$/i.test(p)) return `${prefix}${p}${hash}`; // a file (pdf, svg, png, txt)
  return `${prefix}${p}/index.html${hash}`;
};
const decodeProps = (v) => {
  if (!Array.isArray(v)) return v;
  const [t, val] = v;
  if (t === 0) return val && typeof val === 'object' ? Object.fromEntries(Object.entries(val).map(([k, x]) => [k, decodeProps(x)])) : val;
  if (t === 1) return val.map(decodeProps);
  return val;
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const report = { pages: [], modals: {} };

for (const rel of pages) {
  const depth = rel.split('/').length - 1;
  const prefix = toRel(depth);
  const dom = new JSDOM(fs.readFileSync(path.join(distDir, rel), 'utf8'));
  const doc = dom.window.document;
  const removed = [];

  // inline <style>: hoist into site.css once
  doc.querySelectorAll('style').forEach((s) => {
    const css = rewriteCssUrls(stripCid(s.textContent));
    if (!inlineSeen.has(css)) { inlineSeen.add(css); cssOut += `/* ---- inline (${rel}) ---- */\n${css}\n`; }
    s.remove();
  });
  // stylesheet links -> one
  doc.querySelectorAll('link[rel="stylesheet"],link[rel="modulepreload"],link[rel="sitemap"],meta[name="generator"]').forEach((l) => l.remove());
  for (const f of ['site.css', 'app.css']) {
    const css = doc.createElement('link'); css.setAttribute('rel', 'stylesheet'); css.setAttribute('href', `${prefix}assets/${f}`);
    doc.head.appendChild(css);
  }
  // scripts
  doc.querySelectorAll('script').forEach((s) => {
    const type = s.getAttribute('type') || '';
    if (type === 'application/ld+json') return;
    const txt = s.textContent || '';
    if (!s.hasAttribute('src') && type === '' && txt.includes("localStorage.getItem('theme')")) return; // theme bootstrap
    removed.push((s.getAttribute('src') || txt.slice(0, 50)).replace(/\s+/g, ' '));
    s.remove();
  });
  const js = doc.createElement('script'); js.setAttribute('src', `${prefix}assets/app.js`); js.setAttribute('defer', '');
  doc.head.appendChild(js);
  // islands
  const fixUrl = (v) => v.replace(ASSET_RE, (_, f) => `${prefix}assets/${newName.get(fileOf(f))}`);
  const propsOf = (isl) => {
    const raw = JSON.parse(isl.getAttribute('props') || '{}');
    const out = {};
    for (const [k, v] of Object.entries(raw)) if (!k.startsWith('data-astro-')) out[k] = decodeProps(v);
    return out;
  };
  const propsScript = (props) =>
    `<script type="application/json" data-island-props>${JSON.stringify(props).replace(/</g, '\\u003c')}</script>`;
  doc.querySelectorAll('astro-island').forEach((isl) => {
    const comp = (isl.getAttribute('component-url') || '').split('/').pop().split('.')[0];
    const exp = isl.getAttribute('component-export');
    const name = exp && exp !== 'default' ? exp : comp;
    if (name === 'KnowledgeGrid') {
      const props = propsOf(isl);
      const root = doc.createElement('div'); root.setAttribute('data-island', name);
      const grid = doc.createElement('div'); grid.setAttribute('data-filter-grid', '');
      while (isl.firstChild) grid.appendChild(isl.firstChild);
      // Filters and cards are server-rendered; add what the filter needs to match them.
      grid.querySelectorAll('[class*="_filterRow_"]').forEach((row) => {
        row.setAttribute('data-filter-group', '0');
        row.querySelectorAll('button').forEach((b, i) => { b.setAttribute('data-index', String(i)); b.setAttribute('data-value', b.textContent.trim()); });
      });
      const cards = grid.querySelectorAll('[class*="_flipCard_"]');
      cards.forEach((card, i) => {
        const a = props.articles[i];
        if (!a) return;
        card.setAttribute('data-filter-item', '');
        card.setAttribute('data-f0', a.tags.join('|'));
        const cta = card.querySelector('button[class*="_backCta_"]');
        if (cta) cta.setAttribute('data-open-dialog', `insight-${i}`);
      });
      const gridBox = grid.querySelector('[class*="_grid_"]');
      if (gridBox) gridBox.insertAdjacentHTML('beforeend', `<p class="filter-grid__empty-state" hidden>${escHtml(props.labels.emptyMessage)}</p>`);
      root.appendChild(grid);
      root.insertAdjacentHTML('beforeend', insightDialogs(props.articles, props.labels, fixUrl));
      isl.replaceWith(root);
      return;
    }
    if (name === 'CaseStudyGrid') {
      const props = propsOf(isl);
      const root = doc.createElement('div'); root.setAttribute('data-island', name);
      root.innerHTML = caseStudyGrid(props, fixUrl);
      isl.replaceWith(root);
      return;
    }
    if (name === 'NewsletterForm' || name === 'HeroCarousel' || name === 'EventCalendar') {
      const props = propsOf(isl);
      delete props.captchaSiteKey; // lives in app.js CONFIG
      const root = doc.createElement('div'); root.setAttribute('data-island', name);
      while (isl.firstChild) root.appendChild(isl.firstChild);
      root.insertAdjacentHTML('beforeend', propsScript(props));
      isl.replaceWith(root);
      return;
    }
    if (name === 'ModalHost') {
      const props = decodeProps(JSON.parse(isl.getAttribute('props')).modals);
      report.modals[rel] = props.map((m) => m.key);
      const host = doc.createElement('div'); host.setAttribute('data-modals', '');
      for (const m of props) {
        host.insertAdjacentHTML('beforeend',
          `<dialog class="content-modal" data-modal-key="${esc(m.key)}" aria-labelledby="modal-${esc(m.key)}-title">
  <button type="button" class="content-modal__close" data-modal-close aria-label="Close">&times;</button>
  ${m.image ? `<div class="content-modal__image-wrap"><img src="${esc(rewriteHref(m.image, prefix))}" alt="" class="content-modal__image" width="600" height="400" loading="lazy"></div>` : ''}
  <h2 id="modal-${esc(m.key)}-title" class="content-modal__title">${esc(m.title)}</h2>
  ${m.body ? `<p class="content-modal__body">${esc(m.body)}</p>` : ''}
  ${m.ctaHref ? `<a href="${esc(rewriteHref(m.ctaHref, prefix))}" class="content-modal__cta">${esc(m.ctaLabel || '')}</a>` : ''}
</dialog>`);
      }
      isl.replaceWith(host);
      return;
    }
    if (!isl.innerHTML.trim()) { isl.remove(); return; } // CookieBanner: rendered by site.js
    // mark the root so site.js can find it
    const root = doc.createElement('div'); root.setAttribute('data-island', name);
    while (isl.firstChild) root.appendChild(isl.firstChild);
    isl.replaceWith(root);
  });
  doc.querySelectorAll('astro-slot, astro-static-slot').forEach((s) => s.replaceWith(...s.childNodes));
  doc.querySelectorAll('template[data-astro-template]').forEach((t) => t.remove());
  // attributes
  doc.querySelectorAll('*').forEach((el) => {
    for (const a of [...el.attributes]) {
      if (a.name.startsWith('data-astro-cid-')) { el.removeAttribute(a.name); el.setAttribute(`data-c-${cidLabel.get(a.name.slice(15)) || a.name.slice(15)}`, ''); }
      else if (/^data-astro-(source|transition)/.test(a.name)) el.removeAttribute(a.name);
    }
    const cls = el.getAttribute('class');
    if (cls && cls.includes('_')) {
      el.setAttribute('class', cls.split(/\s+/).filter(Boolean).map((t) => {
        const m = t.match(HASHED_CLASS);
        if (!m) return t;
        if (!MODULE_LABELS[m[2]]) unknownHashes.add(m[2]);
        return readableClass(m[1], m[2]);
      }).join(' '));
    }
  });
  // urls
  doc.querySelectorAll('[src],[href],[srcset],[style],[poster]').forEach((el) => {
    for (const a of ['src', 'poster', 'style']) { const v = el.getAttribute(a); if (v && v.includes(ASTRO)) el.setAttribute(a, fixUrl(v)); }
    const ss = el.getAttribute('srcset'); if (ss) el.setAttribute('srcset', fixUrl(ss));
    const href = el.getAttribute('href');
    if (href) {
      if (href.includes(ASTRO)) el.setAttribute('href', fixUrl(href));
      else if (el.tagName === 'A' || el.tagName === 'LINK' && /icon/.test(el.getAttribute('rel') || '')) el.setAttribute('href', rewriteHref(href, prefix));
    }
    for (const a of ['src', 'poster']) { const v = el.getAttribute(a); if (v && v.startsWith('/') && !v.startsWith('//')) el.setAttribute(a, rewriteHref(v, prefix)); }
  });
  // output
  let html = '<!doctype html>\n' + doc.documentElement.outerHTML;
  html = html.replace(/<!--astro:end-->/g, '');
  html = await prettier.format(html, { parser: 'html', printWidth: 120, htmlWhitespaceSensitivity: 'css' });
  const dest = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  report.pages.push({ page: rel, bytes: html.length, removedScripts: removed.length });
}
fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true });
// Islands became <div data-island>; rules on <astro-slot> are dead without the runtime.
cssOut = cssOut.replace(/astro-island/g, '[data-island]');
cssOut = cssOut.replace(/[^{}]*astro-slot[^{]*\{[^}]*\}/g, '');
cssOut = cssOut.replace(/\._([A-Za-z][A-Za-z0-9]*)_([a-z0-9]{5})_(\d+)/g, (_, n, h) => {
  if (!MODULE_LABELS[h]) unknownHashes.add(h);
  return '.' + readableClass(n, h);
});
if (unknownHashes.size) console.error('Unlabelled CSS module hashes:', [...unknownHashes]);
cssOut = await prettier.format(cssOut, { parser: 'css' });
fs.writeFileSync(path.join(outDir, 'assets', 'site.css'), cssOut);
// Hand-written behaviour and its styles live next to this converter and are copied as-is.
const here = path.dirname(new URL(import.meta.url).pathname);
for (const f of ['app.css', 'app.js']) fs.copyFileSync(path.join(here, f), path.join(outDir, 'assets', f));
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');
console.log(JSON.stringify({ assets: newName.size, cssFiles: cssOrder.length, cssBytes: cssOut.length, ...report }, null, 1));
