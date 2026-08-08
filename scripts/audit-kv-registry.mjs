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

  const norm = (x) => (x ?? '').replace(/^(\.\.\/)+/, '');

  /* 遷移階段自動偵測：全部 img 都指向 assets/kv/ 才算已遷移。
     用自動偵測而非手動旗標，是因為手動旗標一定有人忘了翻。 */
  const allImgs = SPEC.locales.flatMap((l) => (registries[l] ?? []).map((w) => norm(w.img)));
  const migrated = allImgs.length > 0 && allImgs.every((p) => p.startsWith('assets/kv/'));

  // ── 永遠成立的不變式（不論是否已遷移）──────────────────────────────
  // 2. 每個產品每個語言的素材檔都要真的存在
  for (const locale of SPEC.locales) {
    for (const w of registries[locale] ?? []) {
      if (!w.img) {
        errors.push(`[${locale}] ${w.name}: registry 缺 img 欄位`);
        continue;
      }
      // 實際解析：en 輸出在 site/，ja/zh 輸出在 site/<locale>/
      const outDir = join(ROOT, 'site', locale === 'en' ? '' : locale);
      if (!existsSync(join(outDir, w.img))) {
        errors.push(`[${locale}] ${w.name}: 找不到素材（自 site/${locale === 'en' ? '' : locale + '/'} 解析 "${w.img}"）`);
      }
    }
  }

  // ── 遷移後才強制的規則 ────────────────────────────────────────────
  if (migrated) {
    // 3. 主視覺按框設計，不應再有逐產品 object-position 手調
    for (const locale of SPEC.locales) {
      for (const w of registries[locale] ?? []) {
        if (w.pos) errors.push(`[${locale}] ${w.name}: 仍殘留 pos="${w.pos}"，主視覺已按框設計，應移除`);
      }
    }
    // 4. 三語必須指向同一個主視覺檔。KV 語言中性、不含文字；一旦三語指向不同檔，
    //    就代表有人又把文字烘進圖裡了 —— 那正是本次要根除的缺陷。
    for (const w of registries[base] ?? []) {
      const baseImg = norm(w.img);
      for (const locale of rest) {
        const other = (registries[locale] ?? []).find((x) => x.name === w.name);
        if (other && norm(other.img) !== baseImg) {
          errors.push(
            `${w.name}: ${base} 與 ${locale} 指向不同主視覺（${baseImg} vs ${norm(other.img)}）。` +
              `主視覺應語言中性、三語共用`
          );
        }
      }
    }
  } else {
    const kvCount = allImgs.filter((p) => p.startsWith('assets/kv/')).length;
    console.log(
      `ℹ️  audit-kv-registry — 尚未遷移至主視覺（${kvCount}/${allImgs.length} 已指向 assets/kv/）。` +
        `本階段只驗素材存在與三語對稱；遷移完成後自動啟用「禁 pos」與「三語同圖」規則。`
    );
  }
}

if (errors.length) {
  console.error(`❌ audit-kv-registry — ${errors.length} 項不合格\n`);
  for (const e of errors) console.error(`   • ${e}`);
  process.exit(2);
}
console.log(`✅ audit-kv-registry — 三語 registry 對稱，素材齊備`);
