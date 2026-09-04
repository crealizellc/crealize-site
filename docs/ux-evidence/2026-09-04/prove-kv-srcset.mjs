// KV srcset 證明：沿用 scripts/lib/cdp.mjs（同 shoot-site / capture-modal-cta 路徑）。
// 量：各視口×DPR 的 currentSrc / naturalWidth / 是否解碼完成 / 真實網路 encodedDataLength；
//     modal clone 的 currentSrc 與槽寬；390@2x 的 800 vs 1600 並排裁圖。
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { attach, listPages } from '/Users/crealize-00/Projects/crealize-site/scripts/lib/cdp.mjs';
const BASE = process.env.BASE || 'http://127.0.0.1:8814';
const OUT = process.env.OUT || '/Users/crealize-00/Projects/crealize-site/docs/ux-evidence/2026-09-04';
const PORT = 9335; const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--window-size=1280,900', '--user-data-dir=' + process.env.SP + '/kvproof/profile', 'about:blank'], { stdio: 'ignore' });
const CASES = [
  { w: 390, dpr: 2, mobile: true }, { w: 390, dpr: 3, mobile: true }, { w: 768, dpr: 2, mobile: false },
  { w: 1080, dpr: 2, mobile: false }, { w: 1280, dpr: 1, mobile: false }, { w: 1280, dpr: 2, mobile: false }, { w: 1440, dpr: 2, mobile: false },
];
const rows = [], modal = [], visual = {};
try {
  let ok = false; for (let i = 0; i < 60; i++) { try { await listPages(PORT); ok = true; break; } catch { await sleep(250); } }
  if (!ok) throw new Error('no CDP');
  for (const c of CASES) {
    const target = (await listPages(PORT)).find((p) => p.type === 'page'); const s = await attach(target);
    const bytes = new Map(), urls = new Map();
    await s.send('Network.enable'); await s.send('Network.setCacheDisabled', { cacheDisabled: true });
    s.on('Network.responseReceived', (p) => { if (/\/assets\/kv/.test(p.response.url)) urls.set(p.requestId, p.response.url); });
    s.on('Network.loadingFinished', (p) => { if (urls.has(p.requestId)) bytes.set(urls.get(p.requestId), p.encodedDataLength); });
    await s.send('Emulation.setDeviceMetricsOverride', { width: c.w, height: 900, deviceScaleFactor: c.dpr, mobile: c.mobile });
    await s.navigate(`${BASE}/index.html?c=${c.w}x${c.dpr}`); await sleep(1500);
    await s.evaluate(() => document.querySelector('.work-card[data-work-index="0"]').scrollIntoView({ block: 'center' }));
    await s.waitFor(() => { const c = document.querySelector('.work-card[data-work-index="0"]'); const i = c && c.querySelector('.stage__bg'); return c && c.classList.contains('is-in') && i && i.complete && i.naturalWidth > 0; }, { timeout: 20000, label: 'first card revealed + kv loaded' });
    await sleep(1400); // reveal transition 落定
    await s.evaluate(() => { window.__dim = null; const i = document.querySelector('.work-card[data-work-index="0"] .stage__bg'); fetch(i.currentSrc).then((r) => r.blob()).then(createImageBitmap).then((b) => { window.__dim = [b.width, b.height]; }).catch((e) => { window.__dim = ['err', String(e)]; }); });
    const dim = await s.waitFor(() => window.__dim, { timeout: 15000, label: 'decode currentSrc' });
    const r = await s.evaluate(() => { const i = document.querySelector('.work-card[data-work-index="0"] .stage__bg'); const st = i.closest('.stage').getBoundingClientRect();
      return { currentSrc: i.currentSrc.replace(/.*\/assets\//, 'assets/'), naturalWidth: i.naturalWidth, naturalHeight: i.naturalHeight, complete: i.complete, stageCss: Math.round(st.width), sizesAttr: i.sizes }; });
    r.filePx = dim;
    const needed = r.stageCss * c.dpr; const expected = needed <= 800 ? 'kv-800' : 'kv';
    const b = [...bytes.entries()].find(([u]) => u.endsWith(r.currentSrc.replace('assets/', '')) || u.includes(r.currentSrc.split('/').slice(-2).join('/')));
    rows.push({ viewport: c.w, dpr: c.dpr, stageCss: r.stageCss, neededPx: needed, expected, picked: r.currentSrc.includes('kv-800') ? 'kv-800' : 'kv', match: expected === (r.currentSrc.includes('kv-800') ? 'kv-800' : 'kv'), naturalCssCorrected: `${r.naturalWidth}x${r.naturalHeight}`, decodedFilePx: `${r.filePx[0]}x${r.filePx[1]}`, decodeOk: r.filePx[0] !== 'err' && r.filePx[0] >= needed, networkBytes: b ? b[1] : null, sizes: r.sizesAttr });
    if ((c.w === 1280 && c.dpr === 2) || (c.w === 390 && c.dpr === 2) || (c.w === 1440 && c.dpr === 2)) {
      await s.evaluate(() => document.querySelector('.work-card[data-work-index="0"]').click()); await sleep(1500);
      await s.waitFor(() => { const i = document.querySelector('.work-modal__shot .stage__bg'); return i && i.complete && i.naturalWidth > 0; }, { timeout: 20000, label: 'modal kv' });
      await s.evaluate(() => { window.__mdim = null; const i = document.querySelector('.work-modal__shot .stage__bg'); fetch(i.currentSrc).then((r) => r.blob()).then(createImageBitmap).then((b) => { window.__mdim = [b.width, b.height]; }).catch((e) => { window.__mdim = ['err', String(e)]; }); });
      const mdim = await s.waitFor(() => window.__mdim, { timeout: 15000, label: 'decode modal src' });
      const m = await s.evaluate(() => { const i = document.querySelector('.work-modal__shot .stage__bg'); const shot = document.querySelector('.work-modal__shot').getBoundingClientRect();
        return { currentSrc: i.currentSrc.replace(/.*\/assets\//, 'assets/'), shotCss: Math.round(shot.width), sizes: i.sizes }; });
      modal.push({ viewport: c.w, dpr: c.dpr, shotCss: m.shotCss, neededPx: m.shotCss * c.dpr, picked: m.currentSrc.includes('kv-800') ? 'kv-800' : 'kv', filePx: mdim[0], adequate: mdim[0] >= m.shotCss * c.dpr, sizes: m.sizes });
      await s.evaluate(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))); await sleep(400);
    }
    if (c.w === 390 && c.dpr === 2) try {
      const clip = await s.evaluate(() => { const r = document.querySelector('.work-card[data-work-index="0"] .stage').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; });
      visual.cardOpacityBeforeCrop = await s.evaluate(() => getComputedStyle(document.querySelector('.work-card[data-work-index="0"]')).opacity);
      let shot = await s.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
      writeFileSync(`${OUT}/kv-390x2-srcset-800.png`, Buffer.from(shot.data, 'base64'));
      await s.evaluate(() => { const i = document.querySelector('.work-card[data-work-index="0"] .stage__bg'); i.srcset = i.getAttribute('src') + ' 1600w'; });
      await s.waitFor(() => { const i = document.querySelector('.work-card[data-work-index="0"] .stage__bg'); return i.complete && /\/kv\//.test(i.currentSrc); }, { timeout: 20000, label: 'master' }); await sleep(800);
      visual.masterAfterSwap = await s.evaluate(() => { const i = document.querySelector('.work-card[data-work-index="0"] .stage__bg'); return { currentSrc: i.currentSrc.replace(/.*\/assets\//, 'assets/'), naturalWidth: i.naturalWidth, cardOpacity: getComputedStyle(i.closest('.card')).opacity }; });
      shot = await s.send('Page.captureScreenshot', { format: 'png', clip: { ...clip, scale: 1 } });
      writeFileSync(`${OUT}/kv-390x2-master-1600.png`, Buffer.from(shot.data, 'base64'));
      visual.clip = clip;
    } catch (e) { visual.error = String(e.message || e); }
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close();
  }
} catch (e) { visual.error = String(e.message || e); }
finally { chrome.kill(); console.log(JSON.stringify({ rows, modal, visual }, null, 1)); }
