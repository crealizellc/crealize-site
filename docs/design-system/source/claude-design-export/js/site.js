/* ============================================================
   CREALIZE — SITE BEHAVIOR
   nav state · work cards · method strip · condensation reveals · form
   ============================================================ */
(function () {
  'use strict';

  // ---------- WORK : case-study cards ----------
  const WORK = [
    {
      name: 'PurityLens',
      jp: '成分をひと目で',
      tag: 'AI · Consumer Health',
      line: 'Read the fine print on your skin — <em>photo → OCR → verdict</em>, before anything touches it.',
      ph: 'PurityLens — scan result UI',
      stack: ['Flutter', 'AI OCR', 'Cloudflare Workers', 'D1'],
      status: 'shipped',
    },
    {
      name: 'Fudeto',
      jp: '一筆書き',
      tag: 'Puzzle · Daily ritual',
      line: 'One stroke, one graph, every morning — <em>a small infinity before coffee.</em>',
      ph: 'Fudeto — daily puzzle UI',
      stack: ['Flutter', 'Cloudflare Workers', 'D1'],
      status: 'shipped',
    },
    {
      name: 'Kichitto',
      jp: 'きちっと',
      tag: 'Fintech · Solo founders',
      line: 'Receipts dissolve into ledgers — <em>photo → AI OCR → filed to Drive + Sheets.</em> Bookkeeping, garbage-collected.',
      ph: 'Kichitto — receipt capture UI',
      stack: ['Flutter', 'Gemini AI', 'Google Workspace API'],
      status: 'shipped',
    },
    {
      name: 'QiFlux',
      jp: '静かな記録',
      tag: 'Health · Privacy-first',
      line: 'The quiet, privacy-first cycle tracker — <em>a diary your body writes,</em> kept on your device.',
      ph: 'QiFlux — tracking UI',
      stack: ['Flutter', 'Riverpod', 'Cloudflare Workers', 'Hono', 'D1'],
      status: 'shipped',
    },
    {
      name: 'iDokuta',
      jp: '言葉を越える診療',
      tag: 'Telehealth · i18n',
      line: 'Telehealth across language borders — <em>consultations mediated by live translation,</em> six locales deep.',
      ph: 'iDokuta — consultation UI',
      stack: ['Flutter', '6-locale i18n', 'Cloudflare'],
      status: 'wip',
    },
    {
      name: 'Mairi',
      jp: '毎日のカルテ',
      tag: 'Health · Hospital-integrated',
      line: 'A daily health record that <em>speaks hospital</em> — personal logs, clinically integrated.',
      ph: 'Mairi — daily record UI',
      stack: ['Flutter', 'Next.js', 'LINE'],
      status: 'wip',
    },
    {
      name: 'Tendo',
      jp: '一日一道',
      tag: 'Puzzle · Daily ritual',
      line: 'Fudeto’s sister title — <em>one Hamiltonian path a day</em> keeps entropy away.',
      ph: 'Tendo — daily path UI',
      stack: ['Web', 'Cloudflare Workers', 'D1'],
      status: 'wip',
    },
  ];

  function cardHTML(w, i, wip) {
    return `
      <article class="work-card reveal" data-work-index="${i}" tabindex="0" role="button"
               aria-label="Open ${w.name}" data-screen-label="work: ${w.name}">
        <div class="work-card__shot">
          <div class="work-card__zoom">
            <div class="work-card__ph">
              <b>[ ${w.ph} ]</b>
              <span>product screenshot · drop here</span>
            </div>
          </div>
          <span class="work-card__idx">0${i + 1}</span>
          ${wip ? '<span class="work-card__badge">in development · 開発中</span>' : ''}
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
      <div class="work__sub"><span class="work__sub-label">Shipped / 出荷済み</span><span class="work__sub-n">0${shipped.length}</span></div>
      <div class="work__grid">${shipped.map((w, i) => cardHTML(w, i, false)).join('')}</div>
      <div class="work__sub work__sub--wip"><span class="work__sub-label">In development / 開発中</span><span class="work__sub-n">0${wip.length}</span></div>
      <div class="work__grid work__grid--wip">${wip.map((w, i) => cardHTML(w, i + shipped.length, true)).join('')}</div>
    `;
  }

  // expose for the materialize modal
  window.CRZ_WORK = WORK;

  // ---------- METHOD : 0→1 strip ----------
  const METHOD = [
    { n: 'Validate', jp: '検証', d: 'Every idea is a hypothesis. We write the test first — and run it on humans, not dashboards.' },
    { n: 'Build', jp: '構築', d: 'A small senior team writes the real thing. No throwaway code, no theater.' },
    { n: 'Ship', jp: '出荷', d: 'Software is literature that runs. Publish early — readers are the only honest critics.' },
    { n: 'Polish', jp: '研磨', d: 'The last 4% is the soul — latency, copy, motion. Craft is retention.' },
  ];

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
    // active link
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

  // ---------- Language menu (globe) — visual only ----------
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
    menu.querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        menu.querySelectorAll('button').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        setOpen(false);
      });
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
      const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
      const ms = nav && nav.domContentLoadedEventEnd ? nav.domContentLoadedEventEnd : performance.now();
      buildLine.innerHTML =
        `[ok] materialized in ${(ms / 1000).toFixed(2)}s · vanilla js · 0 deps · transform/opacity only <i class="cursor" aria-hidden="true"></i>`;
    };
    if (document.readyState === 'complete') stamp();
    else window.addEventListener('load', stamp);
  }

  // ---------- JOIN : form ----------
  const form = document.getElementById('join-form');
  if (form) {
    const note = document.getElementById('f-note');
    const submit = document.getElementById('f-submit');
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
        note.textContent = 'Please fill the required fields marked in orange.';
        note.classList.remove('is-sent');
        return;
      }
      submit.disabled = true;
      submit.querySelector('.btn__label').textContent = 'Sending…';
      setTimeout(() => {
        submit.querySelector('.btn__label').textContent = 'Sent';
        note.textContent = 'Message sent — ありがとうございます. We reply within two working days.';
        note.classList.add('is-sent');
        form.querySelectorAll('input, textarea').forEach((i) => { i.value = ''; });
        setTimeout(() => {
          submit.disabled = false;
          submit.querySelector('.btn__label').textContent = 'Send message';
        }, 2600);
      }, 900);
    });
    form.querySelectorAll('input, textarea').forEach((input) => {
      input.addEventListener('input', () => input.closest('.field').classList.remove('is-error'));
    });
  }
})();
