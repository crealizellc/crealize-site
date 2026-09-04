#!/usr/bin/env node
/* ============================================================
   audit-kv-variants.mjs — 800×600 響應式變體的可執行檢查

   母版（site/assets/kv/，1600×1200）由 audit-kv.mjs 的 SPEC 守；變體放在
   site/assets/kv-800/，SPEC 掃不到它 —— **掃不到不是合格**，所以這支專門守它：
   1. 每個 registry 產品都有變體檔，WebP 檔頭讀出來恰是 800×600、4:3
   2. 變體位元必須小於母版（否則變體沒有存在理由）
   3. 三語靜態 HTML 的每個 stage__bg：srcset 同時列出 800w 變體與 1600w 母版、
      sizes 與 sections.css 的欄數斷點一致、src 仍指母版（不支援 srcset 的環境行為不變）
   4. 母版目錄不得混入非母版檔（防有人把變體丟錯目錄）
   反向測試：刪一個變體 / 把變體改成別的尺寸 / 拿掉 srcset → 本檔 exit 2。
   ============================================================ */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webpSize } from './audit-kv.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VAR_W = 800, VAR_H = 600;
const SIZES = '(min-width: 1101px) 29vw, (min-width: 641px) 44.5vw, 90vw';
const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };
const reg = new Function('window', readFileSync(join(ROOT, 'site/js/i18n/en.js'), 'utf8') + ';return window.CRZ_I18N;')({}).work;
const slugOf = (w) => w.img.replace(/.*\//, '').replace('.webp', '');

console.log('▶ 每個產品的 800×600 變體：存在、尺寸正確、位元小於母版');
let totalMaster = 0, totalVar = 0;
for (const w of reg) {
  const s = slugOf(w);
  const master = join(ROOT, 'site/assets/kv', `${s}.webp`);
  const variant = join(ROOT, 'site/assets/kv-800', `${s}.webp`);
  if (!existsSync(variant)) { bad(`${s}: 缺 site/assets/kv-800/${s}.webp`); continue; }
  const dim = webpSize(readFileSync(variant));
  const mb = statSync(master).size, vb = statSync(variant).size;
  totalMaster += mb; totalVar += vb;
  if (dim.w !== VAR_W || dim.h !== VAR_H) { bad(`${s}: 變體尺寸 ${dim.w}×${dim.h}，須為 ${VAR_W}×${VAR_H}`); continue; }
  if (vb >= mb) { bad(`${s}: 變體 ${vb} B ≥ 母版 ${mb} B —— 沒有存在理由`); continue; }
  ok(`${s.padEnd(12)} ${VAR_W}×${VAR_H}  ${String(vb).padStart(6)} B（母版 ${mb} B，${Math.round(100 * vb / mb)}%）`);
}
if (totalMaster) console.log(`   合計：母版 ${totalMaster.toLocaleString()} B → 變體 ${totalVar.toLocaleString()} B（${Math.round(100 * totalVar / totalMaster)}%）`);

console.log('\n▶ 母版目錄只能有 1600×1200 母版（變體丟錯目錄會讓 audit-kv 紅，這裡先講清楚）');
{
  const stray = readdirSync(join(ROOT, 'site/assets/kv')).filter((f) => f.endsWith('.webp')).filter((f) => { const d = webpSize(readFileSync(join(ROOT, 'site/assets/kv', f))); return d.w !== 1600 || d.h !== 1200; });
  stray.length ? bad(`site/assets/kv/ 混入非母版：${stray.join(', ')}`) : ok('site/assets/kv/ 只有 1600×1200 母版');
}

console.log('\n▶ [產物] 三語 stage__bg：srcset 含 800w 變體與 1600w 母版、sizes 對應欄數、src 仍指母版');
for (const [key, file] of [['en', 'site/index.html'], ['ja', 'site/ja/index.html'], ['zh', 'site/zh/index.html']]) {
  const html = readFileSync(join(ROOT, file), 'utf8');
  const imgs = html.match(/<img class="stage__bg"[^>]*>/g) || [];
  if (imgs.length < 16) { bad(`${key}: 只有 ${imgs.length} 個 stage__bg（prerender 沒跑？）`); continue; }
  const badOnes = imgs.filter((t) => {
    const src = (t.match(/\ssrc="([^"]+)"/) || [])[1] || '';
    const srcset = (t.match(/\ssrcset="([^"]+)"/) || [])[1] || '';
    const sizes = (t.match(/\ssizes="([^"]+)"/) || [])[1] || '';
    const variant = src.replace('assets/kv/', 'assets/kv-800/');
    return !src.includes('assets/kv/') || srcset !== `${variant} 800w, ${src} 1600w` || sizes !== SIZES;
  });
  badOnes.length ? bad(`${key}: ${badOnes.length}/${imgs.length} 個 stage__bg 的 srcset/sizes/src 不符，例：${badOnes[0].slice(0, 120)}…`)
                 : ok(`${key}: ${imgs.length} 個 stage__bg 皆 srcset=800w+1600w、sizes 正確、src 指母版`);
}

console.log('');
if (fails.length) { console.error(`❌ audit-kv-variants — ${fails.length} 項失敗`); process.exit(2); }
console.log('✅ audit-kv-variants — 16 個 800×600 變體合格、母版目錄純淨、三語 srcset/sizes 到位');
