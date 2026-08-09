/* ============================================================
   CREALIZE — WORK MODAL · "materialize on open"
   點 → 線 → 面 : dots scatter in, connect into lines, lines
   close into planes, then the content snaps sharp. ≤600ms.
   Same condensation language as the hero. Vanilla, 60fps,
   transform/opacity/canvas only.
   ============================================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const S = { motion: 1, accent: '#FF4F00' };
  window.addEventListener('crealize:tweaks', (e) => {
    const t = e.detail || {};
    if (typeof t.motion === 'number') S.motion = t.motion;
    if (t.accent) S.accent = t.accent;
  });

  const INK = '18,17,16';
  const ink = (a) => `rgba(${INK},${a})`;
  const accentA = (a) => {
    const h = S.accent.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.min(a, 1)})`;
  };

  // ---------- modal skeleton ----------
  const modal = document.createElement('div');
  modal.className = 'work-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="work-modal__backdrop" data-close></div>
    <div class="work-modal__card" role="dialog" aria-modal="true" aria-label="Project detail">
      <canvas class="work-modal__canvas" aria-hidden="true"></canvas>
      <div class="work-modal__content">
        <div class="work-modal__shot">
          <div class="work-card__ph"><b></b><span>product screenshot · drop here</span></div>
        </div>
        <div class="work-modal__body">
          <div class="work-modal__top">
            <span class="work-modal__idx"></span>
            <span class="work-modal__badge" hidden></span>
          </div>
          <h3 class="work-modal__name"></h3>
          <span class="work-modal__jp jp-accent"></span>
          <span class="work-modal__tag"></span>
          <p class="work-modal__line"></p>
          <p class="work-modal__prose"></p>
          <ul class="work-modal__stack"></ul>
          <span class="work-modal__ok"></span>
        </div>
        <button class="work-modal__close" type="button" aria-label="Close" data-close>
          <span>esc</span> ✕
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);

  const card = modal.querySelector('.work-modal__card');
  const canvas = modal.querySelector('.work-modal__canvas');
  const ctx = canvas.getContext('2d');
  const els = {
    ph: modal.querySelector('.work-card__ph b'),
    idx: modal.querySelector('.work-modal__idx'),
    badge: modal.querySelector('.work-modal__badge'),
    name: modal.querySelector('.work-modal__name'),
    jp: modal.querySelector('.work-modal__jp'),
    tag: modal.querySelector('.work-modal__tag'),
    line: modal.querySelector('.work-modal__line'),
    prose: modal.querySelector('.work-modal__prose'),
    stack: modal.querySelector('.work-modal__stack'),
    ok: modal.querySelector('.work-modal__ok'),
  };

  // ---------- geometry : wireframe regions of the layout ----------
  let CW = 0, CH = 0, DPR = 1;
  let DOTS = [], EDGES = [], PLANES = [];

  const rnd = (seed) => {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  function buildGeometry() {
    const r = card.getBoundingClientRect();
    CW = r.width; CH = r.height;
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CW * DPR; canvas.height = CH * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

    // wireframe regions = the REAL layout boxes the content will snap into
    const rel = (el) => {
      const b = el.getBoundingClientRect();
      return [b.left - r.left, b.top - r.top, b.width, b.height];
    };
    const regions = [
      { box: rel(modal.querySelector('.work-modal__shot')), alpha: 0.05, per: 4 },
      { box: rel(els.name), alpha: 0.10, per: 1 },
      { box: rel(els.line), alpha: 0.07, per: 1 },
      { box: rel(els.stack), alpha: 0.07, per: 1 },
    ].filter((g) => g.box[2] > 4 && g.box[3] > 2);

    DOTS = []; EDGES = []; PLANES = [];
    let id = 0;

    regions.forEach((g, ri) => {
      const [x, y, w, h] = g.box;
      const per = g.per;
      const nodes = [];
      for (let s = 0; s < 4; s++) {
        for (let k = 0; k < per; k++) {
          const f = k / per;
          let nx, ny;
          if (s === 0) { nx = x + w * f; ny = y; }
          else if (s === 1) { nx = x + w; ny = y + h * f; }
          else if (s === 2) { nx = x + w * (1 - f); ny = y + h; }
          else { nx = x; ny = y + h * (1 - f); }
          nodes.push([nx, ny]);
        }
      }
      const base = DOTS.length;
      nodes.forEach(([nx, ny]) => {
        const seed = ++id;
        DOTS.push({
          x: nx, y: ny,
          sa: rnd(seed * 1.7) * Math.PI * 2,
          sd: (90 + rnd(seed * 2.9) * 240) * S.motion,
          delay: rnd(seed * 4.1) * 0.16,
          accent: rnd(seed * 6.3) < 0.12,
        });
      });
      for (let i2 = 0; i2 < nodes.length; i2++) {
        EDGES.push({
          a: base + i2,
          b: base + ((i2 + 1) % nodes.length),
          delay: 0.05 + rnd((ri + 1) * (i2 + 7) * 3.3) * 0.16,
          accent: ri === 3 && i2 === 0,
        });
      }
      PLANES.push({ x, y, w, h, alpha: g.alpha, delay: ri * 0.03 });
    });

    // free chaos motes: scatter in, settle onto region edges, absorbed by the planes
    const anchorCount = DOTS.length;
    for (let i3 = 0; i3 < 26; i3++) {
      const seed = ++id;
      const host = DOTS[Math.floor(rnd(seed * 8.9) * anchorCount)];
      const tgt = DOTS[Math.floor(rnd(seed * 5.1) * anchorCount)];
      DOTS.push({
        x: host.x + (tgt.x - host.x) * rnd(seed * 3.7),
        y: host.y + (tgt.y - host.y) * rnd(seed * 2.3),
        sa: rnd(seed * 1.3) * Math.PI * 2,
        sd: (120 + rnd(seed * 7.7) * 300) * S.motion,
        delay: rnd(seed * 9.1) * 0.2,
        accent: rnd(seed * 4.7) < 0.1,
        mote: true,
      });
    }

    // one construction diagonal (blueprint feel)
    EDGES.push({ a: 0, b: Math.floor(anchorCount / 2), delay: 0.12, faint: true });
  }

  // ---------- timeline render (T : 0..1 over ~600ms) ----------
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const eo3 = (t) => 1 - Math.pow(1 - t, 3);
  const smooth = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };

  function renderT(T) {
    ctx.clearRect(0, 0, CW, CH);
    const fade = 1 - smooth(0.82, 1, T);
    if (fade <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = fade;

    // 點 — dots converge
    for (const d of DOTS) {
      const lp = eo3(clamp01((T - d.delay) / 0.3));
      if (lp <= 0) continue;
      const inv = 1 - lp;
      const x = d.x + Math.cos(d.sa) * d.sd * inv;
      const y = d.y + Math.sin(d.sa) * d.sd * 0.7 * inv;
      const moteFade = d.mote ? 1 - smooth(0.5, 0.72, T) : 1;
      if (moteFade <= 0.01) continue;
      ctx.beginPath();
      ctx.arc(x, y, 1.8 + inv * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = d.accent ? accentA((0.5 + 0.5 * lp) * moteFade) : ink((0.3 + 0.5 * lp) * moteFade);
      ctx.fill();
    }

    // 線 — edges draw between settled nodes
    for (const e of EDGES) {
      const lp = eo3(clamp01((T - 0.26 - e.delay) / 0.24));
      if (lp <= 0) continue;
      const A = DOTS[e.a], B = DOTS[e.b];
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(A.x + (B.x - A.x) * lp, A.y + (B.y - A.y) * lp);
      ctx.lineWidth = 1;
      ctx.strokeStyle = e.faint ? ink(0.10) : e.accent ? accentA(0.8) : ink(0.32);
      ctx.stroke();
    }

    // 面 — planes close
    for (const p of PLANES) {
      if (!p.alpha) continue;
      const lp = smooth(0.52 + p.delay, 0.78 + p.delay, T);
      if (lp <= 0) continue;
      ctx.fillStyle = ink(p.alpha * lp);
      ctx.fillRect(p.x, p.y, p.w, p.h);
    }
    ctx.restore();
  }

  // ---------- open / close ----------
  let raf = null, t0 = 0, lastFocus = null;

  function fill(w, i) {
    const shot = modal.querySelector('.work-modal__shot');
    if (w.img) {
      shot.innerHTML = `<img class="work-modal__img" src="${w.img}" alt="${w.alt || w.name}" decoding="async" style="object-position:${w.pos || 'top center'}" />`;
    } else {
      shot.innerHTML = `<div class="work-card__ph"><b>[ ${w.ph} ]</b><span>product screenshot · drop here</span></div>`;
    }
    els.idx.textContent = String(i + 1).padStart(2, '0') + ' / ' + String((window.CRZ_WORK || []).length).padStart(2, '0');
    els.badge.hidden = w.status !== 'wip';
    els.badge.textContent = (window.CRZ_I18N && window.CRZ_I18N.ui.wipBadge) || 'in development';
    els.name.textContent = w.name;
    els.jp.textContent = w.jp;
    els.tag.textContent = w.tag;
    els.line.innerHTML = w.line;
    /* 完整正文（work-v3.js 依當前語言送過來）。沒有它，modal 就只剩一句 registry line
       ——「點開比卡片上看到的還少」，等於這個 modal 沒有存在理由。 */
    const copy = (window.CRZ_WORK_COPY || [])[i];
    els.prose.innerHTML = (copy && copy.body) || '';
    els.prose.hidden = !(copy && copy.body);
    els.stack.innerHTML = w.stack.map((s) => `<li>${s}</li>`).join('');
    els.ok.textContent = '';
  }

  function play() {
    cancelAnimationFrame(raf);
    t0 = performance.now();
    const dur = 600;
    const tick = (now) => {
      const T = clamp01((now - t0) / dur);
      renderT(T);
      if (T >= 0.55) modal.classList.add('is-snapped');
      if (T >= 1) {
        els.ok.textContent = `[ok] materialized in 0.${String(Math.round(dur * 0.92)).padStart(3, '0')}s`;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    // safety: environments with throttled rAF still finish the reveal
    setTimeout(() => {
      if (!modal.classList.contains('is-snapped')) {
        renderT(1);
        modal.classList.add('is-snapped');
        els.ok.textContent = '[ok] materialized in 0.552s';
      }
    }, dur + 80);
  }

  function open(i) {
    const w = (window.CRZ_WORK || [])[i];
    if (!w) return;
    lastFocus = document.activeElement;
    fill(w, i);
    modal.hidden = false;
    modal.classList.remove('is-snapped');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => modal.classList.add('is-open'));
    // geometry needs layout
    setTimeout(() => {
      buildGeometry();
      if (prefersReduced) {
        modal.classList.add('is-snapped');
        els.ok.textContent = '[ok] materialized';
      } else {
        play();
      }
    }, 30);
    modal.querySelector('.work-modal__close').focus({ preventScroll: true });
  }

  function close() {
    cancelAnimationFrame(raf);
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => {
      modal.hidden = true;
      modal.classList.remove('is-snapped');
      ctx.clearRect(0, 0, CW, CH);
    }, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // delegation: cards are injected by site.js
  document.addEventListener('click', (e) => {
    const c = e.target.closest('.work-card[data-work-index], .index-row[data-work-index]');
    if (c) { open(Number(c.dataset.workIndex)); return; }
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) close();
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.matches?.('.work-card[data-work-index], .index-row[data-work-index]')) {
      e.preventDefault();
      open(Number(document.activeElement.dataset.workIndex));
    }
  });
  window.addEventListener('resize', () => { if (!modal.hidden) { buildGeometry(); renderT(1); } });

  // QA / verify hook: open card i and force timeline position t (0..1)
  window.__crzWorkForce = (i, t) => {
    if (modal.hidden) {
      const w = (window.CRZ_WORK || [])[i];
      if (!w) return;
      fill(w, i);
      modal.hidden = false;
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      buildGeometry();
    }
    cancelAnimationFrame(raf);
    renderT(t);
    modal.classList.toggle('is-snapped', t >= 0.55);
    if (t >= 1) els.ok.textContent = '[ok] materialized in 0.552s';
  };
  window.__crzWorkClose = close;
})();
