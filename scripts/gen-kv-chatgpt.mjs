#!/usr/bin/env node
/* ============================================================
   gen-kv-chatgpt — 用 ChatGPT（automation Chrome，port 9222）逐產品生成主視覺

   為什麼是 ChatGPT 而不是文字 prompt 自己畫 SVG：
   Yves 2026-08-09：「你這次的設計太幾何了，有點像公家機關…我讓你用去調用 Chrome
   裡面的 ChatGPT 生成圖，你為什麼不做呢？品味要提升啊」。幾何 SVG 拼不出材質、
   光線與景深，那正是「像公家機關」的來源。

   每個產品：
     1. 開新對話（避免上一個產品的風格污染）
     2. 上傳該產品**官方 app icon** 當參考圖 —— 這是「按照各產品自己的品牌規劃」的關鍵。
        純文字 prompt 生出來的東西跟產品識別無關（2026-08-08 已被退件過一次）。
     3. 送出以 docs/design-system/product-palette.json 的品牌色與 tone 組出的 prompt
     4. 等圖、取 URL、下載到 site-assets/kv-ai/<slug>.png

   硬性約束寫在 prompt 裡：無文字、無 logo、**無手機/裝置/UI**、非扁平幾何。
   前兩者是為了語言中性與真實性，第三個是 Yves 明講過兩次的「放手機是十年前的設計」。

   用法：
     bash ~/.claude/scripts/automation-chrome.sh 0     # 先確保 Chrome 在跑且已登入
     node scripts/gen-kv-chatgpt.mjs                   # 全部
     node scripts/gen-kv-chatgpt.mjs --only fudeto,tendo
     node scripts/gen-kv-chatgpt.mjs --print           # 只印 prompt 不動 Chrome
   退出：0 全部成功 / 1 有產品失敗 / 2 環境問題
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newTab, listPages, attach } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = join(ROOT, 'site-assets/icons');
const OUT = join(ROOT, 'site-assets/kv-ai');   // 與程式生成版 kv-gen/ 分開，方便比對
const PALETTE = JSON.parse(readFileSync(join(ROOT, 'docs/design-system/product-palette.json'), 'utf8')).products;

/** slug → palette.json 的鍵，以及卡片要傳達的那一個機制。
    機制文字取自 Claude Design 的 Work v3 文案，不另外發明。 */
const PRODUCTS = [
  { s: 'puritylens', k: 'PurityLens', mech: 'You hold a cosmetics jar up and it tells you where that product stands — three tiers of lookup, and it avoids the AI model wherever it can.' },
  { s: 'fudeto', k: 'Fudeto', mech: "Euler's 1736 bridge problem as a daily ritual: one unbroken stroke that traverses every edge exactly once, ending on a single gold point." },
  { s: 'kichitto', k: 'Kichitto', mech: 'A paper receipt goes in and becomes one clean row in your own spreadsheet — bookkeeping that leaves nothing locked away.' },
  { s: 'qiflux', k: 'QiFlux', mech: 'A menstrual cycle app that refuses to shout: no streaks, no gamification, at least 60% of every screen left empty.' },
  { s: 'meishitto', k: 'Meishitto', mech: 'A business card is read on the device itself and stays there — recognition happens in your hand, not in someone else’s cloud.' },
  { s: 'rythix2048', k: 'Rythix2048', mech: 'A sliding number puzzle where every move sounds a note, and the soundtrack is composed on your device as you play.' },
  { s: 'tendo', k: 'Tendo', mech: 'Visit every point exactly once — a Hamiltonian path puzzle with no formula, only intuition; solving it lights each vertex gold in the order you walked it.' },
  { s: 'xunni', k: 'XunNi', mech: 'Two astrological charts read through one of four relationship lenses — change the lens and the interpretation logic itself changes.' },
  { s: 'moonpacket', k: 'moonpacket', mech: 'The lunar-new-year red packet reimagined as Web3’s everyday gesture — non-custodial, dropped straight into a group chat.' },
  { s: 'idokuta', k: 'iDokuta', mech: 'You write how you feel in your own language and it comes back as clear medical Japanese, so you can simply hand the phone to the clinic staff.' },
  { s: 'mairi', k: 'Mairi', mech: 'What you record every day becomes usable on the day you are seen — handed over as a pass that expires in six hours and cannot be renewed.' },
  { s: 'ymy', k: 'YMY', mech: 'A whole-enterprise identity for a Japanese trading company that sources and fulfils for individual marketplace sellers — CI standard, logo vector masters, mascot, signage, uniforms, vehicles, a four-language corporate site, and the business and distribution design behind it.' },
  { s: 'meguru', k: 'Meguru', mech: 'Listing, order, support and payout closed into a single loop — forty microservices folded into one platform, with a human approving every reconciliation.' },
];

function paletteLine(k) {
  const p = PALETTE[k];
  if (!p) return '';
  return Object.entries(p.palette || {})
    .filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
    .map(([role, hex]) => `${hex} (${role})`)
    .join(', ');
}

function buildPrompt(prod, refCount) {
  const p = PALETTE[prod.k] || {};
  return [
    `Create ONE image, 4:3 landscape. It will be used as the BACKGROUND PLATE of a product card on the portfolio site of Crealize — an AI / digital-product / blockchain studio.`,
    ``,
    refCount
      ? `Attached: this product's official app icon${refCount > 1 ? ", and a real screenshot of the product itself" : ''}. Use them as the source of truth for the brand — its palette, its symbol language, the shapes and rhythms its interface actually uses. Build the image out of that visual world; do not invent an unrelated look.`
      : `No reference images exist for this product, so work purely from the palette and mood below.`,
    ``,
    `Product: ${prod.k}`,
    `What it does: ${prod.mech}`,
    `Brand palette (use these, do not invent a new colour scheme): ${paletteLine(prod.k)}`,
    `Brand mood (colour and feeling only — do NOT reproduce any physical material it mentions): ${p.tone || ''}`,
    ``,
    `What the image should be:`,
    `- The product's own visual world, rendered as key art — the way a game or an app is announced. Take the motifs, shapes and colour logic from the attached references and stage them large, cinematic and abstracted.`,
    `- Digital-native and computational: a high-end 3D / generative render. Light is the material — volumetric glow, refractive glass, iridescent chrome, emissive gradients, particle and data fields, light trails, deep layered space.`,
    `- Trendy and confident, in the register of an Apple, Nvidia, Linear or Vercel launch visual.`,
    `- Composition must leave a calm area (upper-left or lower-left) with low detail and low contrast — a product icon and a short line of type will be composited there afterwards. Keep that zone quiet.`,
    ``,
    `Hard constraints — any of these makes the image unusable:`,
    `- NO text, letters, numbers, words, logos, wordmarks or watermarks anywhere. Type is added later by us.`,
    `- NO phone, tablet, laptop, monitor, screen bezel or device mockup. Show the world, not the hardware.`,
    `- NOT an analog craft still life: no paper, ink brushes, wood, stone, ceramic, fabric, brass, desks, plants, studio tabletops. Nothing that reads as artisanal, boutique-hotel, spa, or lifestyle advertising. This is the single most common failure — avoid it.`,
    `- NOT flat vector geometry, NOT a corporate infographic, NOT an icon set, NOT clip art, NOT isometric illustration. Nothing that looks like a government or institutional brochure.`,
    `- No people's faces.`,
  ].join('\n');
}

const args = process.argv.slice(2);
const only = (args.find((a) => a.startsWith('--only')) || '').split('=')[1]
  || (args.includes('--only') ? args[args.indexOf('--only') + 1] : null);
const targets = only ? PRODUCTS.filter((p) => only.split(',').includes(p.s)) : PRODUCTS;

if (args.includes('--print')) {
  for (const p of targets) {
    const icon = join(ICONS, `${p.s}.png`);
    console.log(`\n${'═'.repeat(70)}\n${p.s}  (icon: ${existsSync(icon) ? 'yes' : 'NONE'})\n${'═'.repeat(70)}`);
    console.log(buildPrompt(p, (existsSync(icon)?1:0) + (existsSync(join(ROOT,'site-assets/shots',p.s+'.png'))?1:0)));
  }
  process.exit(0);
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* 重複使用同一個分頁，每個產品用導航回首頁的方式開新對話。
   原本每個產品開一個分頁，跑到一半累積 12 個分頁，而且 ChatGPT 反覆回
   「Your session has expired」把整批卡死。分頁少、行為像人，才穩。 */
let SESSION = null;
async function freshChat() {
  if (SESSION) {
    try {
      await SESSION.navigate('https://chatgpt.com/');
      await sleep(3500);
      await SESSION.waitFor(() => !!document.querySelector('#prompt-textarea'), { label: 'composer', timeout: 45000 });
      return SESSION;
    } catch {
      try { SESSION.close(); } catch {}
      SESSION = null;
    }
  }
  const created = await newTab('https://chatgpt.com/');
  if (!created || !created.id) throw new Error('開不了 chatgpt 分頁');
  await sleep(4000);
  const t = (await listPages()).find((p) => p.id === created.id);
  if (!t) throw new Error('新分頁消失了');
  const s = await attach(t);
  await s.waitFor(() => !!document.querySelector('#prompt-textarea'), { label: 'composer', timeout: 60000 });
  s.tabId = created.id;
  SESSION = s;
  return s;
}

/** session 過期時，導航一次通常就會恢復（實測）。恢復不了才算真的斷。 */
async function assertLive(s, slug) {
  const email = await s.evaluate(async () => {
    try { const j = await (await fetch('/api/auth/session', { credentials: 'include' })).json(); return j?.user?.email || null; }
    catch { return null; }
  });
  if (!email) throw new Error(`${slug}：ChatGPT session 失效（需要重新登入，agent 不輸入密碼）`);
  return email;
}

async function generate(prod) {
  const iconPath = join(ICONS, `${prod.s}.png`);
  const hasIcon = existsSync(iconPath);
  const s = await freshChat();
  await assertLive(s, prod.s);
  try {
    // 生成圖的 URL 直接 fetch 會 403（簽章綁瀏覽器 session）。
    // 所以改為：開 Network domain 記下每個圖片回應的 requestId，
    // 之後用 Network.getResponseBody 從瀏覽器自己的快取把 bytes 拿出來。
    // 辨識產圖一律走網路層，不靠 DOM。DOM 猜法失敗過兩次：
    // 只比對網域 → 抓到我上傳的 icon 縮圖；改看 naturalWidth → 生成圖未解碼回報 0×0；
    // 改看 assistant 回合 → 那些節點根本沒有 data-message-author-role。
    // 網路層的判準很硬：回應是圖片、在送出 prompt 之後才完成、而且夠大。
    const imgs = new Map();   // requestId → { url, bytes, done }
    await s.send('Network.enable');
    s.on('Network.responseReceived', (p) => {
      if (p.type === 'Image' || (p.response.mimeType || '').startsWith('image/')) {
        imgs.set(p.requestId, { url: p.response.url, bytes: 0, done: false, t: Date.now() });
      }
    });
    s.on('Network.loadingFinished', (p) => {
      const e = imgs.get(p.requestId);
      if (e) { e.bytes = p.encodedDataLength; e.done = true; }
    });
    const refs = [];
    if (hasIcon) refs.push(iconPath);
    const shotPath = join(ROOT, 'site-assets/shots', `${prod.s}.png`);
    if (existsSync(shotPath)) refs.push(shotPath);   // 真實產品畫面當第二張參考
    if (refs.length) {
      await s.setFiles('#upload-photos', refs);
      // 附件縮圖出現才算真的上傳成功；沒等就送出會變成純文字 prompt
      await s.waitFor(
        () => document.querySelectorAll('form img, [data-testid*="attachment"], .group\\/thumbnail').length > 0,
        { label: `${prod.s} 附件上傳`, timeout: 120000 }
      );
      await sleep(2500);
    }

    /* 送出前先把畫面上已有的圖（＝我剛上傳的參考圖）記下來當黑名單。
       2026-08-09 踩到：加了第二張參考圖之後，上傳的截圖本身也超過 200KB，
       而且它的網路回應在送出之後才完成，於是贏了「送出後最大的圖」這個判準 ——
       kichitto 抓回 942×2048 的截圖、idokuta 抓回 1024×1024 的 icon 本身。 */
    const uploaded = new Set(await s.evaluate(() => {
      const ids = [];
      document.querySelectorAll('img').forEach((i) => {
        const m = /id=(file_[A-Za-z0-9]+)/.exec(i.currentSrc || i.src || '');
        if (m) ids.push(m[1]);
      });
      return ids;
    }));

    const prompt = buildPrompt(prod, refs.length);
    await s.evaluate(() => { document.querySelector('#prompt-textarea').focus(); });
    await s.send('Input.insertText', { text: prompt });
    await sleep(800);

    await s.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });
    await s.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 });

    // 生成圖的來源網域是 oaiusercontent（簽章 URL，之後可直接 curl）
    /* ChatGPT 偶爾回「發生錯誤。請再試一次」並附一個重試鈕。
       不處理的話就是白等 480 秒，整批一起陣亡（2026-08-09 實測 5/5 失敗）。 */
    let retried = 0;
    const maybeRetry = async () => {
      if (retried >= 2) return false;
      const clicked = await s.evaluate(() => {
        const btns = [...document.querySelectorAll('button')];
        const b = btns.find((x) => /重試|重试|Retry|Try again/i.test(x.textContent || ''));
        if (b) { b.click(); return true; }
        return false;
      }).catch(() => false);
      if (clicked) { retried++; console.log(`\n     ↻ ${prod.s} 偵測到錯誤，已按重試（第 ${retried} 次）`); }
      return clicked;
    };

    const sentAt = Date.now();
    const MIN_BYTES = 200_000;   // 上傳的 icon 縮圖是 13KB；生成圖是 MB 級
    let picked = null;
    for (let waited = 0; waited < 600_000; waited += 4000) {
      await sleep(4000);
      if (waited % 40_000 === 0 && waited > 0) await maybeRetry();
      const fileId = (u) => (/id=(file_[A-Za-z0-9]+)/.exec(u || '') || [])[1];
      const cands = [...imgs.entries()]
        .filter(([, e]) => e.done && e.t > sentAt && e.bytes >= MIN_BYTES)
        .filter(([, e]) => !uploaded.has(fileId(e.url)))
        .sort((a, b) => b[1].bytes - a[1].bytes);
      if (cands.length) { picked = { requestId: cands[0][0], ...cands[0][1] }; break; }
    }
    if (!picked) {
      const reply = await s.evaluate(() => {
        const t = [...document.querySelectorAll('main')].map((m) => m.innerText).join(' ');
        return t.replace(/\s+/g, ' ').slice(-400);
      }).catch(() => '');
      throw new Error(`等不到產圖（480s）。頁面最後說：${reply}`);
    }

    const { body, base64Encoded } = await s.send('Network.getResponseBody', { requestId: picked.requestId });
    const buf = Buffer.from(body, base64Encoded ? 'base64' : 'utf8');
    if (buf.length < MIN_BYTES) throw new Error(`取回的圖只有 ${buf.length} bytes，不像成品`);
    return { buf, hasIcon, url: picked.url, refs: refs.length };
  } finally {
    /* 分頁留著重複使用，不關 —— 關掉再開會讓 session 更容易被判定異常。 */
  }
}

const results = [];
for (const prod of targets) {
  process.stdout.write(`▶ ${prod.s.padEnd(12)} `);
  try {
    const { buf, refs } = await generate(prod);
    const dst = join(OUT, `${prod.s}.png`);
    writeFileSync(dst, buf);
    console.log(`✓ ${(buf.length / 1024).toFixed(0)} KB（${refs} 張參考圖）`);
    results.push({ slug: prod.s, ok: true });
  } catch (e) {
    console.log(`✗ ${e.message}`);
    results.push({ slug: prod.s, ok: false, err: e.message });
  }
}

const bad = results.filter((r) => !r.ok);
console.log(`\n${results.length - bad.length}/${results.length} 成功`);
if (bad.length) {
  for (const b of bad) console.error(`   ✗ ${b.slug}: ${b.err}`);
  process.exit(1);
}
