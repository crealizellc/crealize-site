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

console.log('\n▶ [產物] card__jp 的 lang="ja" 必須與內容一致：含假名者必標，不含者不得標');
const KANA = /[\u3040-\u30ff]/;
for (const p of PAGES) {
  const html = read(p.file);
  const all = [...html.matchAll(/<span class="card__jp"([^>]*)>([^<]*)<\/span>/g)];
  if (all.length < 16) { bad(`${p.key}: 只有 ${all.length} 個 card__jp（預期 ≥16，prerender 沒跑？）`); continue; }
  const wrong = all.filter(([, attrs, txt]) => KANA.test(txt) !== /\slang="ja"/.test(attrs));
  const ja = all.filter(([, attrs]) => /\slang="ja"/.test(attrs)).length;
  if (wrong.length) bad(`${p.key}: ${wrong.length} 個 card__jp 的 lang 與內容不符，例：「${wrong[0][2].slice(0, 16)}」`);
  else ok(`${p.key}: ${all.length} 個 card__jp，${ja} 個含假名且標 lang="ja"，其餘不標`);
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

/* ---- 韌性與狀態一致（2026-09-04 第二批）----
   無 JS 表單 / 三語 404 / reduced-motion 的假提示 / atmosphere resize 順序。
   前兩項讀產物，後兩項讀原始碼（標「[原始碼]」）。 */
console.log('\n▶ [產物] 無 JS 時表單要有出路：action=mailto + method=post + <noscript> 說明');
for (const p of PAGES) {
  const html = read(p.file);
  const form = (html.match(/<form[^>]*id="join-form"[^>]*>/) || [''])[0];
  if (!/action="mailto:support@crealize\.llc"/.test(form) || !/method="post"/.test(form) || !/enctype="text\/plain"/.test(form))
    bad(`${p.key}: <form> 缺 action=mailto / method=post / enctype=text/plain（無 JS 送出會吞掉輸入）`);
  else if (!/<noscript><p class="join__formnote">[^<]{10,}<\/p><\/noscript>/.test(html)) bad(`${p.key}: 表單缺 <noscript> 說明`);
  else ok(`${p.key}: 無 JS 送出 → 開郵件程式，並有 noscript 說明`);
}

console.log('\n▶ [產物] 404 三語同檔：三個 lang 段落 + 依路徑切換 + noscript 全顯');
{
  const html = read(join(ROOT, 'site/404.html'));
  const segs = ['en', 'ja', 'zh'].filter((l) => new RegExp(`<p lang="(en|ja|zh-Hant)" data-l="${l}"`).test(html));
  if (segs.length !== 3) bad(`404.html 只有 ${segs.length}/3 個語言段落`);
  else if (!/location\.pathname/.test(html) || !/documentElement\.lang/.test(html)) bad('404.html 缺依路徑切換 <html lang> 的腳本');
  else if (!/<noscript><style>p\[data-l\]\{display:block\}<\/style><\/noscript>/.test(html)) bad('404.html 無 JS 時不會三段全顯');
  else if (!/href="\/ja\/"/.test(html) || !/href="\/zh\/"/.test(html)) bad('404.html 的 ja/zh 段落沒有指回各自語言首頁');
  else ok('404.html 三語段落、路徑切換、noscript fallback 齊備');
}

console.log('\n▶ [原始碼] hero.js：reduced-motion 下不得顯示「Scroll to materialize」');
{
  const js = read(join(ROOT, 'site/js/hero.js'));
  js.includes('if (prefersReduced) scrollLabel.hidden = true;') ? ok('hero.js: prefersReduced → scrollLabel.hidden') : bad('hero.js: reduced-motion 下 scroll 提示仍會顯示（p 恆為 1，提示永久為假）');
}
console.log('\n▶ [原始碼] atmosphere.js：resize 後重播種必須接著重繪，且只有一條重播種監聽');
{
  const js = read(join(ROOT, 'site/js/atmosphere.js'));
  const seedListeners = (js.match(/addEventListener\('resize', \(\) => \{\s*seedRibbons\(\); seedMotes\(\);/g) || []).length;
  if (seedListeners !== 1) bad(`atmosphere.js: 重播種的 resize 監聽有 ${seedListeners} 條，預期 1`);
  else if (!/seedRibbons\(\); seedMotes\(\);\s*if \(prefersReduced\) render\(0\);/.test(js)) bad('atmosphere.js: 重播種後沒有在 reduced 下重繪（新種子要等下一次 resize）');
  else if (/ctx\.setTransform\(DPR, 0, 0, DPR, 0, 0\);\s*if \(prefersReduced\) render\(0\);/.test(js)) bad('atmosphere.js: resize() 內仍先用舊種子 render(0)');
  else ok('atmosphere.js: resize → seed → render 單一順序');
}

console.log('\n▶ [原始碼] work-modal.js：有 url 才顯示對外連結，新分頁 + noopener；i18n 三語有 ctaLabel');
{
  const wm = read(join(ROOT, 'site/js/work-modal.js'));
  const need = [
    ['<a class="btn btn--accent work-modal__cta" target="_blank" rel="noopener" hidden></a>', 'modal 模板缺 CTA 連結（或缺 target/rel/hidden 預設）'],
    ["cta: modal.querySelector('.work-modal__cta'),", 'els.cta 未接線'],
    ['if (w.url) {', 'CTA 沒有依 url 有無切換'],
    ["els.cta.hidden = true;\n      els.cta.removeAttribute('href');", '無 url 時沒有隱藏並移除 href'],
  ];
  for (const [n, msg] of need) wm.includes(n) ? ok(`work-modal.js: ${n.slice(0, 44)}`) : bad(`work-modal.js: ${msg}`);
  for (const l of ['en', 'ja', 'zh']) {
    const t = read(join(ROOT, `site/js/i18n/${l}.js`));
    const m = t.match(/ctaLabel:\s*'([^']*)'/);
    if (!m || !m[1].trim()) bad(`i18n/${l}.js: 缺 ui.ctaLabel`); else ok(`i18n/${l}.js: ctaLabel「${m[1]}」`);
  }
}

console.log('');
if (fails.length) { console.error(`❌ audit-a11y — ${fails.length} 項失敗`); process.exit(2); }
console.log('✅ audit-a11y — 六項 a11y 修正 + 無 JS 表單 · 三語 404 · reduced 假提示 · resize 順序 全部到位');
