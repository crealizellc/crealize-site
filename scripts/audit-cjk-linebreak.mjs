#!/usr/bin/env node
/* ============================================================
   audit-cjk-linebreak.mjs — 日文文節不得被拆行（窄視口）+ 不得因此溢出

   2026-09-04 視覺確認抓到：ja 頁 390px 的 Join 標題斷成「つくっ／た」、Method 開場句
   斷成「リリ／ース」。修法是把文節包成 <span class="jw"> inline-block（site.css）。
   這支用既有的 CDP 路徑（scripts/lib/cdp.mjs）在 320 / 375 / 390 三個窄視口與 1280 桌機
   實際排版，量兩件事：
     1. 每個 .jw 的 getClientRects().length === 1 —— 文節沒被拆到兩行
     2. document.documentElement.scrollWidth === innerWidth —— inline-block 沒有把版面撐出去
   只在 ja 頁量（.jw 只出現在 ja 覆寫）；en / zh 頁確認沒有 .jw 殘留即可。
   反向測試：把 site.css 的 .jw 規則拿掉 → 390px 的「つくった」等文節重新被拆 → exit 2。
   ============================================================ */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attach, listPages } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) { console.error('❌ 找不到 Chrome —— 環境問題，不是內容問題'); process.exit(2); }
const PORT = Number(process.env.CDP_PORT || 9338);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };

const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--window-size=1280,900', '--user-data-dir=' + join(ROOT, '.chrome-shoot-profile'), 'about:blank'], { stdio: 'ignore' });
try {
  let up = false; for (let i = 0; i < 60; i++) { try { await listPages(PORT); up = true; break; } catch { await sleep(250); } }
  if (!up) throw new Error(`Chrome 沒有在 ${PORT} 開出 CDP 端點`);

  console.log('▶ ja 頁：320 / 375 / 390 / 1280 —— 每個 .jw 文節只佔一行，且無水平溢出');
  for (const w of [320, 375, 390, 1280]) {
    const target = (await listPages(PORT)).find((p) => p.type === 'page'); const s = await attach(target);
    await s.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 768 });
    await s.navigate(`file://${ROOT}/site/ja/index.html`); await sleep(1500);
    const r = await s.evaluate(() => {
      const spans = [...document.querySelectorAll('.jw')];
      const split = spans.filter((e) => e.getClientRects().length !== 1).map((e) => e.textContent);
      return { count: spans.length, split, scrollW: document.documentElement.scrollWidth, inner: innerWidth };
    });
    if (r.count < 15) bad(`${w}px: 只找到 ${r.count} 個 .jw（預期 ≥15：Method 5 + Join 標題 5 + 拠点 2 + 職種 3）—— 覆寫沒套上？`);
    else if (r.split.length) bad(`${w}px: ${r.split.length} 個文節被拆行 → ${r.split.map((t) => `「${t}」`).join(' ')}`);
    else if (r.scrollW !== r.inner) bad(`${w}px: 水平溢出 scrollWidth=${r.scrollW} > ${r.inner}`);
    else ok(`${w}px: ${r.count} 個文節皆單行，無溢出`);
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close();
  }
  console.log('\n▶ 三語 320px：nav 的 CTA 按鈕不得折行、header 不得溢出（320 時「相談する」曾直排成四行）');
  for (const [k, f] of [['en', 'site/index.html'], ['ja', 'site/ja/index.html'], ['zh', 'site/zh/index.html']]) {
    const target = (await listPages(PORT)).find((p) => p.type === 'page'); const s = await attach(target);
    await s.send('Emulation.setDeviceMetricsOverride', { width: 320, height: 700, deviceScaleFactor: 1, mobile: true });
    await s.navigate(`file://${ROOT}/${f}`); await sleep(1200);
    /* 量「文字」的行框，不量元素：pill 是固定高 34px，文字折行時會溢出到框外，元素本身的
       rect 數與高度都不變（反向測試抓到：修正前 ja/zh 的「相談する／聯絡我們」直排四行，gate 卻只紅 en）。 */
    const r = await s.evaluate(() => { const c = document.querySelector('.nav__cta'); const n = document.querySelector('.nav'); const cr = c.getBoundingClientRect(); const nr = n.getBoundingClientRect();
      const rg = document.createRange(); rg.selectNodeContents(c); const lines = rg.getClientRects().length;
      return { lines, spill: c.scrollWidth > c.clientWidth + 1, ctaH: Math.round(cr.height), navH: Math.round(nr.height), ctaRight: Math.round(cr.right), inner: innerWidth, text: c.textContent.trim() }; });
    if (r.lines !== 1 || r.spill) bad(`${k} 320px: CTA「${r.text}」文字佔 ${r.lines} 個行框${r.spill ? '、且溢出框外' : ''}（應單行）`);
    else if (r.ctaRight > r.inner) bad(`${k} 320px: CTA 右緣 ${r.ctaRight} 超出視口 ${r.inner}`);
    else ok(`${k} 320px: CTA「${r.text}」文字單行、框內，header 高 ${r.navH}px`);
    await s.send('Emulation.clearDeviceMetricsOverride'); s.close();
  }

  console.log('\n▶ en / zh 頁不得殘留 .jw（那是 ja 專用的覆寫）');
  for (const [k, f] of [['en', 'site/index.html'], ['zh', 'site/zh/index.html']]) {
    const target = (await listPages(PORT)).find((p) => p.type === 'page'); const s = await attach(target);
    await s.navigate(`file://${ROOT}/${f}`); await sleep(800);
    const n = await s.evaluate(() => document.querySelectorAll('.jw').length);
    n ? bad(`${k}: 有 ${n} 個 .jw 殘留`) : ok(`${k}: 無 .jw`);
    s.close();
  }
} finally { chrome.kill(); }

console.log('');
if (fails.length) { console.error(`❌ audit-cjk-linebreak — ${fails.length} 項失敗`); process.exit(2); }
console.log('✅ audit-cjk-linebreak — ja 文節 320/375/390/1280 不拆行不溢出；三語 320 nav CTA 單行');
