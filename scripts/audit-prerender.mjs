#!/usr/bin/env node
/* ============================================================
   audit-prerender.mjs — 不執行 JS，直接讀原始 HTML，驗證
   Selected Work 的內容對不執行 JS 的爬蟲（GPTBot / ClaudeBot / 一般
   curl）真的可見。

   為什麼要有這支：build-site.mjs 每次都整份重寫 index.html，把
   #work-cards 打回一行佔位註解；prerender-work.mjs 必須「之後」再跑一次
   才會把卡片寫回去。這個先後關係只存在於 deploy-gh.sh 的呼叫順序裡，
   沒有任何機制擋著有人單獨跑 build-site.mjs、或调换順序、或忘了跑
   prerender 卻直接 commit——那樣 site/ 在磁碟上看起來正常（三語頁都在、
   六道既有 gate 都測「執行 JS 後」的 DOM，照樣全線）,實際上原始 HTML
   又回到只有一行註解的狀態。這支直接用 curl 等級的純文字擷取來驗，
   不透過瀏覽器，才是爬蟲真正看到的東西。
   ============================================================ */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LOCALES = [
  { key: 'en', file: join(ROOT, 'site/index.html'), probe: 'reads the label and tells you' },
  { key: 'ja', file: join(ROOT, 'site/ja/index.html'), probe: '成分表は規制のために書かれていて' },
  { key: 'zh', file: join(ROOT, 'site/zh/index.html'), probe: '成分表是寫給主管機關看的' },
];
const MIN_CARDS = 16;

const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };

console.log('▶ 不執行 JS 的原始 HTML 必須含完整 Selected Work 內容');
for (const loc of LOCALES) {
  if (!existsSync(loc.file)) { bad(`${loc.key}: 檔不存在 ${loc.file}`); continue; }
  const html = readFileSync(loc.file, 'utf8');

  if (/<!--\s*\d*\s*product cards injected by work-v3\.js\s*-->/.test(html)) {
    bad(`${loc.key}: #work-cards 仍是佔位註解 —— prerender-work.mjs 沒跑，或 build-site.mjs 在它之後又跑了一次`);
    continue;
  }

  const cards = (html.match(/class="card work-card"/g) || []).length;
  if (cards >= MIN_CARDS) ok(`${loc.key}: ${cards} 張卡片在原始 HTML 裡`);
  else bad(`${loc.key}: 原始 HTML 只有 ${cards} 張卡片，預期 ≥${MIN_CARDS}`);

  const details = (html.match(/class="card__detail" hidden/g) || []).length;
  if (details >= MIN_CARDS) ok(`${loc.key}: ${details} 段完整正文在原始 HTML 裡`);
  else bad(`${loc.key}: 只有 ${details} 段完整正文，預期 ≥${MIN_CARDS}（modal 的內容沒有落進靜態 HTML）`);

  // 純文字擷取（去 script/tag），模擬非 headless 的文字爬蟲，確認拿到的不只是 JSON-LD 摘要。
  const text = html.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  if (text.includes(loc.probe)) ok(`${loc.key}: 純文字擷取讀得到完整正文（非 JSON-LD 摘要）`);
  else bad(`${loc.key}: 純文字擷取讀不到完整正文 —— 爬蟲只會看到 JSON-LD 的一句摘要`);
}

console.log();
if (fails.length) {
  console.error(`❌ audit-prerender — ${fails.length} 項未通過`);
  process.exit(2);
}
console.log('✅ audit-prerender — 三語 Selected Work 對不執行 JS 的爬蟲皆可見');
