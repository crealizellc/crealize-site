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
import { readdirSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
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
const RATIO_TOL = 0.06;         // 超過就會被 cover 裁掉可見的量，值得警告

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
  if (Math.abs(ratio - FRAME_RATIO) > RATIO_TOL) {
    console.warn(`⚠️  ${slug} 長寬比 ${ratio.toFixed(3)}（框是 ${FRAME_RATIO.toFixed(3)}）—— cover 會裁掉可見的量，請確認`);
    warned++;
  }

  execFileSync('cwebp', ['-q', '86', '-resize', String(WIDTH), '0', '-quiet', src, '-o', dst]);
  const kb = (statSync(dst).size / 1024).toFixed(1);
  console.log(`   ✓ ${slug.padEnd(12)} ${w}×${h} (${ratio.toFixed(3)}) → ${WIDTH}px webp, ${kb} KB`);
}

const total = readdirSync(OUT).filter((f) => f.endsWith('.webp')).length;
console.log(`✅ site/assets/shots — ${total} 張${warned ? `（${warned} 張長寬比警告）` : ''}`);
