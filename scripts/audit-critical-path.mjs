#!/usr/bin/env node
/* ============================================================
   audit-critical-path.mjs — 首屏成本守門：三語頁的 <head> 不得讓
   Google Fonts 擋住首次繪製，且 logo <img> 不得回到過大的 PNG。

   為什麼要有這支：2026-09-04 之前，head 裡是一條普通的
   `<link rel="stylesheet" href="fonts.googleapis.com/...">`，把五個
   字體家族綁在一起。其中 Noto Sans JP 一家就是 344KB CSS / 372 個
   @font-face（其餘四家合計 15KB）—— 瀏覽器必須把 372 條 unicode-range
   全解析完才畫得出第一個字。實測（Lighthouse 12.8.2, mobile, 同一台
   機器同一個本機 server）：

       改前  performance 60   FCP 6.5s  LCP 7.4s   render-blocking 5,125ms
       改後  performance 93   FCP 1.7s  LCP 2.9s   render-blocking   235ms

   改法是把它拆成兩條、都用 media="print" + onload 移出關鍵路徑，
   並留 <noscript> 給無 JS 環境。字體最終仍全部載入（改前改後
   document.fonts 都是 405 faces / 5 個家族 / 各元素 computed
   font-family 逐項相同），所以視覺不變。

   這支存在的唯一理由：那個修正沒有任何東西守著。build-site.mjs 的
   head 區塊是純字串模板，任何一次從 Claude Design 重新 export、或
   有人「順手把兩條 link 合回一條比較整齊」，都會把 5 秒加回去，
   而六道既有 gate 沒有一道會發現 —— 它們測的是「執行 JS 之後」的
   DOM 與版面，那時字體早就載完了，一切看起來都正常。

   反向測試（證明它真的在守，不是恆真）：
     把 build-site.mjs 的兩條 link 改回單一 rel="stylesheet"，重跑
     build，這支必須 exit 2。
   ============================================================ */
import { readFileSync, existsSync } from 'node:fs';
import { webpSize } from './audit-kv.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = [
  { key: 'en', file: join(ROOT, 'site/index.html') },
  { key: 'ja', file: join(ROOT, 'site/ja/index.html') },
  { key: 'zh', file: join(ROOT, 'site/zh/index.html') },
];

const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };

/* 只取 <head>，且把 <noscript> 整段挖掉再驗 —— noscript 裡本來就
   放阻擋式 link，那是刻意的 fallback，不該被當成違規。 */
function headWithoutNoscript(html) {
  const head = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];
  return head.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '');
}

console.log('▶ Google Fonts 不得進入關鍵渲染路徑（三語頁）');

for (const p of PAGES) {
  if (!existsSync(p.file)) { bad(`${p.key}: 檔不存在 ${p.file}`); continue; }
  const html = readFileSync(p.file, 'utf8');
  const head = headWithoutNoscript(html);

  /* 只抓真正的字體 stylesheet（href 含 /css）—— preconnect 的 href 是裸網域
     `https://fonts.googleapis.com`，不含 /css，不該被當成阻擋來源。 */
  const gfLinks = (head.match(/<link[^>]*>/gi) || []).filter((l) => /fonts\.googleapis\.com\/css/i.test(l));
  if (gfLinks.length === 0) { bad(`${p.key}: head 裡找不到 Google Fonts link`); continue; }

  /* 1) 每一條都必須是非阻擋：media="print" 且有 onload 把它切回 all。
        少了 onload 就永遠只在列印時套用 —— 那不是最佳化，是壞掉。 */
  const blocking = gfLinks.filter((l) => !/media\s*=\s*["']print["']/i.test(l) || !/onload\s*=/i.test(l));
  if (blocking.length === 0) {
    ok(`${p.key}: ${gfLinks.length} 條 Google Fonts link 皆非阻擋（media=print + onload）`);
  } else {
    bad(`${p.key}: ${blocking.length} 條 Google Fonts link 會擋住首次繪製 —— ${blocking[0].slice(0, 110)}…`);
  }

  /* 2) Noto Sans JP（372 faces / 344KB）必須與拉丁字體分屬不同 link。
        綁在一起時，日文那 372 條 unicode-range 會連帶拖住拉丁字體。 */
  const mixed = gfLinks.filter((l) => /Noto\+Sans\+JP/i.test(l) && /(Space\+Grotesk|Bricolage|Newsreader|Space\+Mono)/i.test(l));
  if (mixed.length === 0) ok(`${p.key}: Noto Sans JP 與拉丁字體分屬不同 link`);
  else bad(`${p.key}: Noto Sans JP 與拉丁字體綁在同一條 link —— 372 條 unicode-range 會拖住拉丁字體`);

  /* 3) 無 JS 環境要有 fallback，否則關掉 JS 的人拿不到任何 webfont。 */
  const ns = (html.match(/<noscript>[\s\S]*?<\/noscript>/gi) || []).join('');
  if (/fonts\.googleapis\.com/i.test(ns)) ok(`${p.key}: <noscript> 保留了無 JS 環境的字體 fallback`);
  else bad(`${p.key}: 缺 <noscript> 字體 fallback —— 關掉 JS 就完全拿不到 webfont`);

  /* 4) preconnect 兩條都要在，否則非阻擋反而更慢（連線要重新協商）。 */
  const pc = (head.match(/<link[^>]*rel\s*=\s*["']preconnect["'][^>]*>/gi) || []).join('');
  const hasApi = /fonts\.googleapis\.com/.test(pc);
  const hasStatic = /fonts\.gstatic\.com/.test(pc) && /crossorigin/i.test(pc);
  if (hasApi && hasStatic) ok(`${p.key}: preconnect 到 googleapis + gstatic(crossorigin) 都在`);
  else bad(`${p.key}: preconnect 不完整（googleapis=${hasApi} gstatic+crossorigin=${hasStatic}）`);
}

/* ---- logo <img>：格式與內在尺寸 ----
   2026-09-04 之前兩處 logo 都指向 480×383 的 PNG（41,366 B），但 CSS 只畫
   21px（nav）／26px（footer）高 —— 像素密度 18x／15x，面積過剩約 200 倍。
   換成 120×96 的 WebP（1,940 B，-95.3%）後密度降到 4.6x／3.7x，仍高於 3x
   retina 所需；同時補上 width/height 讓瀏覽器能預留空間。
   線上 Lighthouse 實測：unsized-images 50→100、modern-image-formats 0→100、
   CLS 0.002→0、TBT 130ms→0ms。
   favicon / apple-touch-icon / JSON-LD 仍用 PNG，這裡刻意不檢查它們。 */
console.log('');
console.log('▶ logo <img> 必須是 WebP 且帶內在尺寸');

for (const p of PAGES) {
  if (!existsSync(p.file)) continue;
  const html = readFileSync(p.file, 'utf8');
  const imgs = html.match(/<img[^>]*class="(?:nav|foot)__logo"[^>]*>/gi) || [];

  if (imgs.length !== 2) {
    bad(`${p.key}: 預期 2 個 logo <img>（nav + footer），實際 ${imgs.length} 個`);
    continue;
  }

  const png = imgs.filter((t) => /src="[^"]*\.png"/i.test(t));
  if (png.length === 0) ok(`${p.key}: 2 個 logo <img> 都不是 PNG`);
  else bad(`${p.key}: ${png.length} 個 logo <img> 仍指向 PNG —— 41KB 換 1.9KB 的差別`);

  const unsized = imgs.filter((t) => !/\swidth="\d+"/i.test(t) || !/\sheight="\d+"/i.test(t));
  if (unsized.length === 0) ok(`${p.key}: 2 個 logo <img> 都有 width/height（無版面跳動風險）`);
  else bad(`${p.key}: ${unsized.length} 個 logo <img> 缺 width/height —— 圖片抵達前無法預留空間`);
}

/* ---- 產品 icon：屬性尺寸必須等於檔案真實尺寸 ----
   `ICON_PX`（build-kv-assets.mjs）與 `width`/`height`（gen-work-v3.mjs）是兩個檔案裡
   的同一個數字，改了一邊忘了另一邊，瀏覽器就會拿錯誤的比例預留空間，而且沒有任何
   既有 gate 會發現。這裡不比對那兩個常數，直接比對**最終事實**：HTML 寫的尺寸
   vs WebP 檔頭讀出來的尺寸。
   2026-09-04：256² 降到 144²（.stage__icon 的顯示尺寸是固定 46px，144² 給 3.13x，
   完整覆蓋 3x retina）。16 張合計 66,870 B → 35,752 B（-46%）。 */
console.log('');
console.log('▶ 產品 icon 的屬性尺寸必須等於檔案真實尺寸');

{
  const html = existsSync(PAGES[0].file) ? readFileSync(PAGES[0].file, 'utf8') : '';
  const tags = html.match(/<img[^>]*class="stage__icon"[^>]*>/gi) || [];
  if (tags.length === 0) {
    bad('en: 找不到任何 stage__icon —— work-v3 的卡片沒被 prerender 進靜態 HTML？');
  } else {
    let mismatch = 0, missing = 0, checked = 0;
    for (const t of tags) {
      const src = (t.match(/src="([^"]+)"/) || [])[1];
      const w = Number((t.match(/\swidth="(\d+)"/) || [])[1]);
      const h = Number((t.match(/\sheight="(\d+)"/) || [])[1]);
      if (!src || !w || !h) { missing++; continue; }
      const file = join(ROOT, 'site', src.replace(/^\.\.\//, ''));
      if (!existsSync(file)) { missing++; continue; }
      const real = webpSize(readFileSync(file));
      checked++;
      if (real.w !== w || real.h !== h) {
        bad(`${src.split('/').pop()}: HTML 寫 ${w}×${h}，檔案其實是 ${real.w}×${real.h}`);
        mismatch++;
      }
    }
    if (missing) bad(`${missing} 個 stage__icon 缺 src／width／height，或檔案不存在`);
    if (!mismatch && !missing) ok(`${checked} 個產品 icon 的屬性尺寸與檔案真實尺寸相符`);
  }
}

console.log('');
if (fails.length) {
  console.error(`❌ audit-critical-path — ${fails.length} 項失敗`);
  process.exit(2);
}
console.log('✅ audit-critical-path — Google Fonts 在關鍵路徑之外、logo 為帶尺寸的 WebP、產品 icon 尺寸名實相符');
