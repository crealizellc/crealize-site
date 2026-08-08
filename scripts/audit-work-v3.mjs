#!/usr/bin/env node
/* ============================================================
   audit-work-v3 — Selected Work v3 的可執行驗收（AC 見 .claude/ac.md）

   用法：node scripts/audit-work-v3.mjs
   退出：0 全數通過 / 1 有 AC 不合格 / 2 環境或結構錯誤

   為何不用 Playwright：本機未安裝，且本站原則是零依賴傾向
   （同 scripts/render-kv.mjs 的理由）。作法是把「量測腳本」附加到
   已 build 出來的頁面副本上，用 Chrome `--headless --dump-dom` 跑完 JS
   後把結果讀回來 —— 副本放在原目錄，相對路徑才會跟正式頁一致。
   ============================================================ */
import { readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
];
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error('❌ 找不到 Chrome —— 這是環境問題，不是 AC 失敗');
  process.exit(2);
}

const LOCALES = [
  { key: 'en', dir: SITE, page: join(SITE, 'index.html') },
  { key: 'ja', dir: join(SITE, 'ja'), page: join(SITE, 'ja/index.html') },
  { key: 'zh', dir: join(SITE, 'zh'), page: join(SITE, 'zh/index.html') },
];

/* Chrome headless 在 macOS 把視窗寬度硬夾在 500px（2026-08-09 實測：
   --window-size=390 / 360 / 500 三者的 innerWidth 都回 500，
   --headless 與 --headless=new 皆然）。所以 <500px 的斷點不能用視窗寬度量 ——
   直接量會拿到「被夾過的 500 對上 scrollWidth 500」而報綠燈，是 fail-open 的假指標。
   窄寬度改用 iframe：媒體查詢對 iframe 自己的寬度生效，是真的視口測試。 */
const WINDOW_MIN_W = 500;

/** 在頁面尾端附加量測腳本，跑 Chrome，取回 JSON。 */
function probe(loc, width, height, extraJs = '') {
  if (width < WINDOW_MIN_W) return probeInFrame(loc, width, height);
  const tmp = join(loc.dir, '__audit-work-v3.html');
  const html = readFileSync(loc.page, 'utf8');
  const probeJs = `
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var cards = [].slice.call(document.querySelectorAll('#work-cards .card'));
    var out = {
      lang: document.documentElement.getAttribute('lang'),
      count: cards.length,
      indices: cards.map(function (c) { return c.getAttribute('data-work-index'); }),
      bodies: cards.map(function (c) { var e = c.querySelector('.card__body'); return e ? e.textContent : null; }),
      names: cards.map(function (c) { var e = c.querySelector('.card__name em'); return e ? e.textContent : null; }),
      imgs: cards.map(function (c) { var e = c.querySelector('.stage__phone img'); return e ? e.getAttribute('src') : null; }),
      lede: (document.getElementById('work-lede') || {}).textContent || '',
      legend: (document.getElementById('work-legend') || {}).textContent || '',
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      consoleErrors: window.__acErrors || []
    };
    ${extraJs}
    var pre = document.createElement('pre');
    pre.id = '__ac_result';
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }, 400);
});
</script>`;
  // console.error 攔截要在其他 script 之前掛上
  const hook = `<script>window.__acErrors=[];(function(o){console.error=function(){window.__acErrors.push([].slice.call(arguments).join(' '));o.apply(console,arguments)}})(console.error);</script>`;
  writeFileSync(tmp, html.replace('</head>', hook + '</head>').replace('</body>', probeJs + '</body>'));
  try {
    const dom = execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${width},${height}`,
      '--virtual-time-budget=4000',
      '--dump-dom',
      `file://${tmp}`,
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /<pre id="__ac_result">([\s\S]*?)<\/pre>/.exec(dom);
    if (!m) throw new Error('量測腳本沒有產出結果（頁面 JS 可能整段失敗）');
    const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    return JSON.parse(decode(m[1]));
  } finally {
    rmSync(tmp, { force: true });
  }
}

/** 窄視口：把量測頁放進固定寬度的 iframe，父頁把結果撈出來。 */
function probeInFrame(loc, width, height) {
  const tmp = join(loc.dir, '__audit-work-v3.html');
  const parent = join(loc.dir, '__audit-work-v3-frame.html');
  const html = readFileSync(loc.page, 'utf8');
  const hook = `<script>window.__acErrors=[];(function(o){console.error=function(){window.__acErrors.push([].slice.call(arguments).join(' '));o.apply(console,arguments)}})(console.error);</script>`;
  const probeJs = `
<script>
window.addEventListener('load', function () {
  setTimeout(function () {
    var cards = [].slice.call(document.querySelectorAll('#work-cards .card'));
    var pre = document.createElement('pre');
    pre.id = '__ac_result';
    pre.textContent = JSON.stringify({
      lang: document.documentElement.getAttribute('lang'),
      count: cards.length,
      indices: cards.map(function (c) { return c.getAttribute('data-work-index'); }),
      bodies: [], names: [], imgs: [], lede: '', legend: '',
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      consoleErrors: window.__acErrors || []
    });
    document.body.appendChild(pre);
  }, 400);
});
</script>`;
  writeFileSync(tmp, html.replace('</head>', hook + '</head>').replace('</body>', probeJs + '</body>'));
  writeFileSync(parent, `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0}iframe{width:${width}px;height:${height}px;border:0;display:block}</style>
<iframe src="__audit-work-v3.html"></iframe><pre id="__ac_result"></pre>
<script>
setTimeout(function(){
  var out = document.getElementById('__ac_result');
  try {
    var inner = frames[0].document.getElementById('__ac_result');
    out.textContent = inner ? inner.textContent : JSON.stringify({error:'iframe 內沒有量測結果'});
  } catch (e) { out.textContent = JSON.stringify({error:'讀不到 iframe：'+e.message}); }
}, 2500);
</script>`);
  try {
    const dom = execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      '--allow-file-access-from-files',
      `--window-size=${Math.max(width, WINDOW_MIN_W) + 40},${height + 40}`,
      '--virtual-time-budget=9000',
      '--dump-dom',
      `file://${parent}`,
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /<pre id="__ac_result">([\s\S]*?)<\/pre>/.exec(dom);
    if (!m) throw new Error('父頁沒有產出結果');
    const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const r = JSON.parse(decode(m[1]));
    if (r.error) throw new Error(r.error);
    return r;
  } finally {
    rmSync(tmp, { force: true });
    rmSync(parent, { force: true });
  }
}

const fails = [];
const notes = [];
const ok = (label, msg) => console.log(`   ✓ ${label} ${msg}`);
const bad = (label, msg) => { fails.push(`${label} ${msg}`); console.log(`   ✗ ${label} ${msg}`); };

console.log('▶ AC-1 產品齊全 + data-work-index 唯一');
const R = {};
for (const loc of LOCALES) {
  R[loc.key] = probe(loc, 1440, 1200);
  const r = R[loc.key];
  const uniq = new Set(r.indices);
  const inRange = r.indices.every((i) => Number(i) >= 0 && Number(i) <= 11);
  if (r.count === 12 && uniq.size === 12 && inRange) ok('AC-1', `${loc.key}: 12 張，index 0..11 皆唯一`);
  else bad('AC-1', `${loc.key}: count=${r.count} uniq=${uniq.size} inRange=${inRange} indices=${r.indices.join(',')}`);
}

console.log('▶ AC-2 三語真的不同');
const KANA = /[぀-ゟ゠-ヿ]/;
const HAN = /[一-鿿]/;
for (let i = 0; i < 12; i++) {
  const [e, j, z] = [R.en.bodies[i], R.ja.bodies[i], R.zh.bodies[i]];
  const name = R.en.names[i];
  const distinct = e !== j && j !== z && e !== z;
  const jaOK = KANA.test(j || '');
  // 中文版容許少量假名 —— 引用日文專有名詞（お薬手帳、e薬SCAN）在中文行文裡是正確的，
  // 不是「忘了翻譯」。抓的是「整段其實還是日文」，門檻設在 3%。
  const kana = ((z || '').match(/[぀-ゟ゠-ヿ]/g) || []).length;
  const ratio = z ? kana / z.length : 1;
  const zhOK = HAN.test(z || '') && ratio < 0.03;
  if (distinct && jaOK && zhOK) ok('AC-2', `${name}${kana ? `（zh 引用 ${kana} 個假名字元，${(ratio * 100).toFixed(1)}%，在容差內）` : ''}`);
  else bad('AC-2', `${name}: distinct=${distinct} ja有假名=${jaOK} zh假名比=${(ratio * 100).toFixed(1)}%`);
}
if (R.en.lede === R.ja.lede || R.ja.lede === R.zh.lede) bad('AC-2', 'lede 三語未區分');
else ok('AC-2', 'lede 三語各異');

console.log('▶ AC-3 圖片實際存在');
for (const loc of LOCALES) {
  const r = R[loc.key];
  const srcs = r.imgs.filter(Boolean);
  const missing = srcs.filter((s) => !existsSync(resolve(loc.dir, s)));
  const notWebp = srcs.filter((s) => !s.endsWith('.webp'));
  if (!missing.length && !notWebp.length) ok('AC-3', `${loc.key}: ${srcs.length} 張圖皆存在且為 webp`);
  else bad('AC-3', `${loc.key}: 缺檔=${missing.join(',')} 非webp=${notWebp.join(',')}`);
}
{
  const nophone = R.en.imgs.filter((x) => x === null).length;
  if (nophone === 1) ok('AC-3', 'meguru 為 nophone 版型（1 張無截圖），符合設計');
  else notes.push(`AC-3 提示：無截圖卡有 ${nophone} 張（設計上預期 1 張 = meguru）`);
}

console.log('▶ AC-4 動畫存在且尊重 reduce-motion');
{
  const css = readFileSync(join(SITE, 'css/sections.css'), 'utf8');
  const v3 = css.slice(css.indexOf('WORK v3 — per-product motif cards'));
  const rm = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?animation:\s*none/.test(v3);
  const kf = new Set([...v3.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)].map((m) => m[1]));
  if (rm) ok('AC-4', 'reduce-motion 區塊存在且含 animation:none');
  else bad('AC-4', '找不到 reduce-motion 的 animation:none');
  if (kf.size >= 10) ok('AC-4', `${kf.size} 組 @keyframes`);
  else bad('AC-4', `只有 ${kf.size} 組 @keyframes（期望 ≥10）`);
}

console.log('▶ AC-5 registry 對帳失敗要大聲');
{
  const p = join(SITE, 'js/i18n/en.js');
  const orig = readFileSync(p, 'utf8');
  // 移除最後一個產品（Meguru）—— 註冊表少一個，work-v3 必須在 console 大聲抗議
  const cut = orig.replace(/,\s*\{\s*\n\s*name: 'Meguru'[\s\S]*?\n\s*\},/, ',');
  try {
    if (cut === orig) { bad('AC-5', '無法製造缺項（en.js 結構已變），此 AC 未實際驗證'); }
    else {
      writeFileSync(p, cut);
      const r = probe(LOCALES[0], 1440, 1200);
      const shouted = r.consoleErrors.some((e) => e.includes('[work-v3] registry 對帳失敗'));
      if (shouted) ok('AC-5', `缺一個產品時有大聲失敗（卡片數 ${r.count}）`);
      else bad('AC-5', `缺一個產品但 console 沒有抗議（errors=${JSON.stringify(r.consoleErrors)}）`);
    }
  } finally {
    writeFileSync(p, orig);
  }
}

console.log('▶ AC-6 四個寬度無水平溢出');
for (const w of [1440, 1100, 640, 390]) {
  const r = probe(LOCALES[0], w, 1400);
  // 先確認量到的視口真的是我們要求的寬度 —— 不確認就會拿被夾過的寬度自我對照，
  // 那是 fail-open：scrollWidth 與 innerWidth 都是 500，永遠相等。
  if (r.winW !== w) { bad('AC-6', `${w}px: 視口實際是 ${r.winW}px，這格沒測到，不算通過`); continue; }
  if (r.docW === r.winW) ok('AC-6', `${w}px: scrollWidth=${r.docW} = innerWidth`);
  else bad('AC-6', `${w}px: scrollWidth=${r.docW} > innerWidth=${r.winW}（溢出 ${r.docW - r.winW}px）`);
}

console.log('▶ AC-7 設計契約未漂移');
try {
  execFileSync('bash', [
    join(process.env.HOME, '.claude/scripts/token-drift-lint.sh'),
    join(ROOT, 'docs/design-system/tokens'),
    join(SITE, 'css/tokens.css'), join(SITE, 'css/site.css'),
    join(SITE, 'css/sections.css'), join(SITE, 'css/work-modal.css'),
  ], { stdio: 'pipe' });
  ok('AC-7', 'token-drift-lint 無漂移');
} catch (e) {
  bad('AC-7', `token-drift-lint 回報漂移：\n${(e.stdout || e.stderr || '').toString().trim()}`);
}

console.log('');
for (const n of notes) console.log(`ℹ️  ${n}`);
if (fails.length) {
  console.error(`\n❌ ${fails.length} 項 AC 不合格：`);
  for (const f of fails) console.error(`   · ${f}`);
  process.exit(1);
}
console.log('✅ Selected Work v3 — 全部 AC 通過');
