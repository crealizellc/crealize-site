#!/usr/bin/env node
/* ============================================================
   render-kv — 把 Claude Design 產出的主視覺 HTML 渲染成母版 webp

   用法：node scripts/render-kv.mjs [來源HTML路徑]
   預設來源：docs/design-system/source/claude-design-export/Work Key Visuals.html
   輸出：site/assets/kv/<slug>.webp（1600×1200，見 tokens/crealize.tokens.json § keyVisual）

   為何不用 Playwright / Puppeteer：本機兩者皆未安裝，而 Chrome 內建
   `--headless --screenshot --window-size` 已足以做確定性定尺截圖，
   不必為此新增依賴（本站自述的工程原則之一即「零依賴傾向」）。
   webp 轉檔用已存在的 cwebp（homebrew）。

   作法：逐個 .kv 區塊產生「原 <head> 樣式 + 只含該區塊」的暫存頁再截圖，
   而不是整頁截一張再裁 —— 後者會被區塊間距、捲動位置影響，不確定。
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { SPEC } from './audit-kv.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = process.argv[2]
  ? join(ROOT, process.argv[2])
  : join(ROOT, 'docs/design-system/source/claude-design-export/Work Key Visuals.html');
const OUT_DIR = join(ROOT, 'site/assets/kv');

const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
];
const CHROME = CHROME_CANDIDATES.find((p) => existsSync(p));
if (!CHROME) {
  console.error('❌ 找不到 Chrome。試過：\n  ' + CHROME_CANDIDATES.join('\n  '));
  process.exit(2);
}

if (!existsSync(SRC)) {
  console.error(`❌ 來源不存在：${SRC}\n   先從 Claude Design export 下載並解壓（見 CLAUDE.md § 設計系統契約）`);
  process.exit(2);
}

const html = readFileSync(SRC, 'utf8');

/** 取出 <head> 內容（樣式），供每個單張頁沿用 */
const head = (html.match(/<head[^>]*>([\s\S]*?)<\/head>/i) || [, ''])[1];

/** 找出所有 id="kv-<slug>" 的區塊。用標籤配對掃描，避免正則吃到巢狀 div。 */
function extractBlocks(src) {
  const out = [];
  const openRe = /<(\w+)([^>]*\bid=["']kv-([a-z0-9-]+)["'][^>]*)>/gi;
  let m;
  while ((m = openRe.exec(src))) {
    const [full, tag, , slug] = m;
    const start = m.index;
    let depth = 1;
    const scanRe = new RegExp(`<${tag}\\b[^>]*>|</${tag}>`, 'gi');
    scanRe.lastIndex = start + full.length;
    let s;
    while (depth > 0 && (s = scanRe.exec(src))) {
      depth += s[0][1] === '/' ? -1 : 1;
    }
    if (depth !== 0) {
      console.error(`⚠️  kv-${slug}: 標籤未閉合，略過`);
      continue;
    }
    out.push({ slug, html: src.slice(start, scanRe.lastIndex) });
  }
  return out;
}

const blocks = extractBlocks(html);
if (blocks.length === 0) {
  console.error('❌ 來源中找不到任何 id="kv-<slug>" 區塊');
  process.exit(2);
}

mkdirSync(OUT_DIR, { recursive: true });
const work = join(tmpdir(), `crz-kv-${process.pid}`);
mkdirSync(work, { recursive: true });

const { width, height } = SPEC;
let ok = 0;

for (const { slug, html: blockHtml } of blocks) {
  const page = join(work, `${slug}.html`);
  const png = join(work, `${slug}.png`);
  const webp = join(OUT_DIR, `${slug}.webp`);

  writeFileSync(
    page,
    `<!doctype html><html><head>${head}
<style>
  /* 定尺截圖用：去掉外距與捲軸，讓該區塊剛好填滿視窗 */
  html,body{margin:0!important;padding:0!important;background:transparent;overflow:hidden}
  body>*{margin:0!important}
  #kv-${slug}{width:${width}px!important;height:${height}px!important;
              position:absolute!important;left:0!important;top:0!important;transform:none!important}
</style></head><body>${blockHtml}</body></html>`
  );

  execFileSync(
    CHROME,
    [
      '--headless',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--default-background-color=00000000',
      `--screenshot=${png}`,
      `--window-size=${width},${height}`,
      `file://${page}`,
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] }
  );

  if (!existsSync(png)) {
    console.error(`❌ ${slug}: Chrome 未產生截圖`);
    continue;
  }

  // 品質由高往下降，直到符合母版的檔案大小上限
  let done = false;
  for (const q of [90, 84, 78, 70, 62]) {
    execFileSync('cwebp', ['-quiet', '-q', String(q), png, '-o', webp]);
    const bytes = readFileSync(webp).length;
    if (bytes <= SPEC.maxBytes) {
      console.log(`✅ ${slug.padEnd(14)} q=${q}  ${(bytes / 1024).toFixed(0)}KB`);
      done = true;
      ok++;
      break;
    }
  }
  if (!done) console.error(`❌ ${slug}: 即使 q=62 仍超過 ${SPEC.maxBytes / 1024}KB 上限`);
}

rmSync(work, { recursive: true, force: true });
console.log(`\n${ok}/${blocks.length} 張完成 → site/assets/kv/`);
console.log('接著跑：npm run check:kv');
if (ok !== blocks.length) process.exit(2);
