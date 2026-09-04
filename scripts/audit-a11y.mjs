#!/usr/bin/env node
/* ============================================================
   audit-a11y.mjs — 鍵盤與螢幕閱讀器正確性（2026-09-04 唯讀稽核修正的六項）

   這六項全部曾在線上、且六道既有 gate 一道都沒紅 —— 它們測的是版面、資產、
   預渲染內容，沒有一道看 ARIA 或焦點順序。修正落在三層：
     builder 字串模板（build-site.mjs）── skip link / <main id> / aria-current
     產生器模板（gen-work-v3.mjs）    ── card__jp lang="ja"
     手工檔（site.css / site.js / work-modal.js / i18n）── langmenu visibility /
                                        aria-invalid / menuLabel / 執行期 lang
   前兩層 re-export 會靜靜還原，後一層有人「順手整理」就沒了。本檔擋這些。

   證據等級：標「[原始碼]」的檢查只證明程式碼寫著那句，不證明瀏覽器行為；
   標「[產物]」的檢查讀的是三語靜態 HTML，等於爬蟲與無 JS 使用者看到的東西。

   反向測試（每條都跑過，見 commit message）：拿掉對應修正 → 本檔 exit 2。
   ============================================================ */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = [
  { key: 'en', hreflang: 'en',      file: join(ROOT, 'site/index.html') },
  { key: 'ja', hreflang: 'ja',      file: join(ROOT, 'site/ja/index.html') },
  { key: 'zh', hreflang: 'zh-Hant', file: join(ROOT, 'site/zh/index.html') },
];
const fails = [];
const ok  = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };
const read = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : '');
/* 先剝掉註解再切區塊。反向測試（2026-09-04 T3）抓到的恆真：.nav__langmenu 區塊內的說明註解
   本身含有「visibility:hidden」字樣，/visibility:\s*hidden/ 對著註解也 match，宣告拿掉了 gate 照樣綠。
   宣告要用 [;{\s]visibility:\s*hidden\s*; 的形式比對，註解裡的散文不會長這樣。 */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const cssBlock = (css, selector) => {
  const clean = stripComments(css);
  const i = clean.indexOf(selector + ' {');
  if (i < 0) return null;
  return clean.slice(i, clean.indexOf('}', i));
};
const hasDecl = (block, prop, value) => new RegExp(`[;{\\s]${prop}\\s*:\\s*${value}\\s*;`).test(block);

console.log('▶ [產物] skip link 必須是 <body> 後第一個元素，且落點 <main id="main" tabindex="-1"> 存在');
for (const p of PAGES) {
  const html = read(p.file);
  if (!html) { bad(`${p.key}: 檔不存在`); continue; }
  const m = html.match(/<body[^>]*>\s*<([a-z]+)[^>]*class="([^"]*)"[^>]*href="([^"]*)"[^>]*>([^<]*)</i);
  if (!m || m[1] !== 'a' || !/\bskip-link\b/.test(m[2])) bad(`${p.key}: <body> 後第一個元素不是 a.skip-link`);
  else if (m[3] !== '#main') bad(`${p.key}: skip link href 是 "${m[3]}"，應為 "#main"`);
  else if (!m[4].trim()) bad(`${p.key}: skip link 沒有文字`);
  else ok(`${p.key}: skip link「${m[4].trim()}」→ #main`);
  if (!html.includes('<main id="main" tabindex="-1">')) bad(`${p.key}: 缺 <main id="main" tabindex="-1">（skip link 沒有落點）`);
}

console.log('\n▶ [產物] 每個 card__jp 都要有 lang="ja"（內容來自 work-copy.json，三語皆日文）');
for (const p of PAGES) {
  const html = read(p.file);
  const all = (html.match(/<span class="card__jp"[^>]*>/g) || []);
  const withLang = all.filter((t) => /\slang="ja"/.test(t)).length;
  if (all.length < 16) bad(`${p.key}: 只有 ${all.length} 個 card__jp（預期 ≥16，prerender 沒跑？）`);
  else if (withLang !== all.length) bad(`${p.key}: ${all.length} 個 card__jp 只有 ${withLang} 個標了 lang="ja"`);
  else ok(`${p.key}: ${all.length} 個 card__jp 全部 lang="ja"`);
}

console.log('\n▶ [產物] 語言選單：目前語言恰好一個 aria-current="true"，且指向本頁語言');
for (const p of PAGES) {
  const html = read(p.file);
  const items = html.match(/<a role="menuitem"[^>]*>/g) || [];
  const cur = items.filter((t) => /aria-current="true"/.test(t));
  if (items.length !== 3) { bad(`${p.key}: 語言選單有 ${items.length} 個 menuitem，預期 3`); continue; }
  if (cur.length !== 1) { bad(`${p.key}: aria-current="true" 有 ${cur.length} 個，預期恰好 1`); continue; }
  const hl = (cur[0].match(/hreflang="([^"]+)"/) || [])[1];
  if (hl !== p.hreflang) bad(`${p.key}: aria-current 落在 hreflang="${hl}"，應為 "${p.hreflang}"`);
  else if (!/\bis-active\b/.test(cur[0])) bad(`${p.key}: aria-current 與 is-active 不在同一個連結上`);
  else ok(`${p.key}: aria-current="true" 在 hreflang="${hl}"，與 is-active 一致`);
}

console.log('\n▶ [CSS] 語言選單關閉時必須 visibility:hidden（opacity:0 不會移出 Tab 序列）');
{
  const css = read(join(ROOT, 'site/css/site.css'));
  const closed = cssBlock(css, '.nav__langmenu');
  const open = cssBlock(css, '.nav__lang.is-open .nav__langmenu');
  if (!closed) bad('找不到 .nav__langmenu 區塊');
  else if (!hasDecl(closed, 'visibility', 'hidden')) bad('.nav__langmenu 關閉狀態缺 visibility: hidden —— 三個連結仍可被 Tab 到');
  else if (!/visibility\s+0s\s+linear\s+\.3s/.test(closed)) bad('.nav__langmenu 的 transition 缺 visibility 延遲 —— 會在淡出前瞬間消失');
  else ok('.nav__langmenu 關閉：visibility hidden + 延遲 .3s');
  if (!open) bad('找不到 .nav__lang.is-open .nav__langmenu 區塊');
  else if (!hasDecl(open, 'visibility', 'visible')) bad('.is-open 狀態缺 visibility: visible —— 打開後也看不見');
  else ok('.nav__langmenu 開啟：visibility visible');
  const sk = cssBlock(css, '.skip-link'), skf = cssBlock(css, '.skip-link:focus');
  if (!sk || !hasDecl(sk, 'opacity', '0')) bad('.skip-link 缺閒置時 opacity:0（會常駐在畫面上）');
  else if (!skf || !hasDecl(skf, 'opacity', '1')) bad('.skip-link:focus 缺 opacity:1（聚焦時看不到）');
  else ok('.skip-link 閒置隱藏、聚焦顯示');
}

console.log('\n▶ [原始碼] site.js / work-modal.js / i18n：aria-invalid、menuLabel、執行期 lang="ja"');
{
  const js = read(join(ROOT, 'site/js/site.js'));
  const checks = [
    ["input.setAttribute('aria-invalid', bad ? 'true' : 'false')", '表單驗證未設 aria-invalid'],
    ["setAttribute('aria-describedby', 'f-note')", '必填欄位未 aria-describedby → #f-note'],
    ['UI.menuLabel', '行動導覽按鈕 aria-label 未走 UI.menuLabel'],
    ['class="index-row__jp jp-accent"${jaLang(w.jp)}', 'index-row__jp 未經 jaLang 標 lang'],
    ['class="method-step__jp jp-accent"${jaLang(m.jp)}', 'method-step__jp 未經 jaLang 標 lang'],
  ];
  for (const [needle, msg] of checks) js.includes(needle) ? ok(`site.js: ${needle.slice(0, 48)}`) : bad(`site.js: ${msg}`);
  const wm = read(join(ROOT, 'site/js/work-modal.js'));
  wm.includes("els.jp.lang = 'ja'") ? ok('work-modal.js: els.jp.lang 依假名設定') : bad('work-modal.js: modal 的 jp 未設 lang');
  for (const l of ['en', 'ja', 'zh']) {
    const t = read(join(ROOT, `site/js/i18n/${l}.js`));
    const m = t.match(/menuLabel:\s*'([^']*)'/);
    if (!m || !m[1].trim()) bad(`i18n/${l}.js: 缺 ui.menuLabel`); else ok(`i18n/${l}.js: menuLabel「${m[1]}」`);
  }
}

console.log('');
if (fails.length) { console.error(`❌ audit-a11y — ${fails.length} 項失敗`); process.exit(2); }
console.log('✅ audit-a11y — skip link · card__jp lang · aria-current · langmenu visibility · aria-invalid · menuLabel 全部到位');
