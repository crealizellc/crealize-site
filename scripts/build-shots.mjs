#!/usr/bin/env node
/* ============================================================
   build-shots — 把本機直立產品截圖轉成站上要用的 webp

   為什麼需要這個：Work v3 的卡片在角落放一支手機，框是 9:19.5（0.4615）。
   `site/assets/kv/*.webp` 是 1600×1200 的**橫向**主視覺海報，塞進直立框裡
   object-fit:cover 會把中間以外全裁掉 —— 2026-08-09 實拍到「s, filed by」
   「ted packets on-chain」這種被切一半的字，看起來像破圖。
   canvas 原檔用的是 `shots/<slug>.png`，也就是**直立截圖**，本機在
   `site-assets/shots/` 就有，長寬比實測 0.460–0.462，與框幾乎完全吻合。

   用法：node scripts/build-shots.mjs
   輸出：site/assets/shots/<slug>.webp（寬 480，足夠 3x；卡片上實際只有約 92 CSS px）
   退出：0 成功 / 2 缺素材或缺 cwebp
   ============================================================ */
import { readdirSync, existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'site-assets/shots');
const OUT = join(ROOT, 'site/assets/shots');

/** 需要手機縮圖的產品 = Work v3 的 12 個產品扣掉 meguru（nophone 版型）。 */
const SLUGS = [
  'puritylens', 'fudeto', 'kichitto', 'qiflux', 'meishitto', 'rythix2048',
  'tendo', 'xunni', 'moonpacket', 'idokuta', 'mairi',
];

const WIDTH = 480;
const FRAME_RATIO = 9 / 19.5;   // .stage__phone 的 aspect-ratio
const CROP_WARN = 0.10;         // 置中裁切掉超過一成就值得回頭挑更合適的原圖

try {
  execFileSync('cwebp', ['-version'], { stdio: 'ignore' });
} catch {
  console.error('❌ 找不到 cwebp（brew install webp）');
  process.exit(2);
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const missing = SLUGS.filter((s) => !existsSync(join(SRC, `${s}.png`)));
if (missing.length) {
  console.error(`❌ site-assets/shots/ 缺這些產品的截圖：${missing.join(', ')}`);
  process.exit(2);
}

let warned = 0;
for (const slug of SLUGS) {
  const src = join(SRC, `${slug}.png`);
  const dst = join(OUT, `${slug}.webp`);

  const dims = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', src], { encoding: 'utf8' });
  const w = Number(/pixelWidth:\s*(\d+)/.exec(dims)?.[1]);
  const h = Number(/pixelHeight:\s*(\d+)/.exec(dims)?.[1]);
  const ratio = w / h;

  // 先在這裡置中裁到框的長寬比，而不是把不合的圖丟給瀏覽器讓 object-fit:cover
  // 隨便裁。原本只是 console.warn（不擋），mairi 0.500 就這樣一路過關到線上。
  let cw = w, ch = h;
  if (ratio > FRAME_RATIO) cw = Math.round(h * FRAME_RATIO);   // 太寬 → 裁左右
  else if (ratio < FRAME_RATIO) ch = Math.round(w / FRAME_RATIO); // 太高 → 裁上下
  const lost = 1 - (cw * ch) / (w * h);
  if (lost > CROP_WARN) {
    console.warn(`⚠️  ${slug} 原圖 ${ratio.toFixed(3)} 與框 ${FRAME_RATIO.toFixed(3)} 差距大，置中裁掉 ${(lost * 100).toFixed(1)}% —— 建議換張更合適的原圖`);
    warned++;
  }

  // 暫存放系統 tmp，不放 site/ —— 放 site/ 的 dotfile 會被 deploy gate 擋下部署
  const cropped = join(tmpdir(), `crz-shot-${slug}.png`);
  execFileSync('sips', ['-c', String(ch), String(cw), src, '--out', cropped], { stdio: 'ignore' });
  try {
    execFileSync('cwebp', ['-q', '86', '-resize', String(WIDTH), '0', '-quiet', cropped, '-o', dst]);
  } finally {
    rmSync(cropped, { force: true });
  }
  const kb = (statSync(dst).size / 1024).toFixed(1);
  console.log(`   ✓ ${slug.padEnd(12)} ${w}×${h} (${ratio.toFixed(3)}) → 裁 ${cw}×${ch} → ${WIDTH}px webp, ${kb} KB${lost > 0.001 ? `（裁掉 ${(lost * 100).toFixed(1)}%）` : ''}`);
}

const total = readdirSync(OUT).filter((f) => f.endsWith('.webp')).length;
console.log(`✅ site/assets/shots — ${total} 張${warned ? `（${warned} 張長寬比警告）` : ''}`);
