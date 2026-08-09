/* ============================================================
   shoot-site.mjs — 三語頁面目視截圖（給人看，不是 AC）

   為什麼不用 `chrome --headless --screenshot`：那條路只拍首屏，
   而首頁的 hero 是 scroll-driven 的長軸；#work 錨點在無頭截圖裡不會生效
   （2026-08-09 實測：三語截出來的檔案 byte 數完全相同 = 三張都是 hero）。
   所以改走 CDP：自己開一個獨立 port 的 headless Chrome，
   捲到指定 section、等動畫落定，再 Page.captureScreenshot。

   用法：
     node scripts/shoot-site.mjs                    # 三語 × work
     node scripts/shoot-site.mjs --section hero     # 換區塊
     node scripts/shoot-site.mjs --full             # 整頁長圖
   輸出：docs/design-system/shots/<locale>-<section>.png
   ============================================================ */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attach, listPages } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = [
  process.env.CHROME_BIN,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].filter(Boolean).find((p) => existsSync(p));
const CHROME_PROCESS_FLAGS = process.env.CHROME_SINGLE_PROCESS === '1' ? ['--single-process', '--no-zygote'] : [];
if (!CHROME) {
  console.error('❌ 找不到 Chrome —— 環境問題，不是內容問題');
  process.exit(1);
}

const argv = process.argv.slice(2);
const arg = (k, d) => {
  const i = argv.indexOf(k);
  return i === -1 ? d : argv[i + 1];
};
const SECTION = arg('--section', 'work');
const FULL = argv.includes('--full');
const WIDTH = Number(arg('--width', 1440));
const HEIGHT = Number(arg('--height', 1600));
/* 專用 port，避開 automation Chrome 的 9222（那台正在跑 ChatGPT，不能借用）。 */
const PORT = Number(arg('--port', 9333));

const OUT = join(ROOT, 'docs/design-system/shots');
mkdirSync(OUT, { recursive: true });

const LOCALES = [
  { id: 'en', path: 'site/index.html' },
  { id: 'ja', path: 'site/ja/index.html' },
  { id: 'zh', path: 'site/zh/index.html' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  `--remote-debugging-port=${PORT}`,
  '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  ...CHROME_PROCESS_FLAGS,
  '--force-device-scale-factor=1', `--window-size=${WIDTH},${HEIGHT}`,
  '--user-data-dir=' + join(ROOT, '.chrome-shoot-profile'),
  'about:blank',
], { stdio: 'ignore' });

let ok = false;
try {
  /* CDP 端點要等 Chrome 真的把 port 開起來，沒有事件可等，只能輪詢。 */
  for (let i = 0; i < 60; i++) {
    try { await listPages(PORT); ok = true; break; } catch { await sleep(250); }
  }
  if (!ok) throw new Error(`Chrome 沒有在 ${PORT} 開出 CDP 端點`);

  for (const loc of LOCALES) {
    const target = (await listPages(PORT)).find((p) => p.type === 'page');
    const s = await attach(target);
    await s.navigate(`file://${join(ROOT, loc.path)}`);
    await sleep(1800);

    const h = await s.evaluate((sel) => {
      const el = document.querySelector('#' + sel);
      if (!el) return -1;
      el.scrollIntoView({ block: 'start' });
      return Math.ceil(document.documentElement.scrollHeight);
    }, SECTION);
    if (h === -1) {
      console.error(`❌ ${loc.id}: 找不到 #${SECTION}`);
      s.close();
      continue;
    }
    /* 卡片是 IntersectionObserver 觸發的，捲完要留時間讓 .is-live 動畫走完一輪。 */
    await sleep(2600);

    if (FULL) {
      await s.send('Emulation.setDeviceMetricsOverride', {
        width: WIDTH, height: h, deviceScaleFactor: 1, mobile: false,
      });
      await sleep(900);
    }
    const shot = await s.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: FULL });
    const name = `${loc.id}-${FULL ? 'full' : SECTION}.png`;
    writeFileSync(join(OUT, name), Buffer.from(shot.data, 'base64'));
    console.log(`✓ ${name}`);
    if (FULL) await s.send('Emulation.clearDeviceMetricsOverride');
    s.close();
  }
  console.log(`✅ → docs/design-system/shots/`);
} finally {
  chrome.kill();
}
