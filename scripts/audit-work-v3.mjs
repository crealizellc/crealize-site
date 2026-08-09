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
      poss: cards.map(function (c) { var e = c.querySelector('.card__pos'); return e ? e.textContent : null; }),
      imgs: cards.map(function (c) { var e = c.querySelector('.stage__bg'); return e ? e.getAttribute('src') : null; }),
      icons: cards.map(function (c) { var e = c.querySelector('.stage__icon'); return e ? e.getAttribute('src') : null; }),
      lede: (document.getElementById('work-lede') || {}).textContent || '',
      perCard: [].slice.call(document.querySelectorAll('#work-cards .card')).map(function (card) {
        var s2 = {};
        [].slice.call(card.querySelectorAll('*')).forEach(function (el) {
          var c = el.getAttribute('class');
          if (c) c.trim().split(/\\s+/).forEach(function (x) { if (x) s2[x] = 1; });
        });
        return Object.keys(s2);
      }),
      classes: (function () {
        var set = {};
        [].slice.call(document.querySelectorAll('#work-cards *')).forEach(function (el) {
          var c = el.getAttribute('class');
          // 注意：這段字串是 .mjs 的 template literal，\\s 必須寫成雙反斜線，
          // 否則會被當成未知跳脫而變成字母 s —— 那會把 class 依「s」切開
          // （"stage" → "tage"），量測結果整個是假的。2026-08-09 踩過。
          if (c) c.trim().split(/\\s+/).forEach(function (x) { if (x) set[x] = 1; });
        });
        return Object.keys(set);
      })(),
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
  CLEANUP.files.add(tmp);
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
    CLEANUP.files.delete(tmp);
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
  CLEANUP.files.add(tmp);
  CLEANUP.files.add(parent);
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
    CLEANUP.files.delete(tmp);
    CLEANUP.files.delete(parent);
  }
}

/* finally 在 SIGINT/SIGTERM 下不會執行 —— 2026-08-09 實測：在 AC-5 改寫 en.js 的
   瞬間送 SIGINT，en.js 就少了一個產品且沒有任何警告，暫存頁也留在 site/ 下
   （後來被 auto-save cron commit 進公開 repo）。改為集中登記 + 訊號時一併還原。 */
const CLEANUP = { files: new Set(), restore: new Map() };
function cleanupAll() {
  for (const f of CLEANUP.files) { try { rmSync(f, { force: true }); } catch {} }
  for (const [p, content] of CLEANUP.restore) { try { writeFileSync(p, content); } catch {} }
  CLEANUP.files.clear();
  CLEANUP.restore.clear();
}
process.on('exit', cleanupAll);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(sig, () => { cleanupAll(); process.exit(130); });
}
process.on('uncaughtException', (e) => { cleanupAll(); console.error(e); process.exit(2); });

const fails = [];
const notes = [];
const ok = (label, msg) => console.log(`   ✓ ${label} ${msg}`);
const bad = (label, msg) => { fails.push(`${label} ${msg}`); console.log(`   ✗ ${label} ${msg}`); };

console.log('▶ AC-1 產品齊全 + data-work-index 唯一');
/* 產品數以 registry 為準，不寫死 —— 寫死的話每加一個產品就要回頭改這裡，
   而且改漏了會變成「加了產品卻說通過」。registry 是 build 的真相源。 */
const N = (() => {
  const win = {};
  new Function('window', readFileSync(join(SITE, 'js/i18n/en.js'), 'utf8'))(win);
  return win.CRZ_I18N.work.length;
})();
const R = {};
for (const loc of LOCALES) {
  R[loc.key] = probe(loc, 1440, 1200);
  const r = R[loc.key];
  const uniq = new Set(r.indices);
  const inRange = r.indices.every((i) => Number(i) >= 0 && Number(i) < N);
  if (r.count === N && uniq.size === N && inRange) ok('AC-1', `${loc.key}: ${N} 張，index 0..${N - 1} 皆唯一`);
  else bad('AC-1', `${loc.key}: count=${r.count}/${N} uniq=${uniq.size} inRange=${inRange} indices=${r.indices.join(',')}`);
}

console.log('▶ AC-2 三語真的不同');
const KANA = /[぀-ゟ゠-ヿ]/;
const HAN = /[一-鿿]/;
for (let i = 0; i < N; i++) {
  const [e, j, z] = [R.en.bodies[i], R.ja.bodies[i], R.zh.bodies[i]];
  const name = R.en.names[i];
  // 只驗「三者不同」的話，一個假名加一個漢字就能過關（獨立驗收實測）。
  // 補上長度下限：這是產品說明，不是佔位字元。
  const LEN_MIN = { en: 80, ja: 40, zh: 30 };   // CJK 字元密度高，門檻自然較低
  const tooShort = [];
  if ((e || '').length < LEN_MIN.en) tooShort.push(`en=${(e || '').length}`);
  if ((j || '').length < LEN_MIN.ja) tooShort.push(`ja=${(j || '').length}`);
  if ((z || '').length < LEN_MIN.zh) tooShort.push(`zh=${(z || '').length}`);
  const posDistinct = R.en.poss[i] !== R.ja.poss[i] && R.ja.poss[i] !== R.zh.poss[i] && R.en.poss[i] !== R.zh.poss[i];
  const distinct = e !== j && j !== z && e !== z && !tooShort.length && posDistinct;
  const jaOK = KANA.test(j || '');
  // 中文版容許少量假名 —— 引用日文專有名詞（お薬手帳、e薬SCAN）在中文行文裡是正確的，
  // 不是「忘了翻譯」。抓的是「整段其實還是日文」，門檻設在 3%。
  const kana = ((z || '').match(/[぀-ゟ゠-ヿ]/g) || []).length;
  const ratio = z ? kana / z.length : 1;
  const zhOK = HAN.test(z || '') && ratio < 0.03;
  if (distinct && jaOK && zhOK) ok('AC-2', `${name}${kana ? `（zh 引用 ${kana} 個假名字元，${(ratio * 100).toFixed(1)}%，在容差內）` : ''}`);
  else bad('AC-2', `${name}: distinct=${distinct} ja有假名=${jaOK} zh假名比=${(ratio * 100).toFixed(1)}%` +
    (tooShort.length ? ` 說明過短(${tooShort.join(',')})` : '') + (posDistinct ? '' : ' 定位句三語未區分'));
}
if (R.en.lede === R.ja.lede || R.ja.lede === R.zh.lede) bad('AC-2', 'lede 三語未區分');
else ok('AC-2', 'lede 三語各異');

/* lede 曾經把產品數寫死成「Twelve / 12 / 十二」，產品加到 16 之後三語都還在說十二，
   右上角的計數卻是 16 —— 同一頁自相矛盾。產品數只能從 registry 來。 */
for (const loc of LOCALES) {
  const r = R[loc.key];
  const n = r.count;
  const nums = (r.lede.match(/\d+/g) || []).map(Number);
  const words = /twelve|十二|１２/i.test(r.lede);
  if (words || (nums.length && !nums.includes(n))) {
    bad('AC-2', `${loc.key}: lede 的產品數與實際 ${n} 張卡不符 → 「${r.lede.slice(0, 40)}…」`);
  } else if (!nums.includes(n)) {
    bad('AC-2', `${loc.key}: lede 沒有提到產品數 ${n}（應由 registry 長度填入）`);
  } else {
    ok('AC-2', `${loc.key}: lede 產品數 ${n} 與卡片數一致`);
  }
}

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
  // icon 是「個別 icon」這條需求的落地點；沒有官方 icon 的產品要被點名，不能靜默少一個
  /* 缺 icon 就明白列出來，不自己補一個。
     Yves 2026-08-09：「有哪些Icon你不知道你要跟我講，你不要捏造給我」。 */
  const noIcon = R.en.icons.map((x, i) => (x ? null : R.en.names[i])).filter(Boolean);
  if (!noIcon.length) ok('AC-3', `${R.en.icons.length} 張卡都有官方 icon`);
  else notes.push(`AC-3 ⚠️ 缺官方 icon（卡片留空，等真檔進來）：${noIcon.join(', ')}`);
  // 有 src 就必須解析得到檔案 —— 破圖會顯示 alt 文字，看起來像一個寫著產品名的白方塊
  const brokenIcon = R.en.icons
    .map((src, i) => (src && !existsSync(resolve(LOCALES[0].dir, src)) ? `${R.en.names[i]} → ${src}` : null))
    .filter(Boolean);
  if (!brokenIcon.length) ok('AC-3', 'icon 路徑全部解析得到檔案');
  else bad('AC-3', `icon 破圖（會顯示 alt 文字）：${brokenIcon.join(', ')}`);
}
{
  // 「檔存在且副檔名對」擋不住「內容根本是別的形狀」——2026-08-09 獨立驗收實測：
  // 把 1600×1200 的橫向海報複製成 shots/fudeto.webp，原本這條 AC 照樣全綠。
  // 手機框是 aspect-ratio:9/19.5 + object-fit:cover，長寬比不符就會裁掉可見的內容。
  // 底圖是 4:3 母版（見 tokens/crealize.tokens.json § keyVisual）。
  // 舊值是 9:19.5 —— 那是手機框的比例，手機框已經整組移除。
  const FRAME = 4 / 3;
  const TOL = 0.02;
  for (const src of R.en.imgs.filter(Boolean)) {
    const f = resolve(LOCALES[0].dir, src);
    const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f], { encoding: 'utf8' });
    const w = Number(/pixelWidth:\s*(\d+)/.exec(dims)?.[1]);
    const h = Number(/pixelHeight:\s*(\d+)/.exec(dims)?.[1]);
    const ratio = w / h;
    const name = src.split('/').pop();
    if (Math.abs(ratio - FRAME) <= TOL) ok('AC-3', `${name} ${w}×${h} ratio=${ratio.toFixed(3)}`);
    else bad('AC-3', `${name} ${w}×${h} ratio=${ratio.toFixed(3)}，母版是 ${FRAME.toFixed(3)}（容差 ${TOL}）`);
  }
}

console.log('▶ AC-4 動畫存在且尊重 reduce-motion');
{
  const css = readFileSync(join(SITE, 'css/sections.css'), 'utf8');
  const v3 = css.slice(css.indexOf('WORK v3 — per-product motif cards'));

  // 原本用非貪婪正則從 @media 一路找 animation:none —— 它會跨過關掉的大括號，
  // 所以「把整個 reduce-motion 區塊清空、後面別處留一句 animation:none」照樣綠。
  // 改成大括號配對，只看區塊自己的內容。
  const at = v3.indexOf('@media (prefers-reduced-motion: reduce)');
  let rmBody = '';
  if (at >= 0) {
    let i = v3.indexOf('{', at), depth = 0, start = i;
    for (; i < v3.length; i++) {
      if (v3[i] === '{') depth++;
      else if (v3[i] === '}' && --depth === 0) { rmBody = v3.slice(start + 1, i); break; }
    }
  }
  if (/animation:\s*none/.test(rmBody)) ok('AC-4', `reduce-motion 區塊內含 animation:none（區塊 ${rmBody.trim().length} 字元）`);
  else bad('AC-4', `reduce-motion 區塊沒有 animation:none（抽出 ${rmBody.trim().length} 字元）`);

  // 動畫「有沒有綁到真實存在的元素」才是重點 —— 只數 @keyframes 的話，
  // 把所有 .is-live 選擇器改成一個不存在的 class，整組動畫全死也還是綠。
  const declared = new Set([...v3.matchAll(/@keyframes\s+([A-Za-z0-9_-]+)/g)].map((m) => m[1]));
  const used = [...v3.matchAll(/#work\s+\.is-live\s+\.([A-Za-z0-9_-]+)\s*\{[^}]*animation:\s*([A-Za-z0-9_-]+)/g)]
    .map((m) => ({ cls: m[1], kf: m[2] }));
  const present = new Set(R.en.classes || []);
  const orphanCls = [...new Set(used.filter((u) => !present.has(u.cls)).map((u) => u.cls))];
  const orphanKf = [...new Set(used.filter((u) => !declared.has(u.kf)).map((u) => u.kf))];
  if (used.length >= 20) ok('AC-4', `${used.length} 條 .is-live 動畫規則`);
  else bad('AC-4', `只有 ${used.length} 條 .is-live 動畫規則（期望 ≥20）`);
  if (!orphanCls.length) ok('AC-4', `全部動畫都綁到 DOM 內實際存在的 class`);
  else bad('AC-4', `這些動畫綁在不存在的 class 上（等於沒動畫）：${orphanCls.join(', ')}`);
  if (!orphanKf.length) ok('AC-4', `全部 animation 都指向已宣告的 @keyframes`);
  else bad('AC-4', `這些 animation 指向未宣告的 @keyframes：${orphanKf.join(', ')}`);

  /* 每張卡至少要有一條屬於自己的動畫。
     原本用寫死的「產品 → class 前綴」對照表，新增產品不在表裡就靜默跳過 ——
     2026-08-09 加 kizuki/dramaflow/todoke 時，三張卡一條動畫都沒有，AC-4 照樣全綠。
     改為逐卡比對它自己的 DOM class 與 CSS 裡有動畫的 class 取交集。 */
  const animated = new Set(used.map((u) => u.cls));
  const still = (R.en.perCard || [])
    .map((cls, i) => (cls.some((c) => animated.has(c)) ? null : R.en.names[i]))
    .filter(Boolean);
  if (!still.length) ok('AC-4', `${(R.en.perCard || []).length} 張卡各有自己的動畫`);
  else bad('AC-4', `這些卡沒有任何動畫：${still.join(', ')}`);
}

console.log('▶ AC-5 registry 對帳：出貨狀態必須乾淨，且缺項時要大聲');
for (const loc of LOCALES) {
  // 這條才是真正的守門員。原本只驗「腳本自己弄壞時會叫」——那證明警報器會響，
  // 沒證明它現在沒在響。2026-08-09 獨立驗收：多塞一個產品進 registry，
  // 頁面 console 已在抗議、索引表 13 列對上 12 張卡，七條 AC 卻全綠。
  const errs = R[loc.key].consoleErrors || [];
  if (!errs.length) ok('AC-5', `${loc.key}: 出貨狀態 console 無錯誤`);
  else bad('AC-5', `${loc.key}: 出貨狀態就有 console 錯誤 → ${JSON.stringify(errs)}`);
}
{
  const p = join(SITE, 'js/i18n/en.js');
  const orig = readFileSync(p, 'utf8');
  CLEANUP.restore.set(p, orig);
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
    CLEANUP.restore.delete(p);
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
{
  // token-drift-lint 只解析 hsl()、#hex 與 font-family；WORK v3 這 284 行新 CSS
  // 用的全是 rgba() 與 var() 字體，所以那支 lint 對它「一個值都沒檢查到」。
  // 這裡補上區塊自己的白名單：色彩要嘛是 var(--…)，要嘛是契約墨色/紙色的 rgba。
  const ALLOWED_RGBA = new Set([
    '18,17,16',      // --ink
    '255,255,255',   // 白（高光）
    '14,14,16',      // Meguru 品牌墨色 —— canvas 的 data-border 規則帶進來的產品品牌值
  ]);
  const css = readFileSync(join(SITE, 'css/sections.css'), 'utf8');
  const v3 = css.slice(css.indexOf('WORK v3 — per-product motif cards'));
  const offenders = [];
  for (const m of v3.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/g)) {
    const t = `${m[1]},${m[2]},${m[3]}`;
    if (!ALLOWED_RGBA.has(t)) offenders.push(`rgb(${t})`);
  }
  for (const fn of ['oklch(', 'color-mix(', 'lab(', 'lch(', 'hwb(']) {
    if (v3.includes(fn)) offenders.push(`${fn}…（契約外的色彩函式）`);
  }
  for (const m of v3.matchAll(/(?:^|[\s:])(#[0-9a-fA-F]{3,8})\b/g)) offenders.push(m[1]);
  // 具名色：抓 color/background/border-color 後面直接跟英文字的情形
  for (const m of v3.matchAll(/(?:^|[;{\s])(?:color|background(?:-color)?|border-color|outline-color)\s*:\s*([a-z]{3,})\s*[;}]/g)) {
    if (!['none', 'transparent', 'inherit', 'currentcolor', 'unset', 'initial'].includes(m[1].toLowerCase())) offenders.push(`具名色 ${m[1]}`);
  }
  const uniq = [...new Set(offenders)];
  if (!uniq.length) ok('AC-7', 'WORK v3 區塊的色彩全部是 var() 或契約 rgba');
  else bad('AC-7', `WORK v3 區塊有契約外的色值：${uniq.join(', ')}`);
}
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

console.log('▶ AC-8 驗收自己不得留下殘留物');
{
  // 這些暫存頁必須放在與正式頁同一層（相對路徑才對得上），所以特別容易留下來。
  // 2026-08-09 踩過：SIGINT 讓 finally 沒跑，殘檔被 auto-save cron commit 進公開 repo，
  // 而 deploy-gh.sh 的白名單只看 dotfile，抓不到它。
  const strays = [];
  for (const loc of LOCALES) {
    for (const n of ['__audit-work-v3.html', '__audit-work-v3-frame.html']) {
      if (existsSync(join(loc.dir, n))) strays.push(join(loc.dir.replace(ROOT + '/', ''), n));
    }
  }
  if (!strays.length) ok('AC-8', 'site/ 下無驗收暫存物');
  else bad('AC-8', `殘留：${strays.join(', ')}`);

  const en = readFileSync(join(SITE, 'js/i18n/en.js'), 'utf8');
  if (en.includes("name: 'Meguru'")) ok('AC-8', 'site/js/i18n/en.js 已完整還原');
  else bad('AC-8', 'site/js/i18n/en.js 少了 Meguru —— AC-5 的還原沒跑到');
}

console.log('');
for (const n of notes) console.log(`ℹ️  ${n}`);
if (fails.length) {
  console.error(`\n❌ ${fails.length} 項 AC 不合格：`);
  for (const f of fails) console.error(`   · ${f}`);
  process.exit(1);
}
console.log('✅ Selected Work v3 — 全部 AC 通過');
