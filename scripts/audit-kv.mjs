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

/** 母版規格 — 與 .claude/plan.md 決策紀錄一致 */
export const SPEC = {
  width: 1600,
  height: 1200,
  ratio: 4 / 3,
  ratioTolerance: 0.005, // ±0.5%
  maxBytes: 200 * 1024,
  ext: '.webp',
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

  if (!existsSync(KV_ROOT)) {
    errors.push(`缺少主視覺目錄：site/assets/kv/（預期 ${SPEC.locales.join(' / ')} 三語子目錄）`);
    return errors;
  }

  for (const locale of SPEC.locales) {
    const dir = join(KV_ROOT, locale);
    if (!existsSync(dir)) {
      errors.push(`[${locale}] 缺少目錄 site/assets/kv/${locale}/`);
      continue;
    }
    const files = readdirSync(dir).filter((f) => !f.startsWith('.'));
    if (files.length === 0) {
      errors.push(`[${locale}] 目錄為空`);
      continue;
    }

    for (const f of files) {
      const p = join(dir, f);
      const rel = `site/assets/kv/${locale}/${f}`;

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
