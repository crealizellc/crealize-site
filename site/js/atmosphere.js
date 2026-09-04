/* ============================================================
   CREALIZE — ATMOSPHERE
   Site-wide sumi-e layer: slow ink-flow ribbons drifting like
   water currents + fine floating motes. Quiet, low-contrast.
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('atmosphere');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- live settings (Tweaks can override via event) ----
  const S = {
    motion: 1,            // 0..1 global motion intensity
    accent: '#FF4F00',
    ink: '18,17,16',
  };
  window.addEventListener('crealize:tweaks', (e) => {
    const t = e.detail || {};
    if (typeof t.motion === 'number') S.motion = t.motion;
    if (t.accent) S.accent = t.accent;
  });

  let W = 0, H = 0, DPR = 1;
  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * DPR; canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  /* resize 只重設尺寸；重播種與重繪合併在下面 L179 的單一監聽 —— 原本兩個監聽依註冊順序
     先 render(0)（舊種子）再 seed（新種子不重繪），新種子要等下一次 resize 才出現。 */
  window.addEventListener('resize', resize);

  // ---- pseudo-noise flow field (layered sines — smooth, cheap) ----
  function flow(x, y, t) {
    const nx = x * 0.0016, ny = y * 0.0019;
    return (
      Math.sin(nx * 2.1 + t * 0.21 + Math.cos(ny * 1.7 + t * 0.13) * 1.4) * 0.9 +
      Math.cos(ny * 2.6 - t * 0.17 + Math.sin(nx * 1.3 - t * 0.11) * 1.2) * 0.7 +
      Math.sin((nx + ny) * 1.2 + t * 0.07) * 0.5
    ); // angle-ish scalar
  }

  // ---- ink ribbons (calligraphic streamlines) ----
  const RIBBONS = [];
  function seedRibbons() {
    RIBBONS.length = 0;
    const count = W < 720 ? 6 : 10;
    for (let i = 0; i < count; i++) {
      RIBBONS.push({
        // seeds distributed across the viewport, biased to margins
        sx: Math.random() * W,
        sy: (i / count) * H + (Math.random() - 0.5) * H * 0.18,
        len: 90 + Math.random() * 80,           // steps
        step: 7 + Math.random() * 5,            // px per step
        w: 0.7 + Math.random() * 1.7,           // max half-width
        alpha: 0.028 + Math.random() * 0.030,
        phase: Math.random() * Math.PI * 2,
        drift: 0.12 + Math.random() * 0.25,     // individual time scale
      });
    }
  }

  function traceRibbon(r, t) {
    // trace centerline through flow field
    const pts = [];
    let x = r.sx + Math.sin(t * 0.06 * r.drift + r.phase) * 60;
    let y = r.sy + Math.cos(t * 0.045 * r.drift + r.phase) * 40;
    for (let i = 0; i < r.len; i++) {
      const a = flow(x, y, t * r.drift + r.phase) * 1.15;
      x += Math.cos(a) * r.step;
      y += Math.sin(a) * r.step * 0.7; // flatten — horizontal currents
      pts.push([x, y]);
    }
    return pts;
  }

  function drawRibbon(r, t) {
    const pts = traceRibbon(r, t);
    if (pts.length < 4) return;
    // filled ribbon with calligraphic taper
    const left = [], right = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const q = pts[Math.min(i + 1, pts.length - 1)];
      let dx = q[0] - p[0], dy = q[1] - p[1];
      const d = Math.hypot(dx, dy) || 1;
      dx /= d; dy /= d;
      const s = i / (pts.length - 1);
      // taper: thin → thick → thin, with a slow breathing modulation
      const wmod = Math.pow(Math.sin(Math.PI * s), 0.8) *
                   (0.66 + 0.34 * Math.sin(s * 9 + t * 0.4 + r.phase));
      const w = r.w * wmod + 0.18;
      left.push([p[0] - dy * w, p[1] + dx * w]);
      right.push([p[0] + dy * w, p[1] - dx * w]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    ctx.fillStyle = `rgba(${S.ink},${r.alpha})`;
    ctx.fill();
  }

  // ---- floating motes ----
  const MOTES = [];
  function seedMotes() {
    MOTES.length = 0;
    const count = W < 720 ? 42 : 84;
    for (let i = 0; i < count; i++) {
      MOTES.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.3,
        v: 0.12 + Math.random() * 0.3,
        a: 0.07 + Math.random() * 0.10,
        accent: Math.random() < 0.04,   // rare orange mote
        ph: Math.random() * Math.PI * 2,
      });
    }
  }

  function drawMotes(t) {
    for (const m of MOTES) {
      const a = flow(m.x, m.y, t * 0.6 + m.ph);
      m.x += Math.cos(a) * m.v * S.motion;
      m.y += (Math.sin(a) * 0.5 - 0.06) * m.v * S.motion; // gentle upward bias
      // wrap
      if (m.x < -8) m.x = W + 8; else if (m.x > W + 8) m.x = -8;
      if (m.y < -8) m.y = H + 8; else if (m.y > H + 8) m.y = -8;
      const tw = 0.75 + 0.25 * Math.sin(t * 0.8 + m.ph * 3); // twinkle
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fillStyle = m.accent
        ? hexA(S.accent, m.a * 2.4 * tw)
        : `rgba(${S.ink},${m.a * tw})`;
      ctx.fill();
    }
  }

  function hexA(hex, a) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.replace(/./g, c => c + c) : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.min(a, 1)})`;
  }

  // ---- render loop ----
  let last = 0;
  let timeAcc = 0;
  function render(now) {
    const dt = Math.min((now - last) / 1000, 0.05) || 0;
    last = now;
    timeAcc += dt * (0.35 + 0.65 * S.motion); // motion intensity slows time itself
    const t = timeAcc;

    ctx.clearRect(0, 0, W, H);
    for (const r of RIBBONS) drawRibbon(r, t);
    if (!prefersReduced) drawMotes(t);
  }

  let rafId = null;
  function loop(now) {
    render(now);
    rafId = requestAnimationFrame(loop);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(rafId); rafId = null; }
    else if (!rafId && !prefersReduced) rafId = requestAnimationFrame(loop);
  });

  resize();
  seedRibbons();
  seedMotes();
  window.addEventListener('resize', () => {
    seedRibbons(); seedMotes();
    if (prefersReduced) render(0); // 減少動態：重播種後立刻畫出這一幀，不留到下一次 resize
  });

  render(16); // initial frame even where rAF is throttled
  if (!prefersReduced) {
    rafId = requestAnimationFrame(loop);
  }
})();
