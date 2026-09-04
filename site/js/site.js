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
  /* a11y (2026-09-04)：i18n 的 jp 欄位在 en 頁是日文、在 zh 頁是中文（zh.js 給的是譯名）。
     不能依頁面語言硬標 lang="ja"，改用假名偵測：有平假名/片假名就一定是日文；
     純漢字字串分不出日/中，不標（寧可不宣稱，也不錯標）。回傳可直接塞進模板的屬性字串。 */
  const jaLang = (s) => (/[぀-ヿ]/.test(String(s || '')) ? ' lang="ja"' : '');

  // ---------- WORK : 產品卡 ----------
  // 2026-08-09：產品卡改由 js/work-v3.js 渲染進 #work-cards（Claude Design 的 Work v3
  // ——per-product motif + 各自的動畫 + 三語各自撰寫的說明）。原本這裡的
  // shotHTML() / cardHTML() 只出 8 張 featured 截圖卡，已整組移除；
  // 兩套同時寫同一個容器只會互相覆蓋。本檔仍負責下方的 THE INDEX 註冊表。

  // short registry tokens for the index stack column
  const token = (s) => s.toLowerCase()
    .replace('google workspace api', 'workspace')
    .replace('serverless api', 'serverless')
    .replace('telegram mini app', 'tg-mini-app')
    .replace('realtime translation', 'rt-translate')
    .replace('6-locale i18n', 'i18n×6')
    .replace(/\s+—\s+|\s+/g, '-');

  function rowHTML(w, i) {
    const st = w.status === 'wip'
      ? `<span class="index-row__status" data-status="wip">${UI.statusWip}</span>`
      : `<span class="index-row__status" data-status="shipped">${UI.statusShipped}</span>`;
    return `
      <li class="index-row" data-work-index="${i}" tabindex="0" role="button"
          aria-label="${(UI.ctaLabel || 'Open {name}').replace('{name}', w.name)}" style="--d:${Math.min(i * 24, 360)}ms"
          data-haystack="${(w.name + ' ' + w.jp + ' ' + w.tag + ' ' + w.stack.join(' ')).toLowerCase()}">
        <span class="index-row__no">${String(i + 1).padStart(3, '0')}</span>
        <span class="index-row__name">${w.name}</span>
        <span class="index-row__jp jp-accent"${jaLang(w.jp)}>${w.jp}</span>
        <span class="index-row__cat">${w.tag}</span>
        ${st}
        <span class="index-row__stack">${w.stack.map(token).join(' · ')}</span>
      </li>`;
  }

  const grid = document.getElementById('work-grid');
  if (grid) {
    grid.innerHTML = `
      <div class="work__index" id="work-index">
        <div class="work__sub work__sub--index"><span class="work__sub-label">${UI.indexLabel}</span><span class="work__sub-n" id="index-count">${String(WORK.length).padStart(2, '0')} / ${String(WORK.length).padStart(2, '0')}</span></div>
        <label class="index__prompt">
          <span class="index__ps1">$ filter:</span>
          <input id="index-filter" type="text" autocomplete="off" spellcheck="false"
                 placeholder="${UI.filterPlaceholder}" aria-label="Filter products" />
          <span class="index__hint">${UI.filterHint}</span>
        </label>
        <div class="index__head" aria-hidden="true">
          ${(UI.indexHead || ['#','name','aka','category','status','stack']).map((h) => `<span>${h}</span>`).join('')}
        </div>
        <ol class="index__list" id="index-list">
          ${WORK.map((w, i) => rowHTML(w, i)).join('')}
        </ol>
        <p class="index__empty" id="index-empty" hidden>${UI.emptyText}</p>
      </div>
    `;
    const count = document.querySelector('.work .sec-head__count');
    if (count) count.textContent = String(WORK.length).padStart(2, '0') + (UI.productsSuffix || ' products');
  }

  // ---------- THE INDEX : type-to-filter (fuzzy subsequence) ----------
  const filterInput = document.getElementById('index-filter');
  if (filterInput) {
    const rows = Array.from(document.querySelectorAll('.index-row'));
    const counter = document.getElementById('index-count');
    const empty = document.getElementById('index-empty');
    const total = String(rows.length).padStart(2, '0');

    const fuzzy = (q, hay) => {
      let j = 0;
      for (const ch of hay) { if (ch === q[j]) j++; if (j === q.length) return true; }
      return false;
    };

    const apply = () => {
      const q = filterInput.value.trim().toLowerCase().replace(/\s+/g, ' ');
      let n = 0;
      for (const row of rows) {
        const hit = !q || fuzzy(q, row.dataset.haystack);
        row.hidden = !hit;
        if (hit) n++;
      }
      counter.textContent = String(n).padStart(2, '0') + ' / ' + total;
      counter.classList.toggle('is-filtered', !!q && n < rows.length);
      empty.hidden = n !== 0;
    };

    filterInput.addEventListener('input', apply);
    filterInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (filterInput.value) e.stopPropagation();
        filterInput.value = '';
        apply();
      }
    });
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
        <h3 class="method-step__name">${m.n}${m.jp ? ` <span class="method-step__jp jp-accent"${jaLang(m.jp)}>${m.jp}</span>` : ''}</h3>
        <p class="method-step__desc">${m.d}</p>
      </div>
    `).join('');
  }

  // ---------- Condensation reveals (scroll-driven; robust where IO is throttled) ----------
  const pending = new Set(
    document.querySelectorAll('.reveal, .reveal-child, .method-step, .sec-head, .work__index')
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

  // ---------- Compact nav (≤1080px) ----------
  /* site.css 在 max-width:1080px 把 .nav__links 整組 display:none，卻沒有任何替代 ——
     平板與全部手機上，四個區塊沒有任何跳轉方式，只能捲完五萬多像素。
     nav 的 markup 來自 design export（builder 的 DOM 輸入），不動它；
     這裡用 JS 生成按鈕與面板，連結直接複製自 .nav__links，所以三語自動跟著走。 */
  const navLinksEl = document.querySelector('.nav__links');
  const navRight = document.querySelector('.nav__right');
  if (nav && navLinksEl && navRight && links.length) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav__menu';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-controls', 'nav-panel');
    /* a11y (2026-09-04)：原本抄 nav landmark 的 aria-label="Primary"，無障礙樹裡變成
       navigation "Primary" + button "Primary" 同名，沒說出這顆按鈕做什麼。字串走 i18n。 */
    btn.setAttribute('aria-label', (UI && UI.menuLabel) || navLinksEl.getAttribute('aria-label') || 'Menu');
    btn.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span>';
    navRight.insertBefore(btn, navRight.firstChild);

    const panel = document.createElement('div');
    panel.className = 'nav__panel';
    panel.id = 'nav-panel';
    panel.hidden = true;
    links.forEach((a) => {
      const c = a.cloneNode(true);
      c.classList.remove('is-active');
      panel.appendChild(c);
    });
    nav.appendChild(panel);

    const setNavOpen = (open) => {
      nav.classList.toggle('is-menu-open', open);
      btn.setAttribute('aria-expanded', String(open));
      panel.hidden = !open;
    };
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      setNavOpen(!nav.classList.contains('is-menu-open'));
    });
    /* 點連結後要自己收起來 —— 同頁錨點不會觸發任何導航事件，不收就會蓋住捲到的區塊。 */
    panel.addEventListener('click', (e) => { if (e.target.closest('a')) setNavOpen(false); });
    document.addEventListener('click', (e) => { if (!nav.contains(e.target)) setNavOpen(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-menu-open')) { setNavOpen(false); btn.focus(); }
    });
    /* 捲動即關閉。nav 是 position:fixed，面板不自己收就會一路蓋在內容上
       ——「上面那四個一直住在上面，整個畫面都看不到」就是這個。
       用 scrollY 差值而不是任何捲動都關：點面板連結會觸發平滑捲動，
       那是使用者剛下的指令，不該被自己的關閉邏輯搶在前面誤判。 */
    let openedAt = 0;
    const closeOnScroll = () => {
      if (!nav.classList.contains('is-menu-open')) return;
      if (Math.abs(window.scrollY - openedAt) > 40) setNavOpen(false);
    };
    window.addEventListener('scroll', closeOnScroll, { passive: true });
    btn.addEventListener('click', () => { openedAt = window.scrollY; });

    /* 視窗放大回桌面寬度時，面板的 hidden 狀態要跟著重置，否則縮放過的頁面會留著 open class。 */
    const mq = window.matchMedia('(min-width: 861px)');
    const syncMq = () => { if (mq.matches) setNavOpen(false); };
    mq.addEventListener ? mq.addEventListener('change', syncMq) : mq.addListener(syncMq);
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
    /* a11y (2026-09-04)：.is-error 只是視覺；螢幕閱讀器要靠 aria-invalid 才知道哪一欄錯，
       aria-describedby 讓聚焦到欄位時朗讀 #f-note 的說明（WCAG 3.3.1）。 */
    form.querySelectorAll('[required]').forEach((input) => {
      input.setAttribute('aria-describedby', 'f-note');
      input.setAttribute('aria-invalid', 'false');
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      form.querySelectorAll('[required]').forEach((input) => {
        const field = input.closest('.field');
        const bad = !input.value.trim() ||
          (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value));
        field.classList.toggle('is-error', bad);
        input.setAttribute('aria-invalid', bad ? 'true' : 'false');
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
