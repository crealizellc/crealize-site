#!/usr/bin/env node
/* ============================================================
   prerender-work.mjs — 把 Selected Work 的 16 張卡片靜態寫進三語 HTML。

   為什麼需要：#work-cards 原本在原始 HTML 裡只有一行註解，16 個產品與全部文案
   都是 work-v3.js 在瀏覽器裡才生出來的。Google 會執行 JS 所以還索引得到，但
   **GPTBot / ClaudeBot / PerplexityBot 這類 AI 爬蟲通常不執行 JavaScript** ——
   對它們來說整個作品集只剩 JSON-LD 與 llms.txt 的一行摘要，真正的內容看不到。
   （2026-08-09 實查線上版：每個產品名在 HTML 裡只出現 1 次，而那 1 次在 JSON-LD 裡。）

   做法：用 headless Chrome 載入剛 build 出來的頁面，等 work-v3.js 跑完，
   把 #work-cards 的 innerHTML 取回來寫進檔案。**模板只有一份** ——
   靜態版與動態版由同一段 cardHTML 產生，不可能分岔。
   work-v3.js 那端加了守衛：發現已經有 .card 就不重畫。

   由 build-site.mjs 在產生三語頁之後自動呼叫；也可單獨跑。
   ============================================================ */
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attach, listPages } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean).find((p) => existsSync(p));
const CHROME_PROCESS_FLAGS = process.env.CHROME_SINGLE_PROCESS === '1' ? ['--single-process', '--no-zygote'] : [];
if (!CHROME) {
  console.error('❌ prerender-work：找不到 Chrome —— 環境問題，不是內容問題');
  process.exit(2);
}

const PAGES = [
  { key: 'en', file: 'site/index.html' },
  { key: 'ja', file: 'site/ja/index.html' },
  { key: 'zh', file: 'site/zh/index.html' },
];
/* 錨定 builder 放的佔位註解，不用「配對到第一個 </div>」那種寫法 ——
   卡片內含巢狀 div，非貪婪比對會咬到第一個內層 </div>，重跑就把 HTML 切壞。
   管線一律是 build-site → prerender，所以進來時必定是剛產生的佔位版；
   若已經是 prerender 過的（沒有佔位註解但有卡片），視為完成、不重複處理。 */
const PLACEHOLDER_RE = /<!--\s*\d*\s*product cards injected by work-v3\.js\s*-->/;
const PORT = Number(process.env.PRERENDER_PORT || 9338);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox',
  ...CHROME_PROCESS_FLAGS,
  '--hide-scrollbars', '--window-size=1440,1200',
  '--user-data-dir=' + join(ROOT, '.chrome-shoot-profile'), 'about:blank',
], { stdio: 'ignore' });

let failed = 0;
try {
  let up = false;
  for (let i = 0; i < 80; i++) { try { await listPages(PORT); up = true; break; } catch { await sleep(250); } }
  if (!up) throw new Error(`Chrome 沒有在 ${PORT} 開出 CDP 端點`);

  for (const p of PAGES) {
    const path = join(ROOT, p.file);
    const target = (await listPages(PORT)).find((x) => x.type === 'page');
    const s = await attach(target);
    await s.navigate(`file://${path}`);

    /* 輪詢到卡片真的生出來為止，不要用固定等待 —— 固定等待在機器忙的時候會
       靜默取回空字串，然後把空的 prerender 寫進檔案，比不 prerender 更糟。 */
    let html = '';
    for (let i = 0; i < 40; i++) {
      await sleep(250);
      html = await s.evaluate(() => {
        const h = document.getElementById('work-cards');
        if (!h) return '';
        return h.querySelectorAll('.card').length ? h.innerHTML : '';
      });
      if (html) break;
    }
    s.close();

    if (!html) {
      console.error(`❌ prerender-work ${p.key}：等不到卡片渲染，拒絕寫入空內容`);
      failed++;
      continue;
    }

    const src = readFileSync(path, 'utf8');
    if (!PLACEHOLDER_RE.test(src)) {
      if (src.includes('class="card work-card"')) {
        console.log(`   · ${p.key}: 已經是 prerender 過的頁面，略過`);
        continue;
      }
      console.error(`❌ prerender-work ${p.key}：找不到 #work-cards 的佔位註解`);
      failed++;
      continue;
    }
    writeFileSync(path, src.replace(PLACEHOLDER_RE, () => '\n' + html + '\n'));

    const cards = (html.match(/class="card work-card"/g) || []).length;
    console.log(`   ✓ ${p.key}: ${cards} 張卡片已靜態寫入（+${(html.length / 1024).toFixed(1)} KB）`);
  }
} finally {
  chrome.kill();
}

if (failed) {
  console.error(`❌ prerender-work — ${failed} 個語系失敗`);
  process.exit(2);
}
console.log('✅ prerender-work — 三語 Selected Work 已進入原始 HTML（AI 爬蟲不執行 JS 也讀得到）');
