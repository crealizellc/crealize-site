/* ============================================================
   CREALIZE — SITE BEHAVIOR
   nav state · work cards · method strip · condensation reveals · form
   i18n: data comes from js/i18n/<lang>.js (window.CRZ_I18N),
   loaded before this file by each locale page.
   ============================================================ */
(function () {
  'use strict';

  const I18N = window.CRZ_I18N || { work: [], method: [], ui: {} };
  const WORK = I18N.work;
  const METHOD = I18N.method;
  const UI = I18N.ui;

  // ---------- WORK : case-study cards ----------
  function shotHTML(w) {
    if (w.img) {
      return `<img class="work-card__img" src="${w.img}" alt="${w.alt || w.name}" loading="lazy" decoding="async" width="720" height="1560" />`;
    }
    return `
      <div class="work-card__ph">
        <b>[ ${w.ph} ]</b>
        <span>product screenshot · drop here</span>
      </div>`;
  }

  function cardHTML(w, i, wip) {
    return `
      <article class="work-card reveal" data-work-index="${i}" tabindex="0" role="button"
               aria-label="Open ${w.name}">
        <div class="work-card__shot">
          <div class="work-card__zoom">${shotHTML(w)}</div>
          <span class="work-card__idx">0${i + 1}</span>
          ${wip ? `<span class="work-card__badge">${UI.wipBadge}</span>` : ''}
        </div>
        <div class="work-card__meta">
          <span class="work-card__name">${w.name}</span>
          <span class="work-card__jp jp-accent">${w.jp}</span>
          <span class="work-card__tag">${w.tag}</span>
        </div>
        <p class="work-card__line">${w.line}</p>
        <ul class="work-card__stack" aria-label="Tech stack">
          ${w.stack.map((s) => `<li>${s}</li>`).join('')}
        </ul>
      </article>`;
  }

  const grid = document.getElementById('work-grid');
  if (grid) {
    const shipped = WORK.filter((w) => w.status === 'shipped');
    const wip = WORK.filter((w) => w.status === 'wip');
    grid.innerHTML = `
      <div class="work__sub"><span class="work__sub-label">${UI.shippedLabel}</span><span class="work__sub-n">0${shipped.length}</span></div>
      <div class="work__grid">${shipped.map((w, i) => cardHTML(w, i, false)).join('')}</div>
      <div class="work__sub work__sub--wip"><span class="work__sub-label">${UI.wipLabel}</span><span class="work__sub-n">0${wip.length}</span></div>
      <div class="work__grid work__grid--wip">${wip.map((w, i) => cardHTML(w, i + shipped.length, true)).join('')}</div>
    `;
  }

  // expose for the materialize modal
  window.CRZ_WORK = WORK;

  // ---------- METHOD : 0→1 strip ----------
  const strip = document.getElementById('method-strip');
  if (strip) {
    strip.innerHTML = METHOD.map((m, i) => `
      <div class="method-step reveal">
        <i class="method-step__bar" aria-hidden="true"></i>
        <span class="method-step__idx">0${i + 1}${i < 3 ? ' →' : ''}</span>
        <h3 class="method-step__name">${m.n} <span class="method-step__jp jp-accent">${m.jp}</span></h3>
        <p class="method-step__desc">${m.d}</p>
      </div>
    `).join('');
  }

  // ---------- Condensation reveals (scroll-driven; robust where IO is throttled) ----------
  const pending = new Set(
    document.querySelectorAll('.reveal, .reveal-child, .method-step, .sec-head')
  );
  function checkReveals() {
    const vh = window.innerHeight;
    for (const el of Array.from(pending)) {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.88 && r.bottom > vh * 0.04) {
        el.classList.add('is-in');
        pending.delete(el);
      }
    }
  }
  window.addEventListener('scroll', checkReveals, { passive: true });
  window.addEventListener('resize', checkReveals);
  const revealTimer = setInterval(() => {
    checkReveals();
    if (!pending.size) clearInterval(revealTimer);
  }, 350);
  window.__crzCheckReveals = checkReveals;
  checkReveals();

  // ---------- NAV : stuck state + active section ----------
  const nav = document.getElementById('nav');
  const links = Array.from(document.querySelectorAll('.nav__links a'));
  const sections = links
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  function onScroll() {
    if (nav) nav.classList.toggle('is-stuck', window.scrollY > 24);
    let active = -1;
    const mid = window.innerHeight * 0.5;
    sections.forEach((sec, i) => {
      const r = sec.getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid * 0.4) active = i;
    });
    links.forEach((a, i) => a.classList.toggle('is-active', i === active));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- Language menu (globe) — real locale navigation ----------
  const langWrap = document.getElementById('lang-switch');
  if (langWrap) {
    const globe = langWrap.querySelector('.nav__globe');
    const menu = langWrap.querySelector('.nav__langmenu');
    const setOpen = (open) => {
      langWrap.classList.toggle('is-open', open);
      globe.setAttribute('aria-expanded', String(open));
    };
    globe.addEventListener('click', (e) => {
      e.stopPropagation();
      setOpen(!langWrap.classList.contains('is-open'));
    });
    document.addEventListener('click', (e) => {
      if (!langWrap.contains(e.target)) setOpen(false);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  // ---------- Footer build line ----------
  const buildLine = document.getElementById('build-line');
  if (buildLine) {
    const stamp = () => {
      const navEntry = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      const ms = navEntry && navEntry.domContentLoadedEventEnd ? navEntry.domContentLoadedEventEnd : performance.now();
      buildLine.innerHTML =
        `[ok] materialized in ${(ms / 1000).toFixed(2)}s · vanilla js · 0 deps · transform/opacity only <i class="cursor" aria-hidden="true"></i>`;
    };
    if (document.readyState === 'complete') stamp();
    else window.addEventListener('load', stamp);
  }

  // ---------- JOIN : form → opens the visitor's mail app (no backend, no pretending) ----------
  const form = document.getElementById('join-form');
  if (form) {
    const note = document.getElementById('f-note');
    const submit = document.getElementById('f-submit');
    const defaultNote = note ? note.textContent : '';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((input) => {
        const field = input.closest('.field');
        const bad = !input.value.trim() ||
          (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
        field.classList.toggle('is-error', bad);
        if (bad) valid = false;
      });
      if (!valid) {
        note.textContent = UI.formErr;
        note.classList.remove('is-sent');
        return;
      }
      const v = (id) => (form.querySelector(id) ? form.querySelector(id).value.trim() : '');
      const body = [
        v('#f-msg'),
        '',
        '—',
        `Name: ${v('#f-name')}`,
        `Email: ${v('#f-email')}`,
        v('#f-link') ? `Link: ${v('#f-link')}` : '',
      ].filter(Boolean).join('\n');
      note.textContent = UI.formOpening;
      window.location.href =
        `mailto:support@crealize.llc?subject=${encodeURIComponent(UI.mailSubject)}&body=${encodeURIComponent(body)}`;
      setTimeout(() => {
        note.textContent = UI.formOpened;
        note.classList.add('is-sent');
        setTimeout(() => { note.textContent = defaultNote; note.classList.remove('is-sent'); }, 8000);
      }, 600);
    });
    form.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('input', () => input.closest('.field').classList.remove('is-error'));
    });
  }
})();
