#!/usr/bin/env node
/* ============================================================
   audit-links.mjs — 產品對外連結必須真的通、且真的是那個產品。

   2026-09-04 之前 16 個產品沒有任何對外連結（work-v3.js href 數 0）。加了 registry 的
   url 欄位後，這支在部署前逐一打真實 URL：HTTP 200、且回應本文含產品名（不分大小寫）。
   只回 200 不夠 —— 網域到期會被停車頁接管、子網域會被別的 worker 接走，那也是 200。

   需要網路，所以不進 check:all（其他 audit 全部離線）；掛在 deploy-gh.sh 與 check:links。
   三語 i18n 的 url 必須一致（同一產品不會因語言而住在不同網址）。
   ============================================================ */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const load = (l) => new Function('window', readFileSync(join(ROOT, `site/js/i18n/${l}.js`), 'utf8') + ';return window.CRZ_I18N;')({});
const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };

const en = load('en'), ja = load('ja'), zh = load('zh');
console.log('▶ 三語 registry 的 url 欄位必須一致');
en.work.forEach((w, i) => {
  const u = [w.url, ja.work[i]?.url, zh.work[i]?.url];
  if (new Set(u.map((x) => x || '')).size !== 1) bad(`${w.name}: en/ja/zh 的 url 不一致 → ${u.join(' | ')}`);
});
if (!fails.length) ok('16 個產品三語 url 一致');

console.log('\n▶ 每個 url：https、HTTP 200、本文含產品名');
const withUrl = en.work.filter((w) => w.url);
const without = en.work.filter((w) => !w.url).map((w) => w.name);
console.log(`   （${withUrl.length} 個有連結；無連結：${without.join('、') || '無'}）`);
for (const w of withUrl) {
  if (!/^https:\/\//.test(w.url)) { bad(`${w.name}: 非 https → ${w.url}`); continue; }
  let res, body = '';
  try {
    res = await fetch(w.url, { redirect: 'follow', headers: { 'user-agent': 'crealize-site audit-links' }, signal: AbortSignal.timeout(20000) });
    body = await res.text();
  } catch (e) { bad(`${w.name}: ${w.url} 連不上 —— ${e.message}`); continue; }
  if (res.status !== 200) { bad(`${w.name}: ${w.url} → HTTP ${res.status}`); continue; }
  const needle = w.name.replace(/\s+/g, '').toLowerCase();
  const hay = body.replace(/\s+/g, '').toLowerCase();
  if (!hay.includes(needle)) { bad(`${w.name}: ${w.url} 回 200 但本文找不到「${w.name}」—— 可能被停車頁／別的服務接管`); continue; }
  ok(`${w.name.padEnd(12)} ${w.url}`);
}

console.log('');
if (fails.length) { console.error(`❌ audit-links — ${fails.length} 項失敗`); process.exit(2); }
console.log(`✅ audit-links — ${withUrl.length} 個產品連結皆 200 且本文含產品名`);
