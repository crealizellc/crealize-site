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
    bg: ['#EEF3F8', '#C6D4E2'], ink: '#1B2A38', glow: '#9AB0C6', beam: '#5B7C9E', variant: 'detail', crop: '50% 30%', zoom: 2.1 },
  { slug: 'fudeto', name: 'Fudeto', slogan: 'One stroke. Every morning.',
    bg: ['#FBF9F2', '#EDE2C4'], ink: '#1A1A1A', glow: '#EAB308', beam: '#B98A05', variant: 'detail', crop: '50% 20%', zoom: 2.6 },
  { slug: 'kichitto', name: 'Kichitto', slogan: 'Receipts, filed by AI.',
    bg: ['#FDF3ED', '#F3CDB8'], ink: '#3A1D0E', glow: '#E97B47', beam: '#C25A28', variant: 'field', crop: '50% 18%', zoom: 2.4 },
  { slug: 'qiflux', name: 'QiFlux', slogan: 'Your cycle, kept quiet.',
    bg: ['#F7DDE4', '#4A1B52'], ink: '#2A0E31', glow: '#F2BBBB', beam: '#8E4A86', variant: 'detail', crop: '50% 45%', zoom: 2.0 },
  { slug: 'meishitto', name: 'Meishitto', slogan: 'Cards become contacts.',
    bg: ['#EFEFFB', '#C3C4F0'], ink: '#1B1B4A', glow: '#5254E0', beam: '#3B3CB8', variant: 'detail', crop: '50% 34%', zoom: 1.9 },
  { slug: 'rythix2048', name: 'Rythix 2048', slogan: 'Merge on the beat.',
    bg: ['#EFD3E4', '#B9B9F2'], ink: '#241528', glow: '#9B6FB5', beam: '#7A4E96', variant: 'detail', crop: '50% 46%', zoom: 1.9 },
  { slug: 'tendo', name: 'Tendo', slogan: 'One path. Every dot.',
    bg: ['#2A241C', '#14100B'], ink: '#F5F1E8', glow: '#C9A961', beam: '#C9A961', variant: 'detail', crop: '50% 40%', zoom: 2.0 },
  { slug: 'xunni', name: 'XunNi', slogan: 'Where charts align.',
    bg: ['#1A1712', '#09090B'], ink: '#F6EBD6', glow: '#F59E0B', beam: '#F59E0B', variant: 'field', crop: '50% 26%', zoom: 2.3 },
  { slug: 'moonpacket', name: 'moonpacket', slogan: 'Red packets, on-chain.',
    bg: ['#16304F', '#0A1626'], ink: '#FFE9C7', glow: '#FFBA00', beam: '#FFBA00', variant: 'mark', crop: '50% 50%', zoom: 1 },
  { slug: 'idokuta', name: 'iDokuta', slogan: 'Care across languages.',
    bg: ['#E6F5F3', '#A9DCD6'], ink: '#06322F', glow: '#04A29E', beam: '#037F7C', variant: 'field', crop: '50% 30%', zoom: 2.6 },
  { slug: 'mairi', name: 'Mairi', slogan: 'Your health, day by day.',
    bg: ['#FBF3EE', '#EFCFC2'], ink: '#3B1C12', glow: '#C95A3F', beam: '#A8452E', variant: 'field', crop: '50% 26%', zoom: 2.2 },
  { slug: 'meguru', name: 'Meguru', slogan: 'Commerce in circulation.',
    bg: ['#FBF5EF', '#E9CBD6'], ink: '#3A0A1E', glow: '#B51452', beam: '#8E0F3F', variant: 'mark', crop: '50% 50%', zoom: 1 },
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

/** 一張卡：大字排版為主角，UI 局部滿版出血為輔。

    2026-08-08 第三次改版。Yves：「故意放個手機是 10 年前的設計了，要有設計感」
    「字體可以大一點」。前一版把整支手機放進畫面，是 2015 年前後 app 行銷的語彙；
    現在的作法是**不畫裝置**，直接讓真實 UI 以裁切面出血，當成色塊與紋理使用，
    版面主角讓給字。

    沒有可用 UI 者（平台型 Meguru、截圖不堪用的 moonpacket）走 mark 版型。 */
function poster(p) {
  const hasIcon = existsSync(join(icons, `${p.slug}.png`));
  const mark = hasIcon
    ? `<img class="mark" src="file://${icons}/${p.slug}.png" alt="">`
    : `<div class="mark mark--type">${p.name.slice(0, 1)}</div>`;
  const hasShot = existsSync(join(shots, `${p.slug}.png`));
  const shot = `file://${shots}/${p.slug}.png`;

  const v = p.variant || 'bleed-right';

  /* field：文字密集的 App 不放 UI 裁切 —— 真實 UI 到處是文字，任何裁切都會切出
     半個單字（實測 kichitto 出現半個「収入 ¥33」、idokuta 出現半個「Symptoms」），
     半讀的字看起來像壞掉。這類改用品牌色場 + logo + 大字。 */
  if (v === 'mark' || v === 'field' || !hasShot) {
    return `
<div class="kv kv--${v === 'field' ? 'field' : 'mark'}" id="kv-${p.slug}" style="--bg1:${p.bg[0]};--bg2:${p.bg[1]};--ink:${p.ink};--glow:${p.glow};--beam:${p.beam}">
  <div class="wash"></div>
  <div class="type type--center">
    <div class="markwrap markwrap--xl">${mark}</div>
    <h2 class="slogan">${p.slogan}</h2>
  </div>
</div>`;
  }

  const img = `<img src="${shot}" style="object-position:${p.crop};transform:scale(${p.zoom || 1})" alt="">`;
  return `
<div class="kv kv--${v}" id="kv-${p.slug}" style="--bg1:${p.bg[0]};--bg2:${p.bg[1]};--ink:${p.ink};--glow:${p.glow};--beam:${p.beam}">
  <div class="wash"></div>
  <div class="crop">${img}</div>
  <div class="type">
    <div class="markwrap">${mark}</div>
    <h2 class="slogan">${p.slogan}</h2>
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
    background:linear-gradient(158deg,var(--bg1) 0%,var(--bg2) 100%);
    font-family:'Space Grotesk','Helvetica Neue',Helvetica,Arial,sans-serif;
  }
  .kv:last-child{margin-bottom:0}

  /* 單一柔和光帶，只給背景方向性，不做花俏效果 */
  .wash{
    position:absolute;inset:-20%;
    background:linear-gradient(112deg, transparent 30%, var(--beam) 50%, transparent 70%);
    opacity:.13;filter:blur(80px);
  }

  /* 字是主角：slogan 由 72px 拉到 118px */
  .type{
    position:absolute;left:104px;top:50%;transform:translateY(-50%);
    z-index:3;max-width:760px;
  }
  .markwrap{
    width:104px;height:104px;border-radius:22px;overflow:hidden;
    box-shadow:0 18px 40px rgba(0,0,0,.22);
  }
  .mark{width:100%;height:100%;display:block}
  .mark--type{
    display:grid;place-items:center;font-size:52px;font-weight:700;
    background:var(--glow);color:var(--bg1);width:100%;height:100%;
  }
  .slogan{
    margin:56px 0 0;font-size:118px;line-height:.98;font-weight:600;
    letter-spacing:-.045em;color:var(--ink);
  }

  /* UI 局部：不畫裝置，直接以裁切面出血，當色塊與紋理用。
     三種構圖讓 12 張各有面貌，但字體與 logo 的位置/尺寸系統維持一致
     （Yves：「每個產品可以不用一樣的風格…但字體、Logo 統一好風格」）。 */
  .crop{position:absolute;overflow:hidden;z-index:2}
  .crop img{width:100%;height:100%;object-fit:cover;display:block;transform-origin:center}

  /* A. 右側出血 */
  .kv--bleed-right .crop{
    right:0;top:0;bottom:0;width:46%;
    -webkit-mask-image:linear-gradient(to right, transparent 0, #000 18%);
    mask-image:linear-gradient(to right, transparent 0, #000 18%);
  }
  /* B. 底部橫幅出血 —— 字在上方，UI 成為一條橫帶 */
  .kv--bleed-bottom .crop{
    left:0;right:0;bottom:0;height:42%;
    -webkit-mask-image:linear-gradient(to bottom, transparent 0, #000 26%);
    mask-image:linear-gradient(to bottom, transparent 0, #000 26%);
  }
  .kv--bleed-bottom .type{top:auto;bottom:52%;transform:none}
  /* C. 局部特寫 —— 右側方塊，圓角裁切，像一片被取下的介面 */
  .kv--detail .crop{
    right:72px;top:50%;transform:translateY(-50%);
    width:700px;height:700px;border-radius:28px;
    box-shadow:0 40px 90px rgba(0,0,0,.28);
  }

  /* mark 版型：無 UI 可用者，字與標置中 */
  .kv--field .type--center{
    position:absolute;left:104px;top:50%;transform:translateY(-50%);
    display:grid;justify-items:start;text-align:left;max-width:900px;
  }
  .kv--field .markwrap{width:104px;height:104px;border-radius:22px}
  .kv--field .slogan{font-size:118px;text-align:left}

  .kv--mark .type--center{
    position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
    display:grid;justify-items:center;text-align:center;max-width:1100px;
  }
  .kv--mark .markwrap{width:150px;height:150px;border-radius:30px}
  .kv--mark .slogan{font-size:112px;text-align:center}
</style></head><body>
${PRODUCTS.map(poster).join('\n')}
</body></html>
`;

writeFileSync(OUT, html);
console.log(`✅ ${PRODUCTS.length} 張海報 → ${OUT.replace(ROOT + '/', '')}`);
console.log('   接著跑：node scripts/render-kv.mjs docs/design-system/source/kv-posters.html');
