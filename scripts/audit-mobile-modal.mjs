#!/usr/bin/env node
/* ============================================================
   窄視口（真手機模擬）驗收 —— 第八道 gate

   為什麼要獨立一支、而不是塞進 audit-work-v3.mjs：
   前七道 gate 全部只在 1440px 或「390px 寬的 iframe」裡量。iframe 量得到版面寬度，
   量不到兩件真正害人的事：
     ① 手機的 modal 高度超過視窗時會發生什麼（iframe 高度是我們自己給的，不是真視窗）
     ② `(hover: none)` —— 桌面 Chrome 的 iframe 永遠是 hover:hover，
        所以「觸控裝置看不到動畫」這個缺陷在 iframe 裡永遠不會重現
   兩個都要真的 device emulation 才量得到，所以走 CDP `Emulation.setDeviceMetricsOverride`
   （mobile:true）。這也是 2026-08-09 兩個上線缺陷的來源：
     · modal 關閉鈕被推到畫面外（close.y=-40、elementFromPoint 回 null）
     · 卡片 motif 只播一次，手機沒有 hover 可重播 → 永遠是靜止圖

   AC：
     M-1 關閉鈕完整落在視窗內，且它自己是該點的最上層元素（真的點得到）
     M-2 關閉鈕 ≥ 44×44（WCAG 2.5.8）
     M-3 卡片高度不超過視窗 —— 溢出必須發生在內部捲動容器，不是把 UI 推出畫面
     M-4 點關閉鈕真的關得掉
     M-5 畫面中央帶的卡片 stage 有 is-looping，且至少 1 個元素 iteration=infinite
     M-6 reduce-motion 下，全站 0 個元素在動（M-5 的循環不得反過來蓋掉無障礙設定）
   ============================================================ */
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attach, listPages } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) {
  console.error('❌ audit-mobile-modal：找不到 Chrome —— 環境問題，不是 AC 失敗');
  process.exit(2);
}
const EXTRA = process.env.CHROME_SINGLE_PROCESS === '1' ? ['--single-process', '--no-zygote'] : [];

const W = 390, H = 844, TAP_MIN = 44;
const LOCALES = [{ key: 'en', dir: '' }, { key: 'ja', dir: 'ja' }, { key: 'zh', dir: 'zh' }];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };

/* 探針在頁面裡跑：開 modal → 量關閉鈕與版面 → 關 modal。
   回傳純資料，判斷全部留在 Node 這一側（探針裡不做斷言，才不會把失敗吞掉）。 */
const PROBE = `(function () {
  var q = function (s) { return document.querySelector(s); };
  var box = function (e) {
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  var card = q('#work-cards .card');
  if (!card) return { error: '找不到任何卡片' };
  card.click();
  return { opened: true };
})()`;

const MEASURE = `(function () {
  var q = function (s) { return document.querySelector(s); };
  var box = function (e) {
    if (!e) return null;
    var r = e.getBoundingClientRect();
    return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
  };
  var btn = q('.work-modal__close');
  if (!btn) return { error: 'modal 沒有關閉鈕' };
  var b = btn.getBoundingClientRect();
  var cx = Math.round(b.x + b.width / 2), cy = Math.round(b.y + b.height / 2);
  var top = document.elementFromPoint(cx, cy);
  var content = q('.work-modal__content');
  return {
    vp: { w: window.innerWidth, h: window.innerHeight },
    close: box(btn),
    closeHittable: !!top && (top === btn || btn.contains(top)),
    topAtClose: top ? (top.className || top.tagName) : null,
    card: box(q('.work-modal__card')),
    contentScrolls: !!content && content.scrollHeight > content.clientHeight + 1,
    contentOverflowY: content ? getComputedStyle(content).overflowY : null
  };
})()`;

const CLOSE_AND_LOOP = `(function () {
  var btn = document.querySelector('.work-modal__close');
  if (btn) btn.click();
  var modal = document.querySelector('.work-modal');
  var out = { closed: !!modal && !modal.classList.contains('is-open') };
  var work = document.getElementById('work');
  if (work) work.scrollIntoView();
  return out;
})()`;

const LOOP_MEASURE = `(function () {
  var vh = window.innerHeight;
  var cards = [].slice.call(document.querySelectorAll('#work-cards .card'));
  var centred = cards.filter(function (c) {
    var r = c.getBoundingClientRect();
    return r.top < vh * 0.85 && r.bottom > vh * 0.15;
  });
  var looping = centred.filter(function (c) {
    var st = c.querySelector('.stage');
    return st && st.classList.contains('is-looping');
  });
  var infinite = 0, animated = 0;
  centred.forEach(function (c) {
    [].slice.call(c.querySelectorAll('.m *')).forEach(function (e) {
      var cs = getComputedStyle(e);
      if (cs.animationName === 'none') return;
      animated++;
      if (cs.animationIterationCount === 'infinite') infinite++;
    });
  });
  return { hoverNone: window.matchMedia('(hover: none)').matches,
           centred: centred.length, looping: looping.length, animated: animated, infinite: infinite };
})()`;

/* 每次都換 port + 換 profile：共用同一個 port 時，前一個 Chrome 還沒完全退出，
   下一次 listPages 會連到那個正在死掉的實例然後永久卡住（2026-08-09 實際踩到）。 */
let portSeq = 0;
async function run(locDir, reduceMotion) {
  const port = 9380 + (portSeq++);
  const chrome = spawn(CHROME, [
    `--remote-debugging-port=${port}`, '--headless=new', '--disable-gpu', '--no-sandbox',
    '--hide-scrollbars', '--allow-file-access-from-files', ...EXTRA,
    ...(reduceMotion ? ['--force-prefers-reduced-motion'] : []),
    `--window-size=${W},${H}`,
    '--user-data-dir=' + join(ROOT, `.chrome-mobile-profile-${port}`), 'about:blank',
  ], { stdio: 'ignore' });
  try {
    let up = false;
    for (let i = 0; i < 80; i++) { try { await listPages(port); up = true; break; } catch { await sleep(250); } }
    if (!up) throw new Error('CDP 沒開起來');
    const t = (await listPages(port))[0];
    const s = await attach(t);
    // mobile:true 才會讓 (hover: none) / (pointer: coarse) 成立 —— 這正是 iframe 量不到的部分
    await s.send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
    await s.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await s.navigate(`file://${join(ROOT, 'site', locDir, 'index.html')}`);
    await sleep(2200);
    await s.evaluate(() => { document.getElementById('work').scrollIntoView(); });
    await sleep(1200);
    const loop = await s.evaluate(new Function('return ' + LOOP_MEASURE));
    const open = await s.evaluate(new Function('return ' + PROBE));
    await sleep(1400);
    const m = open.error ? open : await s.evaluate(new Function('return ' + MEASURE));
    const closed = await s.evaluate(new Function('return ' + CLOSE_AND_LOOP));
    s.close();
    return { loop, m, closed };
  } finally { chrome.kill(); }
}

/* 硬性逾時。沒有它的話，run() 卡住會讓 Node 印出 "unsettled top-level await"
   然後**以 exit 0 結束** —— gate 一個字都沒驗卻是綠燈，比沒有 gate 更糟。 */
function withTimeout(p, ms, label) {
  let h;
  return Promise.race([
    p.finally(() => clearTimeout(h)),
    new Promise((_, rej) => { h = setTimeout(() => rej(new Error(`${label} 逾時 ${ms}ms`)), ms); }),
  ]);
}

console.log(`▶ 真手機模擬（${W}×${H}, mobile=true）—— modal 必須關得掉、動態必須看得到`);
let measured = 0;
for (const loc of LOCALES) {
  let r;
  try { r = await withTimeout(run(loc.dir, false), 120000, `${loc.key} 探測`); measured++; }
  catch (e) { bad(`${loc.key}: 探測失敗 —— ${e.message}`); continue; }

  const { m, loop, closed } = r;
  if (m.error) { bad(`${loc.key}: ${m.error}`); continue; }

  // M-1：關閉鈕必須完整在視窗內，而且該點的最上層元素就是它自己
  const inView = m.close.y >= 0 && m.close.x >= 0 &&
    m.close.y + m.close.h <= m.vp.h && m.close.x + m.close.w <= m.vp.w;
  if (inView && m.closeHittable) ok(`${loc.key}: 關閉鈕在畫面內且點得到（${m.close.x},${m.close.y}）`);
  else bad(`${loc.key}: 關閉鈕點不到 —— rect=${JSON.stringify(m.close)} vp=${JSON.stringify(m.vp)} 該點最上層=${m.topAtClose}`);

  // M-2：觸控目標下限
  if (m.close.w >= TAP_MIN && m.close.h >= TAP_MIN) ok(`${loc.key}: 關閉鈕 ${m.close.w}×${m.close.h} ≥ ${TAP_MIN}px`);
  else bad(`${loc.key}: 關閉鈕 ${m.close.w}×${m.close.h}，小於 ${TAP_MIN}px 觸控下限`);

  // M-3：溢出要發生在內部捲動容器，不是把整張卡片推出畫面
  if (m.card.h <= m.vp.h + 1) ok(`${loc.key}: 卡片 ${m.card.h}px 不超過視窗 ${m.vp.h}px`);
  else bad(`${loc.key}: 卡片 ${m.card.h}px > 視窗 ${m.vp.h}px —— 溢出會把 UI 推出畫面（2026-08-09 的原缺陷）`);
  if (m.contentOverflowY === 'auto' || m.contentOverflowY === 'scroll') ok(`${loc.key}: 正文在內部捲動（overflow-y:${m.contentOverflowY}）`);
  else bad(`${loc.key}: 正文沒有內部捲動容器（overflow-y:${m.contentOverflowY}）—— 長文會讀不完`);

  // M-4
  if (closed.closed) ok(`${loc.key}: 點關閉鈕真的關得掉`);
  else bad(`${loc.key}: 點了關閉鈕 modal 仍是 is-open`);

  // M-5：觸控裝置上卡片動畫必須看得到
  if (!loop.hoverNone) { bad(`${loc.key}: device emulation 沒生效（hover:none=false）—— 這題量不準，視為失敗`); continue; }
  if (loop.centred > 0 && loop.looping === loop.centred) ok(`${loc.key}: 畫面中央 ${loop.centred} 張卡片都在循環`);
  else bad(`${loc.key}: 中央 ${loop.centred} 張卡片只有 ${loop.looping} 張有 is-looping`);
  if (loop.infinite > 0) ok(`${loc.key}: ${loop.infinite} 個 motif 元素 iteration=infinite（手機看得到動態）`);
  else bad(`${loc.key}: 0 個 infinite —— 手機上動畫播一次就停，等同靜止圖`);
}

// M-6：上面的循環不得反過來蓋掉暈動症使用者的設定
try {
  const r = await withTimeout(run('', true), 120000, 'reduce-motion 探測');
  if (r.loop.animated === 0) ok('reduce-motion: 卡片 0 個元素在動（循環沒有蓋掉無障礙設定）');
  else bad(`reduce-motion: 仍有 ${r.loop.animated} 個元素在動 —— is-looping 蓋掉了 animation:none`);
} catch (e) { bad(`reduce-motion 探測失敗 —— ${e.message}`); }

// 覆蓋率自檢：少量到一個語系就是沒驗完，不准當成通過
if (measured !== LOCALES.length) bad(`只量到 ${measured}/${LOCALES.length} 個語系`);

for (let i = 0; i < portSeq; i++) rmSync(join(ROOT, `.chrome-mobile-profile-${i + 9380}`), { recursive: true, force: true });

console.log('');
if (fails.length) {
  console.error(`❌ audit-mobile-modal — ${fails.length} 項未通過`);
  process.exit(2);
}
console.log('✅ audit-mobile-modal — 三語窄視口 modal 可關閉、動態可見、reduce-motion 正確');
