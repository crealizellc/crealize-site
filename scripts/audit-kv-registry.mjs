#!/usr/bin/env node
/* ============================================================
   audit-kv-registry — work registry ↔ 主視覺素材 三語對帳

   為何不用既有方案：audit-kv.mjs 只驗「已存在的圖合不合母版規格」，
   驗不出「registry 列了某產品卻沒有圖」或「三語內容不對稱」。
   全域 token-drift-lint.sh 管的是色彩/字體契約，與本檔正交。

   驗收：exit 0 = 三語 registry 對稱且素材齊備；exit 2 = 有缺口
   ============================================================ */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SPEC } from './audit-kv.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/** 在假 window 下取出 site/js/i18n/<locale>.js 的 registry */
function loadRegistry(locale) {
  const src = readFileSync(join(ROOT, `site/js/i18n/${locale}.js`), 'utf8');
  const sandbox = { window: {} };
  new Function('window', src)(sandbox.window);
  const i18n = sandbox.window.CRZ_I18N;
  if (!i18n || !Array.isArray(i18n.work)) throw new Error(`${locale}.js 未產生 CRZ_I18N.work`);
  return i18n.work;
}

const errors = [];
const registries = {};

for (const locale of SPEC.locales) {
  try {
    registries[locale] = loadRegistry(locale);
  } catch (e) {
    errors.push(`[${locale}] 無法載入 registry — ${e.message}`);
  }
}

if (Object.keys(registries).length === SPEC.locales.length) {
  const [base, ...rest] = SPEC.locales;
  const baseNames = registries[base].map((w) => w.name);

  // 1. 三語產品清單必須完全對稱（順序也要一致，否則 index 編號會錯位）
  for (const locale of rest) {
    const names = registries[locale].map((w) => w.name);
    if (names.join('|') !== baseNames.join('|')) {
      errors.push(
        `[${locale}] 產品清單與 ${base} 不一致：\n` +
          `        ${base}: ${baseNames.join(', ')}\n` +
          `        ${locale}: ${names.join(', ')}`
      );
    }
  }

  // 2. 每個產品每個語言都要有對應主視覺檔
  for (const locale of SPEC.locales) {
    for (const w of registries[locale] ?? []) {
      if (!w.img) {
        errors.push(`[${locale}] ${w.name}: registry 缺 img 欄位`);
        continue;
      }
      // ja/zh 的 registry 路徑帶 ../ 前綴（相對各自的 locale 輸出目錄），先正規化再判斷
      const bare = w.img.replace(/^(\.\.\/)+/, '');
      const want = `assets/kv/${locale}/`;
      if (!bare.startsWith(want)) {
        errors.push(`[${locale}] ${w.name}: img 應指向 ${want}…（目前 "${w.img}"）`);
      }
      // 實際解析：en 輸出在 site/，ja/zh 輸出在 site/<locale>/
      const outDir = join(ROOT, 'site', locale === 'en' ? '' : locale);
      if (!existsSync(join(outDir, w.img))) {
        errors.push(`[${locale}] ${w.name}: 找不到素材（自 site/${locale === 'en' ? '' : locale + '/'} 解析 "${w.img}"）`);
      }
    }
  }

  // 3. 主視覺為量身設計，不應再有逐產品 object-position 手調
  for (const locale of SPEC.locales) {
    for (const w of registries[locale] ?? []) {
      if (w.pos) errors.push(`[${locale}] ${w.name}: 仍殘留 pos="${w.pos}"，主視覺已按框設計，應移除`);
    }
  }
}

if (errors.length) {
  console.error(`❌ audit-kv-registry — ${errors.length} 項不合格\n`);
  for (const e of errors) console.error(`   • ${e}`);
  process.exit(2);
}
console.log(`✅ audit-kv-registry — 三語 registry 對稱，素材齊備`);
