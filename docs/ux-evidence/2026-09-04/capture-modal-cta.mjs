// 一次性：沿用 scripts/shoot-site.mjs 的路徑（同一個 Chrome、同一個 scripts/lib/cdp.mjs、同一個 Page.captureScreenshot）
// 只多做一件事：點開第一張卡片、等 modal 動畫落定、先驗 visibilityState 與 CTA opacity 再拍。
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { attach, listPages } from '/Users/crealize-00/Projects/crealize-site/scripts/lib/cdp.mjs';
const ROOT = '/Users/crealize-00/Projects/crealize-site';
const OUT = `${ROOT}/docs/ux-evidence/2026-09-04`;
const PORT = 9334;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--force-device-scale-factor=1', '--window-size=1280,800',
  '--user-data-dir=' + process.env.SP + '/shoot/profile', 'about:blank',
], { stdio: 'ignore' });
const report = [];
try {
  let ok = false;
  for (let i = 0; i < 60; i++) { try { await listPages(PORT); ok = true; break; } catch { await sleep(250); } }
  if (!ok) throw new Error('no CDP');
  const SHOTS = [
    { name: 'modal-cta-desktop-en', page: 'site/index.html', w: 1280, h: 800, mobile: false, idx: 0 },
    { name: 'modal-cta-desktop-zh', page: 'site/zh/index.html', w: 1280, h: 800, mobile: false, idx: 0 },
    { name: 'modal-cta-mobile-ja',  page: 'site/ja/index.html', w: 390, h: 844, mobile: true, idx: 9 },
  ];
  for (const sh of SHOTS) {
    const target = (await listPages(PORT)).find((p) => p.type === 'page');
    const s = await attach(target);
    await s.send('Emulation.setDeviceMetricsOverride', { width: sh.w, height: sh.h, deviceScaleFactor: 2, mobile: sh.mobile });
    await s.navigate(`file://${ROOT}/${sh.page}`);
    await sleep(1800);
    await s.evaluate(() => { document.querySelector('#work').scrollIntoView({ block: 'start' }); });
    await sleep(1200);
    await s.evaluate((i) => { document.querySelector(`.work-card[data-work-index="${i}"]`).click(); }, sh.idx);
    await sleep(2200); // modal 開啟動畫落定
    const probe = await s.evaluate(() => {
      const c = document.querySelector('.work-modal__cta'); const r = c.getBoundingClientRect();
      return { visibility: document.visibilityState, hidden: document.hidden, modalHidden: document.querySelector('.work-modal').hidden,
        ctaText: c.textContent, ctaOpacity: getComputedStyle(c).opacity, ctaVisible: r.width > 0 && r.top >= 0 && r.top < innerHeight,
        ctaRect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join(','),
        anim: document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('.work-modal') && !a.effect.target.closest('.stage')).length };
    });
    const shot = await s.send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`${OUT}/${sh.name}.png`, Buffer.from(shot.data, 'base64'));
    report.push({ shot: sh.name, ...probe });
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close();
  }
  // KV 提案用：各視口的 .stage 渲染寬度
  const target = (await listPages(PORT)).find((p) => p.type === 'page');
  const s = await attach(target);
  const widths = {};
  for (const w of [390, 768, 1080, 1280, 1440]) {
    await s.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
    await s.navigate(`file://${ROOT}/site/index.html`); await sleep(1500);
    widths[w] = await s.evaluate(() => Math.round(document.querySelector('.stage').getBoundingClientRect().width));
  }
  s.close();
  console.log(JSON.stringify({ report, stageWidths: widths }, null, 1));
} finally { chrome.kill(); }
