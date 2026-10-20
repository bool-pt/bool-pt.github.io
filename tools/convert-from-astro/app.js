/* ------------------------------------------------------------------
   app.js — all the behaviour of bool.pt, in one classic script.
   No build step, no modules, no framework. Loaded with `defer`, so it
   runs after the HTML is parsed. Works when a page is opened from disk
   (file://) except for the forms, which need the bool.pt domain.

   Sections:
     1. Config             public identifiers (safe to publish)
     2. Consent            cookie banner, stored decision, events
     3. Trackers           Google Analytics, LinkedIn Insight (consent-gated)
     4. Mobile menu
     5. Small behaviours   person cards, obfuscated e-mail links, use-case track
     6. Carousels          office carousel, hero carousel
     7. Forms              Cloudflare Turnstile, contact form, newsletter
     8. Dialogs            content modals, insight and case-study modals, share
     9. Filter grids       Insights and Portfolio filters, flip cards
    10. Event calendar
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  /* 1. Config ------------------------------------------------------ */
  var CONFIG = {
    apiBase: 'https://upci9flznj.execute-api.eu-west-3.amazonaws.com',
    turnstileSiteKey: '0x4AAAAAADhfDpOEAsGxwkyt',
    gaMeasurementId: 'G-VXVL1TBPYH',
    linkedInPartnerId: '10229265',
  };

  var TEXT = {
    cookie: {
      aria: 'Cookie consent',
      message:
        'We use cookies and similar local storage to improve your experience. Choose what you allow.',
      accept: 'Accept all',
      reject: 'Reject all',
      manage: 'Manage preferences',
      save: 'Save preferences',
      back: 'Back',
    },
    consent: {
      essential: {
        label: 'Essential',
        description:
          'Required for the website to function. Includes your theme, language, and consent preferences.',
      },
      analytics: {
        label: 'Analytics',
        description:
          'Help us understand how visitors use our website and detect errors so we can improve it.',
        tools: 'Includes Google Analytics.',
      },
      marketing: {
        label: 'Marketing',
        description: 'Allow us to measure the effectiveness of our marketing campaigns.',
        tools: 'Includes the LinkedIn Insight Tag.',
      },
    },
    menu: { title: 'Menu', close: 'Close menu', navAria: 'Mobile navigation' },
    form: {
      submitting: 'Sending...',
      success: "Message sent! We'll be in touch soon.",
      error: 'Something went wrong. Please try again.',
      captchaRequired: 'Please complete the captcha verification.',
      firstName: 'First name must be at least 2 characters',
      lastName: 'Last name must be at least 2 characters',
      name: 'Name must be at least 2 characters',
      email: 'Invalid email address',
      phone: 'Invalid phone number',
      message: 'Message must be at least 10 characters',
      messageMax: 'Message must be at most 2000 characters',
    },
    close: 'Close',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k.indexOf('on') === 0) node.addEventListener(k.slice(2), attrs[k]);
      else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c) node.appendChild(c);
    });
    return node;
  }

  function readProps(root) {
    var s = root.querySelector('script[data-island-props]');
    if (!s) return {};
    try {
      return JSON.parse(s.textContent);
    } catch (e) {
      return {};
    }
  }

  /* 2. Consent ----------------------------------------------------- */
  var CONSENT_KEY = 'bool-consent';
  var CONSENT_VERSION = 2;

  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      var ok =
        c &&
        typeof c.analytics === 'boolean' &&
        typeof c.marketing === 'boolean' &&
        typeof c.timestamp === 'number' &&
        c.version === CONSENT_VERSION;
      return ok ? c : null;
    } catch (e) {
      return null;
    }
  }

  function setConsent(state) {
    var previous = getConsent();
    var record = {
      analytics: !!state.analytics,
      marketing: !!state.marketing,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(record));
    } catch (e) {
      /* private mode: the decision only lasts for this page */
    }
    window.dispatchEvent(new CustomEvent('bool:consent-updated', { detail: record }));
    if (record.analytics || record.marketing) {
      window.dispatchEvent(new CustomEvent('bool:consent-granted', { detail: record }));
    }
    var analyticsRevoked = previous && previous.analytics && !record.analytics;
    var marketingRevoked = previous && previous.marketing && !record.marketing;
    if (analyticsRevoked || marketingRevoked) {
      window.dispatchEvent(
        new CustomEvent('bool:consent-revoked', {
          detail: { analytics: !!analyticsRevoked, marketing: !!marketingRevoked },
        })
      );
    }
  }

  function onConsentGranted(category, load) {
    var current = getConsent();
    if (current && current[category] === true) {
      load();
      return;
    }
    window.addEventListener('bool:consent-granted', function handler(e) {
      if (e.detail && e.detail[category] === true) {
        window.removeEventListener('bool:consent-granted', handler);
        load();
      }
    });
  }

  function onConsentRevoked(category, teardown) {
    window.addEventListener('bool:consent-revoked', function (e) {
      if (e.detail && e.detail[category] === true) teardown();
    });
  }

  function deleteCookies(matches) {
    var parts = location.hostname.split('.');
    var domains = [''];
    for (var i = 0; i < parts.length - 1; i++) {
      var suffix = parts.slice(i).join('.');
      domains.push(suffix, '.' + suffix);
    }
    document.cookie.split(';').forEach(function (entry) {
      var name = entry.split('=')[0].trim();
      if (!name || !matches(name)) return;
      domains.forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; path=/' + (domain ? '; domain=' + domain : '');
      });
    });
  }

  function initCookieBanner() {
    var banner = null;
    var view = 'initial';
    var prefs = { analytics: false, marketing: false };

    function close() {
      if (banner) banner.remove();
      banner = null;
    }

    function categoryRow(key, checked, disabled, onChange) {
      var c = TEXT.consent[key];
      var input = el('input', {
        type: 'checkbox',
        class: 'cookie-banner__toggle',
        'aria-label': c.label,
        onchange: onChange || function () {},
      });
      input.checked = checked;
      input.disabled = !!disabled;
      return el('label', { class: 'cookie-banner__category' }, [
        el('div', { class: 'cookie-banner__category-info' }, [
          el('span', { class: 'cookie-banner__category-label', text: c.label }),
          el('span', {
            class: 'cookie-banner__category-description',
            text: c.description + (c.tools ? ' ' + c.tools : ''),
          }),
        ]),
        input,
      ]);
    }

    function render() {
      close();
      banner = el('div', { role: 'region', 'aria-label': TEXT.cookie.aria, class: 'cookie-banner__banner' });
      if (view === 'initial') {
        banner.appendChild(el('p', { class: 'cookie-banner__message', text: TEXT.cookie.message }));
        banner.appendChild(
          el('div', { class: 'cookie-banner__actions' }, [
            el('button', {
              type: 'button',
              class: 'cookie-banner__accept-button',
              text: TEXT.cookie.accept,
              onclick: function () {
                setConsent({ analytics: true, marketing: true });
                close();
              },
            }),
            el('button', {
              type: 'button',
              class: 'cookie-banner__reject-button',
              text: TEXT.cookie.reject,
              onclick: function () {
                setConsent({ analytics: false, marketing: false });
                close();
              },
            }),
          ])
        );
        banner.appendChild(
          el('button', {
            type: 'button',
            class: 'cookie-banner__manage-link',
            text: TEXT.cookie.manage,
            onclick: function () {
              view = 'preferences';
              render();
            },
          })
        );
      } else {
        banner.appendChild(el('p', { class: 'cookie-banner__message', text: TEXT.cookie.manage }));
        banner.appendChild(
          el('div', { class: 'cookie-banner__categories' }, [
            categoryRow('essential', true, true),
            categoryRow('analytics', prefs.analytics, false, function (e) {
              prefs.analytics = e.target.checked;
            }),
            categoryRow('marketing', prefs.marketing, false, function (e) {
              prefs.marketing = e.target.checked;
            }),
          ])
        );
        banner.appendChild(
          el('div', { class: 'cookie-banner__actions' }, [
            el('button', {
              type: 'button',
              class: 'cookie-banner__accept-button',
              text: TEXT.cookie.save,
              onclick: function () {
                setConsent(prefs);
                close();
              },
            }),
            el('button', {
              type: 'button',
              class: 'cookie-banner__reject-button',
              text: TEXT.cookie.back,
              onclick: function () {
                if (getConsent()) close();
                else {
                  view = 'initial';
                  render();
                }
              },
            }),
          ])
        );
      }
      document.body.appendChild(banner);
    }

    function openPreferences() {
      var stored = getConsent();
      prefs = {
        analytics: !!(stored && stored.analytics),
        marketing: !!(stored && stored.marketing),
      };
      view = 'preferences';
      render();
    }

    if (!getConsent()) {
      view = 'initial';
      render();
    }
    document.querySelectorAll('[data-island="CookiePreferencesButton"] button').forEach(function (b) {
      b.addEventListener('click', openPreferences);
    });
  }

  /* 3. Trackers ---------------------------------------------------- */
  function preconnect(href) {
    document.head.appendChild(el('link', { rel: 'preconnect', href: href, crossorigin: '' }));
  }

  function initGoogleAnalytics() {
    var id = CONFIG.gaMeasurementId;
    if (!id) return;
    onConsentGranted('analytics', function () {
      if (document.querySelector('script[data-ga-injected]')) return;
      preconnect('https://www.googletagmanager.com');
      preconnect('https://www.google-analytics.com');
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', id, {
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      var s = el('script', {
        src: 'https://www.googletagmanager.com/gtag/js?id=' + id,
        'data-ga-injected': 'true',
      });
      s.async = true;
      document.head.appendChild(s);
    });
    onConsentRevoked('analytics', function () {
      deleteCookies(function (n) {
        return n === '_ga' || n.indexOf('_ga_') === 0 || n === '_gid' || n === '_gat';
      });
      location.reload();
    });
  }

  function initLinkedInInsight() {
    var id = CONFIG.linkedInPartnerId;
    if (!id) return;
    onConsentGranted('marketing', function () {
      if (document.querySelector('script[data-linkedin-injected]')) return;
      window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
      window._linkedin_data_partner_ids.push(id);
      if (!window.lintrk) {
        var lintrk = function (a, b) {
          lintrk.q.push([a, b]);
        };
        lintrk.q = [];
        window.lintrk = lintrk;
      }
      preconnect('https://snap.licdn.com');
      var s = el('script', {
        src: 'https://snap.licdn.com/li.lms-analytics/insight.min.js',
        'data-linkedin-injected': 'true',
      });
      s.async = true;
      document.head.appendChild(s);
    });
    onConsentRevoked('marketing', function () {
      var firstParty = ['_guid', 'bcookie', 'bscookie', 'lidc', 'UserMatchHistory'];
      deleteCookies(function (n) {
        return n.indexOf('li_') === 0 || firstParty.indexOf(n) !== -1;
      });
      location.reload();
    });
  }

  function trackEvent(name, params) {
    var c = getConsent();
    if (c && c.analytics && typeof window.gtag === 'function') window.gtag('event', name, params);
  }

  /* 4. Mobile menu ------------------------------------------------- */
  function initMobileNav() {
    var button = document.querySelector('[data-island="MobileNav"] button[aria-controls="mobile-nav"]');
    if (!button) return;
    var desktopLinks = document.querySelectorAll('.site-header .nav-links a');
    var logo = document.querySelector('.site-header .site-logo');
    var logoImg = logo && logo.querySelector('img');

    var overlay = el('div', { class: 'mobile-nav-overlay', onclick: closeMenu });
    var list = el('ul', { class: 'mobile-nav-list', role: 'list' });
    desktopLinks.forEach(function (a) {
      var link = el('a', { href: a.getAttribute('href'), text: a.textContent.trim(), onclick: closeMenu });
      if (a.getAttribute('aria-current')) link.setAttribute('aria-current', 'page');
      list.appendChild(el('li', {}, [link]));
    });
    var panel = el(
      'aside',
      { id: 'mobile-nav', class: 'mobile-nav-panel', 'aria-label': TEXT.menu.title, 'aria-hidden': 'true' },
      [
        el('button', {
          type: 'button',
          class: 'mobile-nav-close',
          'aria-label': TEXT.menu.close,
          html: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>',
          onclick: closeMenu,
        }),
        logo
          ? el('a', { href: logo.getAttribute('href'), 'aria-label': logo.getAttribute('aria-label') || 'Home', onclick: closeMenu }, [
              el('img', { src: logoImg ? logoImg.getAttribute('src') : '', alt: 'Bool', width: '40', height: '40' }),
            ])
          : null,
        el('nav', { 'aria-label': TEXT.menu.navAria }, [list]),
      ]
    );
    document.body.appendChild(overlay);
    document.body.appendChild(panel);

    function openMenu() {
      overlay.setAttribute('data-open', '');
      panel.setAttribute('data-open', '');
      panel.setAttribute('aria-hidden', 'false');
      button.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      var first = panel.querySelector('a, button');
      if (first) first.focus();
    }
    function closeMenu() {
      overlay.removeAttribute('data-open');
      panel.removeAttribute('data-open');
      panel.setAttribute('aria-hidden', 'true');
      button.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
    button.addEventListener('click', openMenu);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.hasAttribute('data-open')) {
        closeMenu();
        button.focus();
      }
    });
  }

  /* 5. Small behaviours ------------------------------------------- */
  function initPersonCards() {
    var cards = document.querySelectorAll('[data-person-card]');
    if (!cards.length) return;
    function closeAll() {
      cards.forEach(function (c) {
        c.classList.remove('pcv2--open');
        var d = c.querySelector('[data-person-detail]');
        if (d) d.setAttribute('hidden', '');
      });
    }
    cards.forEach(function (card) {
      var detail = card.querySelector('[data-person-detail]');
      if (!detail) return;
      card.addEventListener('click', function (e) {
        if (e.target.closest('.pcv2-icon-link')) return;
        e.stopPropagation();
        var wasOpen = card.classList.contains('pcv2--open');
        closeAll();
        if (!wasOpen) {
          card.classList.add('pcv2--open');
          detail.removeAttribute('hidden');
        }
      });
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-person-card]')) closeAll();
    });
  }

  /* E-mail and phone links are stored base64-encoded so crawlers do not harvest them. */
  function initObfuscatedLinks() {
    document.querySelectorAll('[data-contact]').forEach(function (a) {
      var label = a.getAttribute('data-label');
      if (label && a.classList.contains('obfuscated-link')) a.textContent = atob(label);
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var href = atob(a.getAttribute('data-contact') || '');
        a.setAttribute('href', href);
        window.location.href = href;
      });
    });
  }

  /* Services page: the use-case cards scroll one card at a time with the arrows. */
  function initUseCaseTracks() {
    document.querySelectorAll('[data-uc-track]').forEach(function (track) {
      var scope = track.closest('section') || document;
      var prev = scope.querySelector('[data-uc-prev]');
      var next = scope.querySelector('[data-uc-next]');
      function step() {
        var card = track.querySelector('.uc-card');
        if (!card) return track.clientWidth;
        var gap = parseFloat(getComputedStyle(track).columnGap || '24') || 24;
        return card.offsetWidth + gap;
      }
      if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: 'smooth' }); });
    });
  }

  function onSwipe(target, onLeft, onRight) {
    var startX = 0;
    var endX = 0;
    target.addEventListener('touchstart', function (e) { startX = endX = e.touches[0].clientX; }, { passive: true });
    target.addEventListener('touchmove', function (e) { endX = e.touches[0].clientX; }, { passive: true });
    target.addEventListener('touchend', function () {
      var diff = startX - endX;
      if (Math.abs(diff) > 50) (diff > 0 ? onLeft : onRight)();
    });
  }

  /* 6. Carousels ---------------------------------------------------- */
  function initOfficeCarousels() {
    document.querySelectorAll('[data-island="OfficeCarousel"]').forEach(function (root) {
      var track = root.querySelector('.office-carousel__track');
      var viewport = root.querySelector('.office-carousel__viewport');
      var cards = Array.prototype.slice.call(root.querySelectorAll('.office-carousel__card'));
      var buttons = root.querySelectorAll('.office-carousel__nav-btn');
      if (!track || !viewport || !cards.length || buttons.length < 2) return;
      var prevBtn = buttons[0];
      var nextBtn = buttons[1];
      var GAP = 24;
      var AUTO_MS = 8000;
      var index = 0;
      var timer = null;

      function cardWidth() {
        return window.innerWidth < 768 ? window.innerWidth - 48 : 384;
      }
      function maxIndex() {
        var w = viewport.clientWidth;
        var visible = w > 0 ? Math.max(1, Math.floor((w + GAP) / (cardWidth() + GAP))) : 1;
        return Math.max(0, cards.length - visible);
      }
      function render() {
        var max = maxIndex();
        if (index > max) index = max;
        track.style.transform = 'translateX(-' + index * (cardWidth() + GAP) + 'px)';
        prevBtn.disabled = index === 0;
        nextBtn.disabled = index >= max;
      }
      function resetTimer() {
        if (timer) clearInterval(timer);
        timer = setInterval(function () {
          index = index >= maxIndex() ? 0 : index + 1;
          render();
        }, AUTO_MS);
      }
      function go(i) {
        index = Math.max(0, Math.min(maxIndex(), i));
        render();
        resetTimer();
      }
      prevBtn.addEventListener('click', function () { go(index - 1); });
      nextBtn.addEventListener('click', function () { go(index + 1); });
      cards.forEach(function (card, i) {
        var badge = card.querySelector('.office-carousel__badge');
        var overlay = card.querySelector('.office-carousel__overlay');
        function hover(on) {
          card.classList.toggle('office-carousel__card-active', on);
          if (badge) badge.classList.toggle('office-carousel__badge-expanded', on);
          if (overlay) overlay.classList.toggle('office-carousel__overlay-visible', on);
        }
        card.addEventListener('mouseenter', function () { hover(true); });
        card.addEventListener('mouseleave', function () { hover(false); });
        card.addEventListener('click', function () { go(i); });
        card.addEventListener('keydown', function (e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            go(i);
          }
        });
      });
      onSwipe(root, function () { go(index + 1); }, function () { go(index - 1); });
      window.addEventListener('resize', render);
      render();
      resetTimer();
    });
  }

  function initHeroCarousels() {
    document.querySelectorAll('[data-island="HeroCarousel"] .hero__carousel').forEach(function (root) {
      var slides = root.querySelectorAll('.hero__slide');
      var dots = root.querySelectorAll('.hero__dot');
      if (slides.length < 2) return;
      var AUTO_MS = 8000;
      var index = 0;
      var timer = null;
      function render() {
        slides.forEach(function (s, i) { s.classList.toggle('hero__slide-active', i === index); });
        dots.forEach(function (d, i) {
          d.classList.toggle('hero__dot-active', i === index);
          d.setAttribute('aria-selected', String(i === index));
        });
      }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function start() {
        stop();
        timer = setInterval(function () { index = (index + 1) % slides.length; render(); }, AUTO_MS);
      }
      function go(i) {
        stop();
        index = (i + slides.length) % slides.length;
        render();
        start();
      }
      dots.forEach(function (d, i) { d.addEventListener('click', function () { go(i); }); });
      root.addEventListener('mouseenter', stop);
      root.addEventListener('mouseleave', start);
      onSwipe(root, function () { go(index + 1); }, function () { go(index - 1); });
      render();
      start();
    });
  }

  /* 7. Forms ------------------------------------------------------- */
  var turnstileReady = null;
  function loadTurnstile() {
    if (turnstileReady) return turnstileReady;
    turnstileReady = new Promise(function (resolve, reject) {
      if (window.turnstile) return resolve(window.turnstile);
      window.__onTurnstileLoad = function () { resolve(window.turnstile); };
      var s = el('script', {
        src: 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__onTurnstileLoad',
        onerror: function () { reject(new Error('turnstile failed to load')); },
      });
      s.async = true;
      document.head.appendChild(s);
    });
    return turnstileReady;
  }

  /* A Turnstile widget that only runs its challenge when asked (on submit). */
  function createCaptcha(host, options) {
    var widgetId = null;
    var token = '';
    var pending = null;
    function render() {
      if (!CONFIG.turnstileSiteKey || !host || widgetId !== null) return Promise.resolve();
      return loadTurnstile().then(function (turnstile) {
        host.classList.add('cf-turnstile-ready');
        widgetId = turnstile.render(host, {
          sitekey: CONFIG.turnstileSiteKey,
          theme: options.theme || 'dark',
          size: options.size || 'normal',
          appearance: 'interaction-only',
          execution: 'execute',
          callback: function (t) { token = t; if (pending) pending(t); },
          'expired-callback': function () { token = ''; },
          'error-callback': function () { token = ''; if (pending) pending(''); },
        });
      });
    }
    return {
      render: render,
      getToken: function () {
        if (!CONFIG.turnstileSiteKey) return Promise.resolve('');
        if (token) return Promise.resolve(token);
        return render().then(function () {
          return new Promise(function (resolve) {
            pending = resolve;
            window.turnstile.execute(widgetId);
            setTimeout(function () { resolve(''); }, 30000);
          });
        });
      },
      reset: function () {
        token = '';
        if (widgetId !== null && window.turnstile) window.turnstile.reset(widgetId);
      },
    };
  }

  function postJson(path, body) {
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(CONFIG.apiBase + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    }).then(function (res) {
      clearTimeout(timer);
      if (!res.ok) throw { status: res.status };
      return res.json().catch(function () { return {}; });
    });
  }

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^\+?[\d\s\-().]{7,20}$/;

  function initContactForms() {
    document.querySelectorAll('[data-island="ContactForm"] form').forEach(function (form) {
      var isSimple = !!form.querySelector('[name="name"]');
      var rules = {
        email: function (v) { return EMAIL_RE.test(v) ? '' : TEXT.form.email; },
        phone: function (v) { return !v || PHONE_RE.test(v) ? '' : TEXT.form.phone; },
        message: function (v) {
          if (v.length < 10) return TEXT.form.message;
          if (v.length > 2000) return TEXT.form.messageMax;
          return '';
        },
      };
      if (isSimple) rules.name = function (v) { return v.length >= 2 && v.length <= 100 ? '' : TEXT.form.name; };
      else {
        rules.firstName = function (v) { return v.length >= 2 && v.length <= 50 ? '' : TEXT.form.firstName; };
        rules.lastName = function (v) { return v.length >= 2 && v.length <= 50 ? '' : TEXT.form.lastName; };
      }
      var submitBtn = form.querySelector('button[type="submit"]');
      var submitLabel = submitBtn ? submitBtn.textContent : '';
      var isLight = !!form.querySelector('.contact-form__light-input');
      var captcha = createCaptcha(form.querySelector('#cf-turnstile, [id^="cf-turnstile"]'), { theme: isLight ? 'light' : 'dark' });

      function showError(field, msg) {
        var holder = field.parentElement;
        var old = holder.querySelector('.contact-form__field-error');
        if (old) old.remove();
        field.removeAttribute('aria-invalid');
        if (msg) {
          holder.appendChild(el('p', { class: 'contact-form__field-error', text: msg }));
          field.setAttribute('aria-invalid', 'true');
        }
      }
      function showFormError(msg) {
        var old = form.querySelector('.contact-form__form-error');
        if (old) old.remove();
        if (!msg) return;
        var notice = form.querySelector('.contact-form__privacy-notice');
        var p = el('p', { class: 'contact-form__form-error', text: msg, role: 'alert' });
        if (notice) form.insertBefore(p, notice);
        else form.appendChild(p);
      }
      function validate() {
        var ok = true;
        Object.keys(rules).forEach(function (name) {
          var field = form.querySelector('[name="' + name + '"]');
          if (!field) return;
          var msg = rules[name](field.value.trim());
          showError(field, msg);
          if (msg) ok = false;
        });
        return ok;
      }
      function value(n) {
        var f = form.querySelector('[name="' + n + '"]');
        return f ? f.value.trim() : '';
      }

      form.addEventListener('focusin', function once() {
        form.removeEventListener('focusin', once);
        captcha.render().catch(function () {});
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        showFormError('');
        if (!validate()) return;
        submitBtn.disabled = true;
        submitBtn.textContent = TEXT.form.submitting;
        captcha
          .getToken()
          .then(function (token) {
            if (CONFIG.turnstileSiteKey && !token) throw { captcha: true };
            var name = value('name') || (value('firstName') + ' ' + value('lastName')).trim();
            var phone = value('phone');
            var message = phone ? value('message') + '\n\nPhone: ' + phone : value('message');
            return postJson('/contact', { name: name, email: value('email'), message: message, turnstile_token: token });
          })
          .then(function () {
            trackEvent('form_submission', { type: 'contact', layout: isSimple ? 'simple' : 'full' });
            var success = el('div', { class: isLight ? 'contact-form__light-success' : 'contact-form__success', role: 'status' }, [
              el('span', {
                html: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
              }),
              el('p', { class: 'contact-form__success-text', text: TEXT.form.success }),
            ]);
            form.replaceWith(success);
          })
          .catch(function (err) {
            showFormError(err && (err.captcha || err.status === 403) ? TEXT.form.captchaRequired : TEXT.form.error);
            captcha.reset();
            submitBtn.disabled = false;
            submitBtn.textContent = submitLabel;
          });
      });
    });
  }

  function initNewsletterForms() {
    document.querySelectorAll('[data-island="NewsletterForm"]').forEach(function (root) {
      var props = readProps(root);
      var labels = props.labels || {};
      var isBar = (props.variant || 'bar') === 'bar';
      var nameField = root.querySelector('.newsletter__name-field');
      var nameInput = root.querySelector('.newsletter__name-input');
      var form = root.querySelector('form.inline-input__wrapper');
      var emailInput = form && form.querySelector('input');
      var button = form && form.querySelector('button[type="submit"]');
      var consentLabel = root.querySelector('.newsletter__consent-label');
      var consentBox = consentLabel && consentLabel.querySelector('input[type="checkbox"]');
      if (!form || !emailInput || !button || !nameInput || !consentBox) return;
      var container = form.parentElement;
      var errorClass = 'newsletter__consent-error ' + (isBar ? 'newsletter__consent-error-bar' : 'newsletter__consent-error-cta');
      var captchaWrap = null;
      var captcha = null;
      var done = false;

      function clearErrors() {
        container.querySelectorAll('.newsletter__consent-error').forEach(function (p) { p.remove(); });
      }
      function showError(after, msg, extraClass) {
        var p = el('p', { class: errorClass + (extraClass ? ' ' + extraClass : ''), text: msg, role: 'alert' });
        after.insertAdjacentElement('afterend', p);
      }
      function ensureCaptcha() {
        if (!CONFIG.turnstileSiteKey) return;
        if (!captchaWrap) {
          captchaWrap = el('div', { class: 'newsletter__captcha-wrapper' });
          consentLabel.insertAdjacentElement('afterend', captchaWrap);
          captcha = createCaptcha(captchaWrap, { theme: isBar ? 'light' : 'dark', size: 'flexible' });
          captcha.render().catch(function () {});
        }
      }
      function setBusy(busy) {
        nameInput.disabled = busy || done;
        emailInput.disabled = busy || done;
        button.disabled = busy || done;
        button.classList.toggle('inline-input__button-disabled', busy || done);
      }
      root.addEventListener('input', function () {
        if (nameInput.value.trim() || emailInput.value.trim()) ensureCaptcha();
      });

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (done) return;
        clearErrors();
        var name = nameInput.value.trim();
        var email = emailInput.value.trim();
        if (name.length < 2 || name.length > 100) return showError(nameField, labels.nameRequired, 'newsletter__field-error');
        if (!EMAIL_RE.test(email)) return showError(form, TEXT.form.email);
        if (!consentBox.checked) return showError(consentLabel, labels.consentRequired);
        ensureCaptcha();
        var idle = button.textContent;
        setBusy(true);
        button.textContent = labels.loading || '...';
        (captcha ? captcha.getToken() : Promise.resolve(''))
          .then(function (token) {
            if (CONFIG.turnstileSiteKey && !token) throw { captcha: true };
            return postJson('/subscribe', { name: name, email: email, turnstile_token: token });
          })
          .then(function () {
            trackEvent('form_submission', { type: 'newsletter' });
            done = true;
            button.textContent = labels.subscribed || 'Subscribed';
            nameInput.value = '';
            emailInput.value = '';
            setBusy(false);
            if (captcha) captcha.reset();
          })
          .catch(function (err) {
            var tail = captchaWrap || consentLabel;
            showError(tail, err && (err.captcha || err.status === 403) ? labels.captchaRequired : labels.error);
            if (captcha) captcha.reset();
            setBusy(false);
            button.textContent = idle;
          });
      });
    });
  }

  /* 8. Dialogs ------------------------------------------------------ */
  function initDialogs() {
    var dialogs = document.querySelectorAll('dialog[data-dialog-id], dialog[data-modal-key]');
    if (!dialogs.length) return;
    dialogs.forEach(function (d) {
      d.querySelectorAll('[data-modal-close]').forEach(function (b) {
        b.addEventListener('click', function () { d.close(); });
      });
      d.addEventListener('click', function (e) {
        if (e.target === d) d.close(); // click on the backdrop
      });
      d.addEventListener('close', function () {
        d.classList.remove('insight-modal__dialog-fullscreen');
        var fs = d.querySelector('[data-fullscreen]');
        if (fs) fs.setAttribute('aria-label', TEXT.fullscreen);
      });
      var fs = d.querySelector('[data-fullscreen]');
      if (fs) {
        var icons = { on: fs.innerHTML, off: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v3a2 2 0 0 1-2 2H3"></path><path d="M21 8h-3a2 2 0 0 1-2-2V3"></path><path d="M3 16h3a2 2 0 0 1 2 2v3"></path><path d="M16 21v-3a2 2 0 0 1 2-2h3"></path></svg>' };
        fs.addEventListener('click', function () {
          var full = d.classList.toggle('insight-modal__dialog-fullscreen');
          fs.innerHTML = full ? icons.off : icons.on;
          fs.setAttribute('aria-label', full ? TEXT.exitFullscreen : TEXT.fullscreen);
        });
      }
    });
    document.querySelectorAll('a[href^="modal:"]').forEach(function (a) { a.setAttribute('aria-haspopup', 'dialog'); });
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      var opener = e.target.closest('[data-open-dialog]');
      var link = e.target.closest('a[href^="modal:"]');
      var dialog = null;
      if (opener) dialog = document.querySelector('dialog[data-dialog-id="' + opener.getAttribute('data-open-dialog') + '"]');
      else if (link) dialog = document.querySelector('dialog[data-modal-key="' + link.getAttribute('href').slice('modal:'.length) + '"]');
      if (!dialog) return;
      e.preventDefault();
      e.stopPropagation();
      dialog.showModal();
    });
    document.querySelectorAll('[data-copy-url]').forEach(function (b) {
      b.addEventListener('click', function () {
        var url = b.getAttribute('data-copy-url');
        if (navigator.clipboard) navigator.clipboard.writeText(url).catch(function () {});
        b.classList.add('share-menu__icon-btn-copied');
        b.setAttribute('aria-label', b.getAttribute('data-label-copied'));
        b.setAttribute('title', b.getAttribute('data-label-copied'));
        setTimeout(function () {
          b.classList.remove('share-menu__icon-btn-copied');
          b.setAttribute('aria-label', b.getAttribute('data-label-copy'));
          b.setAttribute('title', b.getAttribute('data-label-copy'));
        }, 2000);
      });
    });
  }

  /* 9. Filter grids and flip cards ---------------------------------- */
  function initFlipCards() {
    document.querySelectorAll('.flip-card__flip-card').forEach(function (card) {
      var inner = card.querySelector('.flip-card__flip-card-inner');
      var front = card.querySelector('.flip-card__flip-card-front');
      var back = card.querySelector('.flip-card__flip-card-back');
      if (!inner || !front || !back) return;
      function toggle() { inner.classList.toggle('flip-card__flip-card-inner-flipped'); }
      front.addEventListener('click', toggle);
      front.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      back.addEventListener('click', function (e) { if (e.target === back) toggle(); });
    });
  }

  function initFilterGrids() {
    document.querySelectorAll('[data-filter-grid]').forEach(function (root) {
      var groups = Array.prototype.slice.call(root.querySelectorAll('[data-filter-group]'));
      var items = Array.prototype.slice.call(root.querySelectorAll('[data-filter-item]'));
      var empty = root.querySelector('.filter-grid__empty-state');
      if (!groups.length || !items.length) return;
      var active = groups.map(function (g) { return g.hasAttribute('data-toggle') ? -1 : 0; });

      function matches(item, gi) {
        var idx = active[gi];
        if (idx === -1 || (idx === 0 && !groups[gi].hasAttribute('data-toggle'))) return true;
        var pill = groups[gi].querySelector('[data-index="' + idx + '"]');
        var wanted = (pill.getAttribute('data-value') || '').toUpperCase();
        var have = (item.getAttribute('data-f' + gi) || '').toUpperCase().split('|');
        return have.indexOf(wanted) !== -1;
      }
      function apply() {
        var shown = 0;
        items.forEach(function (item) {
          var ok = groups.every(function (_, gi) { return matches(item, gi); });
          item.hidden = !ok;
          if (ok) shown++;
        });
        if (empty) empty.hidden = shown > 0;
        groups.forEach(function (g, gi) {
          g.querySelectorAll('[data-index]').forEach(function (p) {
            var on = Number(p.getAttribute('data-index')) === active[gi];
            p.classList.toggle('filter-grid__filter-pill-active', on);
            p.setAttribute('aria-selected', String(on));
          });
        });
      }
      groups.forEach(function (g, gi) {
        g.addEventListener('click', function (e) {
          var pill = e.target.closest('[data-index]');
          if (!pill) return;
          var i = Number(pill.getAttribute('data-index'));
          active[gi] = g.hasAttribute('data-toggle') && active[gi] === i ? -1 : i;
          apply();
        });
      });
      apply();
    });
  }

  /* 10. Event calendar ---------------------------------------------- */
  function initEventCalendars() {
    document.querySelectorAll('[data-island="EventCalendar"]').forEach(function (root) {
      var props = readProps(root);
      var host = root.querySelector('.calendar__calendar');
      if (!host) return;
      var events = (props.events || []).map(function (e) { return Object.assign({}, e, { d: new Date(e.date) }); });
      var DAYS = props.dayNames || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      var MONTHS = props.monthNames || ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var PREFIX = props.eventPrefix || 'Event';
      var aria = props.ariaLabels || {};
      var today = new Date();
      var first = events.length ? events[0].d : today;
      var month = first.getMonth();
      var year = first.getFullYear();
      var selected = events.length ? first.getDate() : null;

      function eventOn(day) {
        for (var i = 0; i < events.length; i++) {
          var d = events[i].d;
          if (d.getFullYear() === year && d.getMonth() === month && d.getDate() === day) return events[i];
        }
        return null;
      }
      function dispatch(title) {
        window.dispatchEvent(new CustomEvent('bool:calendar-select', { detail: { title: title } }));
      }
      var chevron = function (dir) {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + (dir < 0 ? 'm15 18-6-6 6-6' : 'm9 18 6-6-6-6') + '"></path></svg>';
      };
      function render() {
        var daysInMonth = new Date(year, month + 1, 0).getDate();
        var firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
        var prevMonth = month === 0 ? 11 : month - 1;
        var prevYear = month === 0 ? year - 1 : year;
        var daysInPrev = new Date(prevYear, prevMonth + 1, 0).getDate();
        var cells = '';
        var i;
        for (i = firstDay; i > 0; i--) cells += '<span class="calendar__cell calendar__cell-outside" aria-hidden="true">' + (daysInPrev - i + 1) + '</span>';
        for (i = 1; i <= daysInMonth; i++) {
          var ev = eventOn(i);
          var isToday = i === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          var cls = 'calendar__cell' + (isToday ? ' calendar__cell-today' : '') + (ev ? ' calendar__cell-event' : '') + (i === selected ? ' calendar__cell-selected' : '');
          cells += '<button type="button" class="' + cls + '"' + (ev && ev.tagColor ? ' style="background-color:' + ev.tagColor + '"' : '') + ' data-day="' + i + '" aria-label="' + MONTHS[month] + ' ' + i + '">' + i + '</button>';
        }
        var total = firstDay + daysInMonth;
        var trailing = (7 - (total % 7)) % 7;
        for (i = 1; i <= trailing; i++) cells += '<span class="calendar__cell calendar__cell-outside" aria-hidden="true">' + i + '</span>';
        var sel = selected !== null ? eventOn(selected) : null;
        var preview = sel
          ? '<div class="calendar__preview"><div class="calendar__preview-header"><span class="calendar__preview-tag"' + (sel.tagColor ? ' style="background-color:' + sel.tagColor + '"' : '') + '>' + (sel.tag || '') + '</span><span class="calendar__preview-date">' + MONTHS[sel.d.getMonth()] + ' ' + sel.d.getDate() + '</span></div><p class="calendar__preview-title">' + PREFIX + ' ' + (sel.tag || '') + ': <span class="calendar__preview-title-value">' + (sel.title.split('—')[0] || '').trim() + '</span></p></div>'
          : '';
        host.innerHTML =
          '<div class="calendar__header"><button type="button" class="calendar__nav-btn" data-nav="-1" aria-label="' + (aria.prevMonth || '') + '">' + chevron(-1) + '</button><span class="calendar__month-label">' + MONTHS[month] + ' ' + year + '</span><button type="button" class="calendar__nav-btn" data-nav="1" aria-label="' + (aria.nextMonth || '') + '">' + chevron(1) + '</button></div>' +
          '<div class="calendar__day-names">' + DAYS.map(function (d) { return '<span class="calendar__day-name">' + d + '</span>'; }).join('') + '</div>' +
          '<div class="calendar__grid">' + cells + '</div>' + preview;
      }
      host.addEventListener('click', function (e) {
        var nav = e.target.closest('[data-nav]');
        if (nav) {
          month += Number(nav.getAttribute('data-nav'));
          if (month < 0) { month = 11; year--; }
          if (month > 11) { month = 0; year++; }
          selected = null;
          render();
          return;
        }
        var cell = e.target.closest('[data-day]');
        if (cell) {
          selected = Number(cell.getAttribute('data-day'));
          var ev = eventOn(selected);
          dispatch(ev ? ev.title : null);
          render();
        }
      });
      render();
      if (events.length) dispatch(events[0].title);
    });
    // Event cards (when the page lists them) highlight the selected calendar day.
    window.addEventListener('bool:calendar-select', function (e) {
      var title = e.detail && e.detail.title;
      document.querySelectorAll('[data-event-title]').forEach(function (card) {
        (card.querySelector('.event-detail-card') || card).classList.toggle('is-selected', card.getAttribute('data-event-title') === title);
      });
    });
  }

  /* Boot ------------------------------------------------------------ */
  initCookieBanner();
  initGoogleAnalytics();
  initLinkedInInsight();
  initMobileNav();
  initPersonCards();
  initObfuscatedLinks();
  initUseCaseTracks();
  initOfficeCarousels();
  initHeroCarousels();
  initContactForms();
  initNewsletterForms();
  initDialogs();
  initFlipCards();
  initFilterGrids();
  initEventCalendars();
})();
