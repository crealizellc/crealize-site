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
/* 底圖優先用 AI 版（材質與光線是 AI 的強項），沒有就退回程式版。
   這是刻意的備援：ChatGPT 額度會用完、生成也會失敗，但站台不能因此開天窗。 */
const KV_AI = join(ROOT, 'site-assets/kv-ai');
const KV_CODE = join(ROOT, 'site-assets/kv-gen');
const ICON_SRC = join(ROOT, 'site-assets/icons');
const KV_OUT = join(ROOT, 'site/assets/kv');
const ICON_OUT = join(ROOT, 'site/assets/icons');

const SLUGS = [
  'puritylens', 'fudeto', 'kichitto', 'qiflux', 'meishitto', 'rythix2048',
  'tendo', 'xunni', 'moonpacket', 'idokuta', 'mairi', 'meguru', 'ymy', 'kizuki', 'dramaflow', 'todoke',
];

const KV_W = 1600, KV_H = 1200;      // 4:3 母版
/* 144² 而非 256²：卡片上的 .stage__icon 是固定 46px（sections.css，modal 無覆寫），
   256² 等於 5.56x 密度。144² 給 3.13x —— 完整覆蓋 3x retina（iPhone 的上限），
   視覺零損失，單檔約 8.9KB → 3.7KB。原始 PNG 在 site-assets/icons/ 不動，
   要調回去只需改這個數字重跑。（2026-09-04，線上 Lighthouse
   uses-responsive-images 點名 icons/puritylens.webp 浪費 90%） */
const ICON_PX = 144;
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

const kvSrc = (s) => existsSync(join(KV_AI, `${s}.png`)) ? join(KV_AI, `${s}.png`) : join(KV_CODE, `${s}.png`);
const kvKind = (s) => existsSync(join(KV_AI, `${s}.png`)) ? 'AI' : '程式';
const missingKv = SLUGS.filter((s) => !existsSync(join(KV_AI, `${s}.png`)) && !existsSync(join(KV_CODE, `${s}.png`)));
if (missingKv.length) {
  console.error(`❌ kv-ai/ 與 kv-gen/ 都缺這些產品的底圖：${missingKv.join(', ')}`);
  console.error(`   AI 版：node scripts/gen-kv-chatgpt.mjs --only ${missingKv.join(',')}`);
  console.error(`   程式版：node scripts/build-kv-code.mjs --only ${missingKv.join(',')}`);
  process.exit(2);
}

console.log('▶ 主視覺 → site/assets/kv/');
for (const slug of SLUGS) {
  const dst = join(KV_OUT, `${slug}.webp`);
  // 從 q=82 起跳，超過上限就降到過為止（母版規格是硬的，畫質是可調的）
  let q = 82, r;
  do {
    r = toWebp(kvSrc(slug), dst, KV_W, KV_H, q);
    q -= 8;
  } while (r.kb > KV_MAX_KB && q >= 50);
  const flag = r.kb > KV_MAX_KB ? ' ⚠️ 仍超過上限' : '';
  console.log(`   ✓ ${slug.padEnd(12)} [${kvKind(slug)}] ${r.srcW}×${r.srcH} → ${KV_W}×${KV_H} q${q + 8}, ${r.kb.toFixed(0)} KB${flag}`);
}

console.log('▶ 產品 icon → site/assets/icons/');
let noIcon = [];
for (const slug of SLUGS) {
  const src = join(ICON_SRC, `${slug}.png`);
  if (!existsSync(src)) { noIcon.push(slug); continue; }
  const r = toWebp(src, join(ICON_OUT, `${slug}.webp`), ICON_PX, ICON_PX, 90);
  console.log(`   ✓ ${slug.padEnd(12)} ${r.srcW}×${r.srcH} → ${ICON_PX}², ${r.kb.toFixed(1)} KB`);
}
if (noIcon.length) console.log(`   ⚠️  缺官方 icon，卡片留空（不自己生一個）：${noIcon.join(', ')}`);

console.log(`✅ kv ${readdirSync(KV_OUT).filter((f) => f.endsWith('.webp')).length} 張 · icon ${readdirSync(ICON_OUT).filter((f) => f.endsWith('.webp')).length} 張`);
