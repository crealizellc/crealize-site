/* ============================================================
   CREALIZE — HERO · "MATERIALIZE"
   Scroll-driven condensation: scattered ink fragments coalesce,
   deblur, and solidify into a product UI.
   Techniques: 'condense' (default) · 'particles' · 'slices'
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('hero-canvas');
  const section = document.getElementById('hero');
  if (!canvas || !section) return;
  const ctx = canvas.getContext('2d');
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- live settings ----
  const S = { mode: 'condense', motion: 1, accent: '#FF4F00' };
  window.addEventListener('crealize:tweaks', (e) => {
    const t = e.detail || {};
    if (t.heroMode) S.mode = t.heroMode;
    if (typeof t.motion === 'number') S.motion = t.motion;
    if (t.accent) { S.accent = t.accent; buildAssembled(); }
  });

  const INK = '18,17,16';
  const ink = (a) => `rgba(${INK},${a})`;
  const PAPER = '#FAFAF8';
  const LOGO = new Image();
  /* Reuse the locale-correct URL already emitted by build-site.mjs. A raw
     `assets/...` path resolves under /ja/assets and /zh/assets on localized
     pages, leaving the hero mark broken while the visible nav logo still works. */
  const navLogo = document.querySelector('.nav__logo');
  LOGO.src = navLogo ? navLogo.src : 'assets/crealize-mark.png';
  LOGO.onload = () => { buildAssembled(); render(performance.now()); };
  function accentA(a) {
    const h = S.accent.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.min(a, 1)})`;
  }

  // ---- deterministic pseudo-random ----
  function rnd(seed) {
    const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  // ============================================================
  // TARGET UI — fragments in a 720 × 620 design box
  // type: 'fill' | 'frame' | 'line' | 'dot' | 'pill' | 'pillframe'
  // ============================================================
  const D = { w: 720, h: 620 };
  const FRAGS = [];
  let fid = 0;
  function F(type, x, y, w, h, o) {
    o = o || {};
    const seed = ++fid;
    FRAGS.push({
      type, x, y, w, h,
      r: o.r || 0,
      color: o.color || null,        // null → ink
      alpha: o.alpha != null ? o.alpha : 1,
      accent: !!o.accent,
      lw: o.lw || 1.2,
      seed,
      delay: o.delay != null ? o.delay : rnd(seed * 3.7) * 0.5,
      sc: {                           // scatter
        ang: rnd(seed * 1.3) * Math.PI * 2,
        dist: 110 + rnd(seed * 2.1) * 290,
        rot: (rnd(seed * 4.9) - 0.5) * 1.4,
      },
    });
  }

  function defineUI() {
    FRAGS.length = 0; fid = 0;
    const X = 60, Y = 30, W = 600, H = 560;

    // window
    F('fill',  X, Y, W, H, { color: PAPER, alpha: 0.92, delay: 0.02, r: 10 });
    F('frame', X, Y, W, H, { alpha: 0.85, lw: 1.4, delay: 0.0, r: 10 });
    F('line',  X, Y + 44, W, 1, { alpha: 0.16, delay: 0.05 });

    // titlebar dots + address chip
    F('dot', 84, 52, 4.5, 0, { alpha: 0.8, delay: 0.1 });
    F('dot', 102, 52, 4.5, 0, { alpha: 0.45, delay: 0.13 });
    F('dot', 120, 52, 4.5, 0, { alpha: 0.25, delay: 0.16 });
    F('pillframe', 260, 41, 200, 22, { alpha: 0.3, delay: 0.2 });
    F('line', 296, 51, 128, 2.5, { alpha: 0.22, delay: 0.24 });

    // sidebar
    F('line', 208, Y + 44, 1, H - 44, { alpha: 0.16, delay: 0.07 });
    F('logo', 82, 91, 18, 14.4, { delay: 0.3 });
    F('line', 106, 94, 62, 7, { alpha: 0.75, delay: 0.32 });
    for (let i = 0; i < 5; i++) {
      F('dot', 88, 148 + i * 34, 2.6, 0, { alpha: i === 0 ? 0.85 : 0.3, accent: i === 0, delay: 0.34 + i * 0.025 });
      F('line', 100, 145 + i * 34, 58 + rnd(i * 9.1) * 26, 5.5, { alpha: i === 0 ? 0.62 : 0.28, delay: 0.35 + i * 0.025 });
    }

    // headline block
    F('line', 232, 104, 236, 13, { alpha: 0.88, delay: 0.12 });
    F('line', 232, 128, 168, 13, { alpha: 0.88, delay: 0.15 });
    F('line', 232, 158, 286, 5, { alpha: 0.26, delay: 0.18 });
    F('line', 232, 170, 222, 5, { alpha: 0.26, delay: 0.2 });

    // CTA — the orange moment
    F('pill', 520, 104, 124, 38, { accent: true, delay: 0.46 });
    F('line', 549, 121, 50, 4.5, { color: PAPER, alpha: 0.95, delay: 0.5 });
    F('dot', 614, 123, 2.6, 0, { color: PAPER, alpha: 0.95, delay: 0.5 });

    // chart card
    F('frame', 232, 196, 268, 198, { alpha: 0.3, r: 6, delay: 0.16 });
    F('line', 250, 216, 84, 6, { alpha: 0.5, delay: 0.2 });
    F('line', 250, 230, 52, 4, { alpha: 0.22, delay: 0.22 });
    const bh = [46, 72, 58, 96, 120, 84, 104];
    for (let i = 0; i < 7; i++) {
      F('bar', 252 + i * 33, 374 - bh[i], 20, bh[i], {
        alpha: i === 4 ? 1 : 0.16, accent: i === 4, delay: 0.26 + i * 0.03,
      });
    }

    // stat tiles
    for (let i = 0; i < 2; i++) {
      const ty = 196 + i * 104;
      F('frame', 516, ty, 128, 94, { alpha: 0.3, r: 6, delay: 0.22 + i * 0.05 });
      F('line', 532, ty + 20, 56, 11, { alpha: 0.8, delay: 0.26 + i * 0.05 });
      F('line', 532, ty + 44, 76, 4.5, { alpha: 0.24, delay: 0.28 + i * 0.05 });
      F('line', 532, ty + 64, 40, 4.5, { alpha: i === 0 ? 0.6 : 0.24, accent: i === 0, delay: 0.3 + i * 0.05 });
    }

    // list rows
    for (let i = 0; i < 3; i++) {
      const ry = 424 + i * 50;
      F('line', 232, ry + 40, 412, 1, { alpha: 0.12, delay: 0.3 + i * 0.04 });
      F('dot', 244, ry + 16, 9, 0, { alpha: 0.14, delay: 0.32 + i * 0.04 });
      F('line', 266, ry + 6, 96 + rnd(i * 7.7) * 50, 6, { alpha: 0.55, delay: 0.33 + i * 0.04 });
      F('line', 266, ry + 20, 66, 4.5, { alpha: 0.22, delay: 0.34 + i * 0.04 });
      F('pillframe', 588, ry + 8, 56, 16, { alpha: 0.3, accent: i === 1, delay: 0.36 + i * 0.04 });
    }
  }
  defineUI();

  // ============================================================
  // DRAWING PRIMITIVES (draw one fragment at origin-centered space)
  // mix: 0 = pure wireframe stroke, 1 = solid fill
  // ============================================================
  function rr(c, x, y, w, h, r) {
    const q = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + q, y);
    c.arcTo(x + w, y, x + w, y + h, q);
    c.arcTo(x + w, y + h, x, y + h, q);
    c.arcTo(x, y + h, x, y, q);
    c.arcTo(x, y, x + w, y, q);
    c.closePath();
  }

  function fragColor(f, a) {
    if (f.color === PAPER) return `rgba(250,250,248,${a})`;
    if (f.accent) return accentA(a);
    return ink(a);
  }

  function drawFrag(c, f, mix, alphaMul, k) {
    const a = f.alpha * alphaMul;
    if (a <= 0.004) return;
    const strokeA = a * (1 - mix) * 0.9;
    const fillA = a * mix;
    c.lineWidth = f.lw / k;

    switch (f.type) {
      case 'logo': {
        if (LOGO.complete && LOGO.naturalWidth) {
          c.save();
          c.globalAlpha = Math.min(1, a * (0.35 + 0.65 * mix + 0.35));
          c.drawImage(LOGO, f.x, f.y, f.w, f.h);
          c.restore();
        } else {
          c.beginPath(); c.arc(f.x + f.w / 2, f.y + f.h / 2, f.w / 2, 0, Math.PI * 2);
          c.strokeStyle = fragColor(f, a * 0.7); c.stroke();
        }
        break;
      }
      case 'dot': {
        c.beginPath(); c.arc(f.x, f.y, f.w, 0, Math.PI * 2);
        if (strokeA > 0.004) { c.strokeStyle = fragColor(f, strokeA); c.stroke(); }
        if (fillA > 0.004) { c.fillStyle = fragColor(f, fillA); c.fill(); }
        break;
      }
      case 'rect45': {
        c.save();
        c.translate(f.x + f.w / 2, f.y + f.h / 2);
        c.rotate(Math.PI / 4);
        if (strokeA > 0.004) { c.strokeStyle = fragColor(f, strokeA); c.strokeRect(-f.w / 2, -f.h / 2, f.w, f.h); }
        if (fillA > 0.004) { c.fillStyle = fragColor(f, fillA); c.fillRect(-f.w / 2, -f.h / 2, f.w, f.h); }
        c.restore();
        break;
      }
      case 'frame': {
        rr(c, f.x, f.y, f.w, f.h, f.r);
        c.strokeStyle = fragColor(f, a * Math.max(0.35, 1 - mix * 0.2));
        c.stroke();
        break;
      }
      case 'pillframe': {
        rr(c, f.x, f.y, f.w, f.h, f.h / 2);
        c.strokeStyle = fragColor(f, a);
        c.stroke();
        break;
      }
      case 'pill': {
        rr(c, f.x, f.y, f.w, f.h, f.h / 2);
        if (strokeA > 0.004) { c.strokeStyle = fragColor(f, strokeA); c.stroke(); }
        if (fillA > 0.004) { c.fillStyle = fragColor(f, fillA); c.fill(); }
        break;
      }
      case 'fill': {
        rr(c, f.x, f.y, f.w, f.h, f.r);
        if (fillA > 0.004) { c.fillStyle = fragColor(f, fillA); c.fill(); }
        break;
      }
      case 'bar':
      case 'line':
      default: {
        rr(c, f.x, f.y, f.w, f.h, Math.min(2, f.h / 2, f.w / 2));
        if (strokeA > 0.004) { c.strokeStyle = fragColor(f, strokeA); c.stroke(); }
        if (fillA > 0.004) { c.fillStyle = fragColor(f, fillA); c.fill(); }
        break;
      }
    }
  }

  // ---- assembled UI snapshot (for 'slices' + particle crossfade) ----
  const off = document.createElement('canvas');
  const offCtx = off.getContext('2d');
  function buildAssembled() {
    if (!CW || !CH) return;
    off.width = CW * DPR; off.height = CH * DPR;
    offCtx.setTransform(DPR * K, 0, 0, DPR * K, DPR * OX, DPR * OY);
    offCtx.clearRect(-OX / K, -OY / K, CW / K, CH / K);
    for (const f of FRAGS) drawFrag(offCtx, f, 1, 1, K);
  }

  // ---- particle decomposition (for 'particles' mode) ----
  let POINTS = [];
  function buildPoints() {
    POINTS = [];
    let pid = 0;
    const push = (x, y, f) => {
      const seed = ++pid;
      POINTS.push({
        x, y,
        accent: f.accent,
        a: Math.min(0.85, f.alpha + 0.18),
        r: 0.9 + rnd(seed * 1.7) * 1.1,
        delay: rnd(seed * 2.3) * 0.55,
        sc: {
          ang: rnd(seed * 3.1) * Math.PI * 2,
          dist: 90 + rnd(seed * 4.3) * 300,
        },
        ph: rnd(seed * 5.7) * Math.PI * 2,
      });
    };
    for (const f of FRAGS) {
      if (f.type === 'dot') { push(f.x, f.y, f); continue; }
      const per = 2 * (f.w + f.h);
      const n = Math.max(4, Math.min(46, Math.round(per / 26)));
      for (let i = 0; i < n; i++) {
        // walk the perimeter
        let d = (i / n) * per;
        let x, y;
        if (d < f.w) { x = f.x + d; y = f.y; }
        else if (d < f.w + f.h) { x = f.x + f.w; y = f.y + (d - f.w); }
        else if (d < f.w * 2 + f.h) { x = f.x + f.w - (d - f.w - f.h); y = f.y + f.h; }
        else { x = f.x; y = f.y + f.h - (d - f.w * 2 - f.h); }
        push(x, y, f);
      }
    }
  }
  buildPoints();

  // ============================================================
  // CANVAS SIZING — fit design box, letterboxed
  // ============================================================
  let CW = 0, CH = 0, DPR = 1, K = 1, OX = 0, OY = 0;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    const b = canvas.getBoundingClientRect();
    CW = b.width; CH = b.height;
    canvas.width = CW * DPR; canvas.height = CH * DPR;
    K = Math.min(CW / D.w, CH / D.h);
    OX = (CW - D.w * K) / 2;
    OY = (CH - D.h * K) / 2;
    buildAssembled();
  }
  window.addEventListener('resize', resize);

  // ============================================================
  // EASING
  // ============================================================
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
  const smooth = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };

  function localP(p, delay, dur) {
    return easeOutQuint(clamp01((p - delay * 0.92) / dur));
  }

  // ============================================================
  // RENDER MODES
  // ============================================================
  function renderCondense(p, t) {
    const wob = (1 - smooth(0, 0.85, p)) * S.motion;
    for (const f of FRAGS) {
      const lp = localP(p, f.delay, 0.5);
      const inv = 1 - lp;
      // scatter position + ink-in-water wobble
      const wx = Math.sin(t * 0.7 + f.seed * 2.3) * 14 * wob * inv;
      const wy = Math.cos(t * 0.55 + f.seed * 1.7) * 11 * wob * inv;
      const sx = Math.cos(f.sc.ang) * f.sc.dist * S.motion * inv + wx;
      const sy = Math.sin(f.sc.ang) * f.sc.dist * 0.72 * S.motion * inv + wy;
      const rot = f.sc.rot * inv * S.motion;
      const cx = f.x + f.w / 2, cy = f.y + (f.h || 0) / 2;
      ctx.save();
      ctx.translate(cx + sx, cy + sy);
      ctx.rotate(rot);
      ctx.translate(-cx, -cy);
      const mix = smooth(0.45, 0.95, lp);
      const alphaMul = 0.4 + 0.6 * easeOutCubic(lp);
      drawFrag(ctx, f, mix, alphaMul, K);
      ctx.restore();
    }
  }

  function renderParticles(p, t) {
    const uiA = smooth(0.74, 0.96, p);
    // assembled UI fades in beneath the converging motes
    if (uiA > 0.004) {
      ctx.save();
      ctx.globalAlpha = uiA;
      for (const f of FRAGS) drawFrag(ctx, f, 1, 1, K);
      ctx.restore();
    }
    const moteA = 1 - smooth(0.8, 0.97, p);
    if (moteA <= 0.004) return;
    const wob = (1 - smooth(0, 0.9, p)) * S.motion;
    for (const pt of POINTS) {
      const lp = localP(p, pt.delay, 0.52);
      const inv = 1 - lp;
      const wx = Math.sin(t * 0.8 + pt.ph * 3) * 10 * wob * inv;
      const wy = Math.cos(t * 0.6 + pt.ph * 2) * 8 * wob * inv;
      const x = pt.x + Math.cos(pt.sc.ang) * pt.sc.dist * S.motion * inv + wx;
      const y = pt.y + Math.sin(pt.sc.ang) * pt.sc.dist * 0.72 * S.motion * inv + wy;
      const a = pt.a * (0.3 + 0.7 * lp) * moteA;
      ctx.beginPath();
      ctx.arc(x, y, pt.r * (1.4 - lp * 0.5) / Math.sqrt(K), 0, Math.PI * 2);
      ctx.fillStyle = pt.accent ? accentA(a) : ink(a);
      ctx.fill();
    }
  }

  const SLICES = 22;
  function renderSlices(p) {
    if (!off.width) return;
    const sw = off.width / SLICES;
    const dw = CW / SLICES;
    for (let i = 0; i < SLICES; i++) {
      const center = Math.abs(i - (SLICES - 1) / 2) / ((SLICES - 1) / 2); // 0 center → 1 edge
      const delay = center * 0.34 + rnd(i * 6.1) * 0.12;
      const lp = localP(p, delay, 0.55);
      const inv = 1 - lp;
      const dir = i % 2 === 0 ? 1 : -1;
      const oy = dir * inv * 150 * S.motion * (0.4 + center);
      const a = 0.08 + 0.92 * lp;
      ctx.save();
      ctx.globalAlpha = a;
      const bl = inv * 6 * S.motion;
      if (bl > 0.3) ctx.filter = `blur(${bl.toFixed(1)}px)`;
      ctx.drawImage(off, i * sw, 0, sw, off.height, i * dw, oy, dw, CH);
      ctx.restore();
    }
  }

  // ============================================================
  // SCROLL + TYPE CHOREOGRAPHY
  // ============================================================
  const wordA = document.querySelector('.hero__word--a');
  const wordB = document.querySelector('.hero__word--b');
  const phaseEl = document.getElementById('hero-phase');
  const barEl = document.getElementById('hero-progress-bar');
  const pEl = document.getElementById('hero-p');
  const scrollLabel = document.querySelector('.hero__scroll-label');

  let progress = 0;        // raw 0..1
  let forceP = null;       // debug/verify hook
  function readScroll() {
    if (forceP != null) { progress = forceP; return; }
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height - vh;
    progress = total > 0 ? clamp01(-rect.top / total) : 1;
  }

  const PHASES = [
    [0.0, ((window.CRZ_I18N || {}).ui || {}).phases ? window.CRZ_I18N.ui.phases[0] : 'imagination · 想像'],
    [0.33, ((window.CRZ_I18N || {}).ui || {}).phases ? window.CRZ_I18N.ui.phases[1] : 'condensing · 凝縮'],
    [0.72, ((window.CRZ_I18N || {}).ui || {}).phases ? window.CRZ_I18N.ui.phases[2] : 'reality · 実現'],
  ];
  let lastPhase = '';

  function choreographType(p) {
    // word A: imagination — dissolves away
    const aOut = smooth(0.25, 0.55, p);
    const bIn = smooth(0.42, 0.72, p);
    if (wordA) {
      wordA.style.opacity = (1 - aOut).toFixed(3);
      wordA.style.filter = `blur(${(aOut * 14 * S.motion).toFixed(1)}px)`;
      wordA.style.transform = `translateY(${(-aOut * 16 * S.motion).toFixed(1)}px)`;
    }
    if (wordB) {
      wordB.style.opacity = bIn.toFixed(3);
      wordB.style.filter = `blur(${((1 - bIn) * 14 * S.motion).toFixed(1)}px)`;
      wordB.style.transform = `translateY(${((1 - bIn) * 18 * S.motion).toFixed(1)}px)`;
    }
    if (barEl) barEl.style.width = (p * 100).toFixed(1) + '%';
    if (pEl) pEl.textContent = 'p=' + p.toFixed(2);
    /* 減少動態時 p 恆為 1（上方），「Scroll to materialize」對這群使用者永久為假 —— 直接不顯示。
       右側的 p= 讀數與 phase 標籤仍在（它們反映的是真實狀態）。 */
    if (scrollLabel) {
      if (prefersReduced) scrollLabel.hidden = true;
      else scrollLabel.style.opacity = p > 0.92 ? 0.25 : 1;
    }
    let ph = PHASES[0][1];
    for (const [th, label] of PHASES) if (p >= th) ph = label;
    if (ph !== lastPhase && phaseEl) { phaseEl.textContent = ph; lastPhase = ph; }
  }

  // ============================================================
  // MAIN LOOP — only while hero is near viewport
  // ============================================================
  let running = false, rafId = null, t0 = performance.now();

  function render(now) {
    const t = (now - t0) / 1000;
    readScroll();
    const sm = progress * progress * (3 - 2 * progress); // smoothstep master ease
    const p = prefersReduced ? 1 : sm * 0.85 + progress * 0.15;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, CW, CH);

    // global condensation blur on the canvas element itself
    const gBlur = prefersReduced ? 0 : (1 - smooth(0, 0.62, p)) * 7 * S.motion;
    canvas.style.filter = gBlur > 0.25 ? `blur(${gBlur.toFixed(1)}px)` : 'none';

    ctx.setTransform(DPR * K, 0, 0, DPR * K, DPR * OX, DPR * OY);
    if (S.mode === 'slices') {
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      renderSlices(p);
    } else if (S.mode === 'particles') {
      renderParticles(p, t);
    } else {
      renderCondense(p, t);
    }

    choreographType(prefersReduced ? 1 : progress);
  }

  function frame(now) {
    render(now);
    if (running) rafId = requestAnimationFrame(frame);
  }

  const io = new IntersectionObserver((entries) => {
    const vis = entries[0].isIntersecting;
    if (vis && !running) { running = true; rafId = requestAnimationFrame(frame); }
    else if (!vis && running) { running = false; cancelAnimationFrame(rafId); }
  }, { rootMargin: '120px' });
  io.observe(section);

  resize();
  buildAssembled();
  // render synchronously with scroll (also covers environments where rAF is throttled)
  window.addEventListener('scroll', () => render(performance.now()), { passive: true });
  window.__crzHeroForce = (p) => { forceP = p; render(performance.now()); };
  window.__crzHeroRelease = () => { forceP = null; render(performance.now()); };
  render(performance.now());
  if (prefersReduced) { render(performance.now()); }
})();
