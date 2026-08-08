#!/usr/bin/env node
/* ============================================================
   audit-kv — Selected Work 主視覺（key visual）不變式檢查

   為何不用既有方案：repo 內無任何影像驗證腳本（capability-find.sh
   "screenshot audit aspect ratio device frame" → 索引新鮮、確認查無）。
   不引入 sharp/probe-image-size：本檔只需讀 WebP 檔頭，30 行即可，
   符合本站自述的工程原則「零依賴傾向」。

   驗收：exit 0 = 全數通過；exit 2 = 有違規（CI / deploy 前應中止）
   ============================================================ */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KV_ROOT = join(ROOT, 'site/assets/kv');

/** 母版規格 — 與 .claude/plan.md 決策紀錄、tokens/crealize.tokens.json § keyVisual 三處同步 */
export const SPEC = {
  width: 1600,
  height: 1200,
  ratio: 4 / 3,
  ratioTolerance: 0.005, // ±0.5%
  maxBytes: 200 * 1024,
  ext: '.webp',
  /* 三語共用同一組主視覺：KV 語言中性、不含任何文字，文字留在已在地化的 HTML。
     locales 仍列在此，供 registry 對帳檢查三語是否指向同一個檔。 */
  locales: ['en', 'ja', 'zh'],
};

/** 讀 WebP 尺寸（支援 VP8 / VP8L / VP8X 三種 chunk） */
export function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('not a WebP file');
  }
  const fourcc = buf.toString('ascii', 12, 16);

  if (fourcc === 'VP8X') {
    return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
  }
  if (fourcc === 'VP8 ') {
    // lossy: 3-byte frame tag + 3-byte start code, then 16-bit w/h (14 bits each)
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    // lossless: 1-byte signature (0x2f) then 14 bits w-1, 14 bits h-1
    const bits = buf.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  throw new Error(`unknown WebP chunk: ${fourcc}`);
}

function check() {
  const errors = [];

  /* 遷移期行為：主視覺尚未產出時，本檢查無事可做 —— 不能因此擋下部署。
     一道「目標狀態未達成就擋住現行站台部署」的 gate 是設計錯誤：它會在最需要
     緊急修補上線時（例如 2026-08-08 的 .cursorrules 外洩）把路堵死。
     本檢查只驗「已存在的主視覺合不合母版」；「registry 是否已改用主視覺」
     由 audit-kv-registry.mjs 依實際遷移狀態自動判斷。 */
  if (!existsSync(KV_ROOT)) {
    console.log('ℹ️  audit-kv — site/assets/kv/ 尚未建立，主視覺未產出，跳過母版檢查');
    return errors;
  }

  const files = readdirSync(KV_ROOT).filter((f) => !f.startsWith('.'));
  if (files.length === 0) {
    console.log('ℹ️  audit-kv — site/assets/kv/ 為空，跳過母版檢查');
    return errors;
  }

  for (const f of files) {
    const p = join(KV_ROOT, f);
    const rel = `site/assets/kv/${f}`;

    if (!f.endsWith(SPEC.ext)) {
      errors.push(`${rel}: 副檔名須為 ${SPEC.ext}`);
      continue;
    }

    const bytes = statSync(p).size;
    if (bytes > SPEC.maxBytes) {
      errors.push(`${rel}: ${(bytes / 1024).toFixed(0)}KB 超過上限 ${SPEC.maxBytes / 1024}KB`);
    }

    let size;
    try {
      size = webpSize(readFileSync(p));
    } catch (e) {
      errors.push(`${rel}: 無法讀取尺寸 — ${e.message}`);
      continue;
    }

    if (size.w !== SPEC.width || size.h !== SPEC.height) {
      errors.push(`${rel}: 尺寸 ${size.w}×${size.h}，母版須為 ${SPEC.width}×${SPEC.height}`);
    }

    const ratio = size.w / size.h;
    if (Math.abs(ratio - SPEC.ratio) / SPEC.ratio > SPEC.ratioTolerance) {
      errors.push(`${rel}: 比例 ${ratio.toFixed(3)}，須為 ${SPEC.ratio.toFixed(3)} (4:3) ±0.5%`);
    }
  }

  return errors;
}

// 只在被直接執行時跑 CLI；被 import（audit-kv-registry.mjs 取 SPEC）時不得有副作用
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const errors = check();
  if (errors.length) {
    console.error(`❌ audit-kv — ${errors.length} 項不合格\n`);
    for (const e of errors) console.error(`   • ${e}`);
    console.error('\n規格見 .claude/plan.md § 決策紀錄');
    process.exit(2);
  }
  console.log('✅ audit-kv — 主視覺全數符合母版規格');
}
