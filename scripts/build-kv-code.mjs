#!/usr/bin/env node
/* ============================================================
   build-kv-code — 用程式生成各產品主視覺（Chrome headless 渲染 SVG/CSS）

   為什麼是程式而不是 AI 生成（2026-08-09）：
   · Yves 要「非常潮流、用編程的方式」—— 這是他在 AI 生成路線受阻時明確給的第三條路
   · ChatGPT 免費額度當日用盡（實測回覆：「You've hit the Free plan limit for image
     generations requests… resets in 23 hours」），OpenArt 只剩 10 credits，
     12 個產品加上迭代必然不夠。程式生成零成本、可即時迭代、可重現。
   · 前兩次 AI 產出被退：一次「太幾何像公家機關」、一次「像飯店廣告」。
     程式生成的好處正是這裡 —— 風格參數化，退件就改參數重跑，不用重抽卡。

   構圖分工（Yves：「icon 貼在上面再加上 slogan 再加上底圖」）：
     底圖  ← 本腳本以該產品品牌色程式生成（流體場 + 輝光 + 顆粒 + 暈影）
     motif ← 取自該產品真實機制的形，但以輝光/模糊/色散渲染，不是扁平線稿
     icon  ← 該產品官方 app icon，統一尺寸與位置
     slogan← 統一字體字級（Space Grotesk），我們自己排，不讓生成模型寫字

   用法：node scripts/build-kv-code.mjs [--only slug1,slug2] [--html]
   輸出：site-assets/kv-gen/<slug>.png（1600×1200）
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ICONS = join(ROOT, 'site-assets/icons');
const OUT = join(ROOT, 'site-assets/kv-gen');
const W = 1600, H = 1200;

const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].find((p) => existsSync(p));
if (!CHROME) { console.error('❌ 找不到 Chrome'); process.exit(2); }

/* ── 每個產品：品牌色 + slogan（取自 Work v3 的定位句）+ motif 形 ──
   motif 用 SVG path/元素描述，渲染時統一套輝光與色散，所以不會是扁平線稿。 */
const P = {
  puritylens: {
    ink: '#0B1520', a: '#7BB8D4', b: '#DCEAF2', c: '#4E8FB0',
    slogan: 'Scan the jar,\nknow where you stand.',
    motif: `<circle cx="1080" cy="600" r="250" class="orb"/>
            <circle cx="1080" cy="600" r="330" class="ring" stroke-dasharray="1400 700"/>
            <g class="rows">${[0,1,2,3,4].map(i=>`<rect x="${180}" y="${470+i*66}" width="${420-i*58}" height="14" rx="7"/>`).join('')}</g>`,
  },
  fudeto: {
    ink: '#0C0C0C', a: '#EAB308', b: '#FAFAFA', c: '#8A6B08',
    slogan: "Euler's 1736 bridges,\nas a morning habit.",
    motif: `<path class="stroke" d="M300 780 C420 380 760 300 980 460 C1200 620 900 900 720 760 C560 636 760 470 900 560" fill="none"/>
            <circle class="spark" cx="900" cy="560" r="26"/>`,
  },
  kichitto: {
    ink: '#160D07', a: '#E97B47', b: '#FFD9C2', c: '#16A34A',
    slogan: 'A receipt goes in;\na row in your Sheet comes out.',
    motif: `<path class="sheet" d="M420 300 l70 -46 70 46 70 -46 70 46 70 -46 70 46 0 420 -420 0z" />
            <g class="rows">${[0,1,2].map(i=>`<rect x="480" y="${400+i*70}" width="${300-i*70}" height="16" rx="8"/>`).join('')}</g>
            <rect class="row-out" x="380" y="880" width="740" height="54" rx="8"/>
            <circle class="spark" cx="1200" cy="330" r="58"/>`,
  },
  qiflux: {
    ink: '#180C24', a: '#E38497', b: '#F2BBBB', c: '#4D2163',
    slogan: "A cycle app that\ndoesn't raise its voice.",
    motif: `<circle class="orb" cx="820" cy="600" r="290"/>
            <circle class="ring" cx="820" cy="600" r="380" stroke-dasharray="2 26"/>`,
  },
  meishitto: {
    ink: '#0B0B1E', a: '#5254E0', b: '#B9BAFF', c: '#3737BB',
    slogan: 'The card is scanned\non your phone, and stays there.',
    motif: `<g class="card-a"><rect x="360" y="340" width="520" height="320" rx="26"/></g>
            <path class="holder" d="M300 640 h640 v300 a30 30 0 0 1 -30 30 h-580 a30 30 0 0 1 -30 -30z" fill="none"/>
            <g class="rows">${[0,1,2].map(i=>`<rect x="1020" y="${470+i*74}" width="${340-i*90}" height="20" rx="10"/>`).join('')}</g>`,
  },
  rythix2048: {
    ink: '#170F1B', a: '#F2C6DC', b: '#BBBBFD', c: '#E7D1DC',
    slogan: 'Every move\ntriggers a note.',
    motif: `<g class="tiles"><rect x="300" y="300" width="200" height="200" rx="24"/><rect x="540" y="300" width="200" height="200" rx="24"/></g>
            <g class="bars">${[0,1,2,3,4,5,6,7].map(i=>{const h=[300,180,420,240,360,150,480,220][i];return `<rect x="${300+i*130}" y="${960-h}" width="64" height="${h}" rx="18"/>`}).join('')}</g>`,
  },
  tendo: {
    ink: '#12100B', a: '#C9A961', b: '#F5F1E8', c: '#8A6F35',
    slogan: 'Every point,\nexactly once.',
    motif: `<path class="stroke" d="M400 380 L800 380 L800 620 L400 620 L400 860 L800 860 L1200 860 L1200 620 L1200 380" fill="none"/>
            <g class="nodes">${[[400,380],[800,380],[800,620],[400,620],[400,860],[800,860],[1200,860],[1200,620],[1200,380]].map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="26"/>`).join('')}</g>`,
  },
  xunni: {
    ink: '#09090B', a: '#F59E0B', b: '#FDE68A', c: '#B45309',
    slogan: 'Same two charts,\na different lens.',
    motif: `<polygon class="chart" points="800,260 1120,500 1000,880 600,880 480,500" fill="none"/>
            <polygon class="chart2" points="800,360 1040,540 960,820 640,780 560,560" fill="none"/>
            <circle class="ring" cx="800" cy="580" r="420" stroke-dasharray="3 30"/>
            <circle class="spark" cx="800" cy="580" r="40"/>`,
  },
  moonpacket: {
    ink: '#07142A', a: '#E32521', b: '#FFBA00', c: '#8E1512',
    slogan: "The red packet,\nas Web3's everyday gesture.",
    motif: `<g class="packet"><rect x="560" y="440" width="440" height="560" rx="28"/></g>
            <path class="flap" d="M560 440 h440 l-220 210 z"/>
            <circle class="spark" cx="1220" cy="330" r="120"/>`,
  },
  idokuta: {
    ink: '#04191E', a: '#04A29E', b: '#7FE3DF', c: '#037A77',
    slogan: 'Bridge the language gap\nwith Japanese healthcare.',
    motif: `<g class="rows">${[0,1,2].map(i=>`<rect x="360" y="${440+i*84}" width="${520-i*120}" height="26" rx="13"/>`).join('')}</g>
            <g class="rows2">${[0,1,2].map(i=>`<rect x="980" y="${470+i*84}" width="${400-i*90}" height="26" rx="13"/>`).join('')}</g>
            <circle class="ring" cx="800" cy="600" r="360" stroke-dasharray="2 22"/>`,
  },
  mairi: {
    ink: '#0F1A24', a: '#C95A3F', b: '#F2B8A5', c: '#4A9068',
    slogan: 'What you log daily,\nusable on the day you’re seen.',
    motif: `<path class="gate" d="M420 320 h760 M470 400 h660 M520 320 v560 M1080 320 v560" fill="none"/>
            <path class="stroke" d="M180 640 H430 L500 480 L580 800 L660 600 H1240" fill="none"/>
            <rect class="qr" x="700" y="760" width="200" height="200" rx="20"/>`,
  },
  meguru: {
    ink: '#0E0E10', a: '#B51452', b: '#F6C6D8', c: '#7A0E37',
    slogan: 'Listing, order, support,\npayout — one loop.',
    motif: `<circle class="ring" cx="800" cy="600" r="330" stroke-dasharray="14 26"/>
            <path class="stroke" d="M620 800 V480 a110 110 0 0 1 110 -110 a110 110 0 0 1 110 110 v320" fill="none"/>
            <path class="stroke" d="M840 800 V480 a110 110 0 0 1 110 -110 a110 110 0 0 1 110 110 v260 l-70 60" fill="none"/>
            <g class="nodes"><circle cx="800" cy="270" r="22"/><circle cx="1130" cy="600" r="22"/><circle cx="800" cy="930" r="22"/></g>`,
  },
};

/* 預設只出「底圖」：icon 與 slogan 現在由頁面即時疊上（Yves 拍板的混合分工）。
   燒進圖裡會有兩個問題：ja/zh 頁出現英文 slogan 與本地化文案的重複，
   而且字被壓成點陣，Retina 上不夠銳利。--with-text 只用於單張比稿。 */
const WITH_TEXT = process.argv.includes('--with-text');
/* motif 預設也不畫進底圖 —— 它是頁面上的**動態層**，底圖再畫一次就會出現殘影
   （2026-08-09 實拍：Kichitto 的收據疊出綠色鬼影、PurityLens 疊出雙圓）。
   底圖只負責氛圍：品牌色場、輝光、顆粒、暈影。--with-motif 只用於單張比稿。 */
const WITH_MOTIF = process.argv.includes('--with-motif');

function plate(slug) {
  const d = P[slug];
  const iconPath = join(ICONS, `${slug}.png`);
  const icon = existsSync(iconPath)
    ? `data:image/png;base64,${readFileSync(iconPath).toString('base64')}`
    : null;

  return `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${W}px;height:${H}px;overflow:hidden;background:${d.ink}}
  .kv{position:relative;width:${W}px;height:${H}px;overflow:hidden;
      background:
        radial-gradient(120% 90% at 78% 18%, ${d.a}44 0%, transparent 55%),
        radial-gradient(90% 80% at 18% 88%, ${d.c}55 0%, transparent 60%),
        linear-gradient(160deg, ${d.ink} 0%, ${d.ink} 45%, ${d.c}22 100%);}
  svg{position:absolute;inset:0}
  /* motif：統一以輝光 + 色散渲染，避免變成扁平線稿 */
  .motif{filter:url(#glow)}
  .stroke,.holder,.chart,.chart2,.gate{stroke:${d.a};stroke-width:16;stroke-linecap:round;stroke-linejoin:round}
  .chart2{stroke:${d.b};stroke-width:9;opacity:.75}
  .ring{fill:none;stroke:${d.b};stroke-width:5;opacity:.5}
  .orb{fill:url(#orbg)}
  .rows rect,.rows2 rect,.tiles rect,.card-a rect,.qr,.row-out{fill:${d.a}}
  .packet rect,.sheet{fill:url(#surf)}
  .flap{fill:${d.c};opacity:.92}
  .rows2 rect{fill:${d.b}}
  .bars rect{fill:url(#barg);opacity:.9}
  .tiles rect:nth-child(2){fill:${d.b}}
  .nodes circle,.spark{fill:${d.b}}
  /* 顆粒與掃描層：讓畫面有「被運算出來」的質地，而不是乾淨的向量 */
  .grain{position:absolute;inset:-20%;opacity:.30;mix-blend-mode:overlay}
  .bloom{position:absolute;inset:0;
     background:radial-gradient(60% 45% at 72% 30%, ${d.a}55, transparent 70%);
     filter:blur(90px)}
  .vig{position:absolute;inset:0;
     background:radial-gradient(120% 100% at 50% 42%, transparent 40%, ${d.ink}dd 100%)}
  /* 左下留白區 —— icon 與 slogan 疊在這裡，所以壓暗降噪。
     必須鋪滿整個畫布再用橢圓漸層收邊：第一版用 78%×52% 的方塊，
     右下角出現一條硬邊矩形，整張圖看起來像貼了一塊補丁。 */
  .quiet{position:absolute;inset:0;
     background:radial-gradient(115% 95% at 4% 104%, ${d.ink}f5 0%, ${d.ink}cc 34%, ${d.ink}55 58%, transparent 76%)}
  .plate{position:absolute;left:92px;bottom:96px;display:flex;flex-direction:column;gap:38px}
  .icon{width:132px;height:132px;border-radius:30px;display:block;
     box-shadow:0 2px 0 #ffffff22 inset, 0 26px 60px -20px #000000cc;}
  .slogan{font-family:'Space Grotesk',sans-serif;font-weight:500;font-size:62px;line-height:1.14;
     letter-spacing:-.028em;color:#fff;white-space:pre-line;max-width:17ch;
     text-shadow:0 2px 40px ${d.ink}}
</style>
<div class="kv">
  <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
    <defs>
      <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="26" result="b"/>
        <feColorMatrix in="b" type="matrix" result="cb"
          values="1 0 0 0 0  0 .96 0 0 0  0 0 1.06 0 0  0 0 0 .9 0"/>
        <feMerge><feMergeNode in="cb"/><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="orbg" cx="34%" cy="30%" r="76%">
        <stop offset="0" stop-color="${d.b}"/><stop offset=".55" stop-color="${d.a}"/>
        <stop offset="1" stop-color="${d.c}"/>
      </radialGradient>
      <linearGradient id="surf" x1="0" y1="0" x2=".6" y2="1">
        <stop offset="0" stop-color="${d.b}"/><stop offset=".42" stop-color="${d.a}"/>
        <stop offset="1" stop-color="${d.c}"/>
      </linearGradient>
      <linearGradient id="barg" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="${d.c}"/><stop offset="1" stop-color="${d.b}"/>
      </linearGradient>
      <filter id="flow" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.006" numOctaves="4" seed="${slug.length * 7}"/>
        <feColorMatrix type="matrix"
          values="0 0 0 0 ${parseInt(d.a.slice(1,3),16)/255}
                  0 0 0 0 ${parseInt(d.a.slice(3,5),16)/255}
                  0 0 0 0 ${parseInt(d.a.slice(5,7),16)/255}
                  .7 0 0 0 -.16"/>
      </filter>
      <filter id="noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
    </defs>
    <rect width="${W}" height="${H}" filter="url(#flow)" opacity="${WITH_MOTIF ? '.42' : '.62'}"/>
    ${WITH_MOTIF ? '' : `<g class="motif" opacity=".18"><circle cx="1120" cy="420" r="300" class="orb"/></g>`}
    ${WITH_MOTIF ? `<g class="motif">${d.motif}</g>` : ''}
  </svg>
  <div class="bloom"></div>
  <svg class="grain"><rect width="100%" height="100%" filter="url(#noise)"/></svg>
  <div class="vig"></div>
  <div class="quiet"></div>
  ${WITH_TEXT ? `<div class="plate">
    ${icon ? `<img class="icon" src="${icon}" alt="">` : ''}
    <div class="slogan">${d.slogan}</div>
  </div>` : ''}
</div>`;
}

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : Object.keys(P);
if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true });

for (const slug of only) {
  if (!P[slug]) { console.error(`❌ 未知產品 ${slug}`); continue; }
  const tmp = join(OUT, `.${slug}.html`);
  writeFileSync(tmp, plate(slug));
  try {
    execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${W},${H}`, '--virtual-time-budget=6000',
      `--screenshot=${join(OUT, `${slug}.png`)}`, `file://${tmp}`,
    ], { stdio: 'ignore' });
    console.log(`   ✓ ${slug}`);
  } finally {
    if (!args.includes('--html')) rmSync(tmp, { force: true });
  }
}
console.log('✅ site-assets/kv-gen/');
