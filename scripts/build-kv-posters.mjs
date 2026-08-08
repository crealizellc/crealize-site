#!/usr/bin/env node
/* ============================================================
   build-kv-posters — 產生 Selected Work 主視覺的「小海報」HTML

   為什麼是自己排版而不是 AI 生成（2026-08-08 Yves 定調）：
   他要的是「一張小海報：產品畫面 + Logo + Slogan」。這三個素材本來就都有
   （site-assets/shots、site-assets/icons、下方 PRODUCTS 的 slogan），
   AI 生成反而拿不到真實畫面、字會爛、還要燒 credit。
   自己排版＝真實截圖 + 真實 logo + 對到設計契約的 Space Grotesk 字體，
   而且可以零成本即時重排。

   被否決的兩個方向（記在這裡避免重蹈）：
   v1 純幾何 SVG → 「太醜、莫名其妙、一點意義都沒有」
   v2 AI 生成燙金壓凹 → 「這個莫名其妙你弄成好像一個實體印刷產品了，
      他是一個遊戲呀為什麼要壓在棉紙上呢？又不是飯店的廣告」

   輸出：docs/design-system/source/kv-posters.html（供 render-kv.mjs 渲染）
   ============================================================ */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/design-system/source/kv-posters.html');

/* slogan 一律英文、三語共用（Yves：「可以加英文 Slogan，適用所有版本沒關係」）。
   bg = 該產品品牌色系的環境底；ink = 該底色上的文字色。
   色值來源見 docs/design-system/product-palette.json（有原始碼者為第一手複驗）。 */
const PRODUCTS = [
  { slug: 'puritylens', name: 'PurityLens', slogan: 'Know what’s in it.',
    bg: ['#EEF3F8', '#C6D4E2'], ink: '#1B2A38', glow: '#9AB0C6', beam: '#5B7C9E' },
  { slug: 'fudeto', name: 'Fudeto', slogan: 'One stroke. Every morning.',
    bg: ['#FBF9F2', '#EDE2C4'], ink: '#1A1A1A', glow: '#EAB308', beam: '#B98A05' },
  { slug: 'kichitto', name: 'Kichitto', slogan: 'Receipts, filed by AI.',
    bg: ['#FDF3ED', '#F3CDB8'], ink: '#3A1D0E', glow: '#E97B47', beam: '#C25A28' },
  { slug: 'qiflux', name: 'QiFlux', slogan: 'Your cycle, kept quiet.',
    bg: ['#F7DDE4', '#4A1B52'], ink: '#2A0E31', glow: '#F2BBBB', beam: '#8E4A86' },
  { slug: 'meishitto', name: 'Meishitto', slogan: 'Cards become contacts.',
    bg: ['#EFEFFB', '#C3C4F0'], ink: '#1B1B4A', glow: '#5254E0', beam: '#3B3CB8' },
  { slug: 'rythix2048', name: 'Rythix 2048', slogan: 'Merge on the beat.',
    bg: ['#EFD3E4', '#B9B9F2'], ink: '#241528', glow: '#9B6FB5', beam: '#7A4E96' },
  { slug: 'tendo', name: 'Tendo', slogan: 'One path. Every dot.',
    bg: ['#2A241C', '#14100B'], ink: '#F5F1E8', glow: '#C9A961', beam: '#C9A961' },
  { slug: 'xunni', name: 'XunNi', slogan: 'Where charts align.',
    bg: ['#1A1712', '#09090B'], ink: '#F6EBD6', glow: '#F59E0B', beam: '#F59E0B' },
  { slug: 'dicex3d', name: 'DiceX3D', slogan: 'Roll the bones.',
    bg: ['#E7F0E5', '#9DBE9C'], ink: '#16281A', glow: '#2E7D32', beam: '#2E7D32' },
  { slug: 'moonpacket', name: 'moonpacket', slogan: 'Red packets, on-chain.',
    bg: ['#16304F', '#0A1626'], ink: '#FFE9C7', glow: '#FFBA00', beam: '#FFBA00' },
  { slug: 'idokuta', name: 'iDokuta', slogan: 'Care across languages.',
    bg: ['#E6F5F3', '#A9DCD6'], ink: '#06322F', glow: '#04A29E', beam: '#037F7C' },
  { slug: 'mairi', name: 'Mairi', slogan: 'Your health, day by day.',
    bg: ['#FBF3EE', '#EFCFC2'], ink: '#3B1C12', glow: '#C95A3F', beam: '#A8452E' },
  { slug: 'meguru', name: 'Meguru', slogan: 'Commerce in circulation.',
    bg: ['#FBF5EF', '#E9CBD6'], ink: '#3A0A1E', glow: '#B51452', beam: '#8E0F3F' },
];

/* 逐張讀出截圖實際比例，讓裝置外框高度跟著它走 —— 零裁切。
   獨立 critic 2026-08-08 指出 mairi 底部導覽被邊框切成一半、xunni/idokuta/meishitto
   右側內容被切。根因是外框比例固定 0.4635 而截圖比例不一（mairi 0.50，偏差 +7.9%），
   object-fit:cover 就把差額吃掉了。改為外框遷就截圖，而不是截圖遷就外框。 */
function shotRatio(file) {
  const out = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
  const w = +/pixelWidth: (\d+)/.exec(out)[1];
  const h = +/pixelHeight: (\d+)/.exec(out)[1];
  return w / h;
}

const shots = join(ROOT, 'site-assets/shots');
const icons = join(ROOT, 'site-assets/icons');

/* 沒有產品畫面不是錯誤 —— 平台型產品（Meguru）本來就沒有消費者 UI，
   而 moonpacket 唯一的截圖是桌面網頁壓成手機寬、文字重疊不堪用。
   這類改走 mark 版型。但**每個產品至少要有 icon**，否則兩者皆缺就無從呈現。 */
const unusable = [];
for (const p of PRODUCTS) {
  const hasShot = existsSync(join(shots, `${p.slug}.png`));
  const hasIcon = existsSync(join(icons, `${p.slug}.png`));
  if (!hasShot && !hasIcon) unusable.push(`${p.slug}: 既無 screen 也無 icon`);
}
if (unusable.length) {
  console.error('❌ 素材不齊：\n  ' + unusable.join('\n  '));
  process.exit(2);
}
const markOnly = PRODUCTS.filter((p) => !existsSync(join(shots, `${p.slug}.png`))).map((p) => p.slug);
if (markOnly.length) console.log(`ℹ️  走 mark 版型（無產品畫面）：${markOnly.join(', ')}`);

/** 一張海報：左側 logo + slogan，右側裝置內嵌真實畫面。
    沒有可用產品畫面者（平台型、或截圖不堪用）改走 mark 版型：
    放大自家 mark，不放任何裝置或替代畫面 —— 寧可簡單，也不擺不屬於它的東西。 */
function poster(p) {
  const hasIcon = existsSync(join(icons, `${p.slug}.png`));
  const mark = hasIcon
    ? `<img class="mark" src="file://${icons}/${p.slug}.png" alt="">`
    : `<div class="mark mark--type">${p.name.slice(0, 1)}</div>`;
  const hasShot = existsSync(join(shots, `${p.slug}.png`));
  const shot = `file://${shots}/${p.slug}.png`;
  const PAD = 11, INNER_W = 444;
  const phoneH = hasShot
    ? Math.round(INNER_W / shotRatio(join(shots, `${p.slug}.png`))) + PAD * 2
    : 980;
  if (!hasShot) {
    return `
<div class="kv kv--mark" id="kv-${p.slug}" style="--bg1:${p.bg[0]};--bg2:${p.bg[1]};--ink:${p.ink};--glow:${p.glow};--beam:${p.beam}">
  <div class="beams"></div>
  <div class="glow"></div>
  <div class="markonly">
    <div class="markwrap markwrap--xl">${mark}</div>
    <div class="slogan slogan--center">${p.slogan}</div>
    <div class="rule rule--center"></div>
  </div>
</div>`;
  }
  return `
<div class="kv" id="kv-${p.slug}" style="--bg1:${p.bg[0]};--bg2:${p.bg[1]};--ink:${p.ink};--glow:${p.glow};--beam:${p.beam}">
  <div class="beams"></div>
  <div class="glow"></div>
  <div class="left">
    <div class="markwrap">${mark}</div>
    <div class="slogan">${p.slogan}</div>
    <div class="rule"></div>
  </div>
  <div class="right">
    <div class="stage">
      <div class="phone" style="height:${phoneH}px"><img src="${shot}" alt=""></div>
      <div class="reflect" style="height:${Math.round(phoneH * 0.28)}px">
        <img src="${shot}" style="height:${phoneH}px" alt="">
      </div>
    </div>
  </div>
</div>`;
}

const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8" />
<title>Crealize — Work Key Visual Posters</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0;padding:0;background:#8C8C87}
  .kv{
    width:1600px;height:1200px;margin:0 auto 40px;position:relative;overflow:hidden;
    display:grid;grid-template-columns:1fr 1fr;align-items:center;
    background:linear-gradient(150deg,var(--bg1) 0%,var(--bg2) 100%);
    font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;
  }
  .kv:last-child{margin-bottom:0}

  /* 光束：自裝置後方放射的細光條，被徑向遮罩收在中心 —— 這是讓畫面「有能量」的關鍵，
     v3 第一版缺的就是它（平淡漸層讀起來像簡報底圖）。 */
  .beams{
    position:absolute;inset:-30%;
    /* 2026-08-08 修：原本用 repeating-conic 做爆裂狀光芒，13 張排在一起時
       同一個放射圖樣變成通病，縮小後整版像套版，效果本身也偏俗。
       改為單一柔和斜向光帶，只負責讓背景有方向性。 */
    background:linear-gradient(112deg, transparent 34%, var(--beam) 50%, transparent 66%);
    opacity:.14;
    filter:blur(60px);
  }
  /* 環境光：裝置背後的大面積品牌色光暈 */
  .glow{
    position:absolute;width:1240px;height:1240px;border-radius:999px;
    right:-140px;top:-220px;
    background:radial-gradient(circle,var(--glow) 0%,transparent 66%);
    opacity:.55;filter:blur(30px);
  }

  .left{position:relative;padding:0 0 0 118px;z-index:3}
  /* logo 外圈發光，讓它從背景浮起來 */
  .markwrap{
    width:138px;height:138px;border-radius:10px;position:relative;
    box-shadow:0 0 0 1px rgba(255,255,255,.14),
               0 26px 54px rgba(0,0,0,.32),
               0 0 70px -10px var(--glow);
  }
  .mark{width:100%;height:100%;border-radius:10px;display:block}
  .mark--type{
    display:grid;place-items:center;font-size:68px;font-weight:700;
    background:var(--glow);color:var(--bg1);border-radius:10px;
  }
  .slogan{
    margin-top:60px;font-size:72px;line-height:1.08;font-weight:600;
    letter-spacing:-.03em;color:var(--ink);max-width:540px;
    text-shadow:0 2px 30px rgba(0,0,0,.14);
  }
  .rule{margin-top:46px;width:104px;height:6px;border-radius:2px;
        background:var(--glow);box-shadow:0 0 24px -2px var(--glow)}

  /* mark 版型：無裝置，logo 放大置中 */
  .kv--mark{grid-template-columns:1fr}
  .markonly{position:relative;z-index:3;display:grid;justify-items:center;text-align:center}
  .markwrap--xl{width:250px;height:250px;border-radius:20px}
  .markwrap--xl .mark{border-radius:20px}
  .slogan--center{max-width:820px;margin-top:66px;text-align:center}
  .rule--center{margin-left:auto;margin-right:auto}

  .right{position:relative;display:grid;place-items:center;z-index:3}
  .stage{position:relative;transform:rotate(-7deg) translateY(10px)}
  /* 裝置：真實截圖 + 邊緣高光 + 深落影（帶品牌色調） */
  .phone{
    width:466px;border-radius:54px;overflow:hidden;
    background:#0A0A0B;padding:11px;box-sizing:border-box;position:relative;
    box-shadow:
      inset 0 0 0 1px rgba(255,255,255,.22),
      0 8px 20px rgba(0,0,0,.30),
      0 70px 110px rgba(0,0,0,.45),
      0 0 120px -20px var(--glow);
  }
    /* 外框比例已逐張對齊截圖，故用 fill 不裁切（原為 cover + top center，會切掉底部） */
  .phone img{width:100%;height:100%;object-fit:fill;display:block;border-radius:44px}
  /* 反射：裝置下方的鏡射淡出 */
  .reflect{
    position:absolute;left:0;top:100%;width:466px;
    border-radius:54px;overflow:hidden;transform:scaleY(-1);opacity:.20;
    -webkit-mask-image:linear-gradient(to top, transparent 0%, #000 96%);
    mask-image:linear-gradient(to top, transparent 0%, #000 96%);
  }
  .reflect img{width:466px;object-fit:fill;display:block}
</style></head><body>
${PRODUCTS.map(poster).join('\n')}
</body></html>
`;

writeFileSync(OUT, html);
console.log(`✅ ${PRODUCTS.length} 張海報 → ${OUT.replace(ROOT + '/', '')}`);
console.log('   接著跑：node scripts/render-kv.mjs docs/design-system/source/kv-posters.html');
