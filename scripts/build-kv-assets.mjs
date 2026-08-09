#!/usr/bin/env node
/* ============================================================
   build-kv-assets — 把 ChatGPT 生成的主視覺與各產品 app icon 轉成站上資產

   輸入
     site-assets/kv-gen/<slug>.png   ← scripts/gen-kv-chatgpt.mjs 產出（各產品品牌生成圖）
     site-assets/icons/<slug>.png    ← 各產品官方 app icon
   輸出
     site/assets/kv/<slug>.webp      ← 1600×1200（母版規格見 tokens/crealize.tokens.json § keyVisual）
     site/assets/icons/<slug>.webp   ← 256×256

   為什麼沿用 site/assets/kv/ 這個路徑：registry（site/js/i18n/*.js 的 img）、
   audit-kv.mjs 的母版規格、audit-kv-registry.mjs 的三語對帳、deploy-gh.sh 的
   資產位元比對全都指著它。換路徑等於同時動四個地方，沒有好處。

   用法：node scripts/build-kv-assets.mjs
   退出：0 成功 / 2 缺素材或缺 cwebp
   ============================================================ */
import { readdirSync, existsSync, mkdirSync, statSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KV_SRC = join(ROOT, 'site-assets/kv-gen');
const ICON_SRC = join(ROOT, 'site-assets/icons');
const KV_OUT = join(ROOT, 'site/assets/kv');
const ICON_OUT = join(ROOT, 'site/assets/icons');

const SLUGS = [
  'puritylens', 'fudeto', 'kichitto', 'qiflux', 'meishitto', 'rythix2048',
  'tendo', 'xunni', 'moonpacket', 'idokuta', 'mairi', 'meguru',
];

const KV_W = 1600, KV_H = 1200;      // 4:3 母版
const ICON_PX = 256;
const KV_MAX_KB = 200;               // audit-kv.mjs 的上限

try { execFileSync('cwebp', ['-version'], { stdio: 'ignore' }); }
catch { console.error('❌ 找不到 cwebp（brew install webp）'); process.exit(2); }

for (const d of [KV_OUT, ICON_OUT]) if (!existsSync(d)) mkdirSync(d, { recursive: true });

function dims(f) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', f], { encoding: 'utf8' });
  return {
    w: Number(/pixelWidth:\s*(\d+)/.exec(out)?.[1]),
    h: Number(/pixelHeight:\s*(\d+)/.exec(out)?.[1]),
  };
}

/** 置中裁到目標比例後縮放 —— 不裁就縮會變形，交給瀏覽器 cover 又會裁得不受控。 */
function toWebp(src, dst, targetW, targetH, quality) {
  const { w, h } = dims(src);
  const target = targetW / targetH;
  let cw = w, ch = h;
  if (w / h > target) cw = Math.round(h * target);
  else if (w / h < target) ch = Math.round(w / target);

  const tmp = join(tmpdir(), `crz-${Date.now()}-${Math.round(cw)}.png`);
  try {
    execFileSync('sips', ['-c', String(ch), String(cw), src, '--out', tmp], { stdio: 'ignore' });
    execFileSync('sips', ['-z', String(targetH), String(targetW), tmp], { stdio: 'ignore' });
    execFileSync('cwebp', ['-q', String(quality), '-quiet', tmp, '-o', dst]);
  } finally {
    rmSync(tmp, { force: true });
  }
  return { srcW: w, srcH: h, kb: statSync(dst).size / 1024 };
}

const missingKv = SLUGS.filter((s) => !existsSync(join(KV_SRC, `${s}.png`)));
if (missingKv.length) {
  console.error(`❌ site-assets/kv-gen/ 缺這些產品的生成圖：${missingKv.join(', ')}`);
  console.error(`   先跑：node scripts/gen-kv-chatgpt.mjs --only ${missingKv.join(',')}`);
  process.exit(2);
}

console.log('▶ 主視覺 → site/assets/kv/');
for (const slug of SLUGS) {
  const dst = join(KV_OUT, `${slug}.webp`);
  // 從 q=82 起跳，超過上限就降到過為止（母版規格是硬的，畫質是可調的）
  let q = 82, r;
  do {
    r = toWebp(join(KV_SRC, `${slug}.png`), dst, KV_W, KV_H, q);
    q -= 8;
  } while (r.kb > KV_MAX_KB && q >= 50);
  const flag = r.kb > KV_MAX_KB ? ' ⚠️ 仍超過上限' : '';
  console.log(`   ✓ ${slug.padEnd(12)} ${r.srcW}×${r.srcH} → ${KV_W}×${KV_H} q${q + 8}, ${r.kb.toFixed(0)} KB${flag}`);
}

console.log('▶ 產品 icon → site/assets/icons/');
let noIcon = [];
for (const slug of SLUGS) {
  const src = join(ICON_SRC, `${slug}.png`);
  if (!existsSync(src)) { noIcon.push(slug); continue; }
  const r = toWebp(src, join(ICON_OUT, `${slug}.webp`), ICON_PX, ICON_PX, 90);
  console.log(`   ✓ ${slug.padEnd(12)} ${r.srcW}×${r.srcH} → ${ICON_PX}², ${r.kb.toFixed(1)} KB`);
}
if (noIcon.length) console.log(`   ℹ️  無官方 icon（卡片改只顯示名稱）：${noIcon.join(', ')}`);

console.log(`✅ kv ${readdirSync(KV_OUT).filter((f) => f.endsWith('.webp')).length} 張 · icon ${readdirSync(ICON_OUT).filter((f) => f.endsWith('.webp')).length} 張`);
