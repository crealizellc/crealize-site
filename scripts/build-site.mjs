#!/usr/bin/env node
/* ============================================================
   CREALIZE site builder
   docs/design-system/source/claude-design-export/Crealize Corporate Site.html
   → site/index.html (en) + site/ja/index.html + site/zh/index.html
   - strips design-canvas-only scripts (React/babel/tweaks)
   - injects locale i18n script + translated static copy
   - injects per-locale SEO head (canonical/hreflang/OG/JSON-LD)
   ============================================================ */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/design-system/source/claude-design-export/Crealize Corporate Site.html');
const OUT = join(ROOT, 'site');
const ORIGIN = 'https://crealize.llc';

const LOCALES = {
  en: {
    dir: '', base: '', htmlLang: 'en', ogLocale: 'en_US',
    title: 'Crealize — Transforming Imagination into Reality | Tokyo Product Studio',
    desc: 'Crealize is a Tokyo-based independent product studio. We carry products from 0 to 1 — validate, build, ship, polish. Flutter, Next.js, Cloudflare, AI.',
    t: {}, // EN = source copy, no replacements
  },
  ja: {
    dir: 'ja', base: '../', htmlLang: 'ja', ogLocale: 'ja_JP',
    title: 'Crealize — 想像を、現実に。| 東京のプロダクトスタジオ',
    desc: 'Crealize は東京のインディペンデント・プロダクトスタジオ。プロダクトを 0→1 へ — 検証、構築、出荷、研磨。Flutter、Next.js、Cloudflare、AI。',
    t: {
      '東京 / Tokyo — Independent Product Studio': '東京 — インディペンデント・プロダクトスタジオ',
      'Transforming imagination into reality.': '想像を、現実に。',
      'Creative <span class="x">×</span> Realize — ideas are vapor; we condense them to <b>1.0</b>.':
        'Creative <span class="x">×</span> Realize — アイデアは蒸気。私たちはそれを <b>1.0</b> に凝縮する。',
      'Scroll to materialize': 'スクロールで実体化',
      '<span class="line">An idea weighs nothing <em>until it ships.</em></span>':
        '<span class="line">アイデアは、出荷されるまで<em>質量を持たない。</em></span>',
      '<span class="line">We carry products from <span class="accent">0&thinsp;→&thinsp;1</span> — validate, build, ship, polish.</span>':
        '<span class="line">私たちはプロダクトを <span class="accent">0&thinsp;→&thinsp;1</span> へ運ぶ — 検証、構築、出荷、研磨。</span>',
      'Everything interesting happens between&nbsp;0&nbsp;and&nbsp;1.':
        '面白いことはぜんぶ、0 と 1 のあいだで起こる。',
      'We hire <span class="accent">makers</span>,<br/>not résumés.':
        '履歴書ではなく、<br/><span class="accent">「作る人」</span>を採用する。',
      'A small constellation — remote-first, asynchronous, allergic to theater. Tokyo is our origin point; your timezone is whatever your terminal says. Bring one thing you shipped and still love.':
        '小さな星座 — リモートファースト、非同期、芝居アレルギー。原点は東京。あなたのタイムゾーンは、ターミナルが示すまま。「出荷して、今も愛している何か」をひとつ持ってきてください。',
      '<span class="k">Base</span>': '<span class="k">拠点</span>',
      '<span class="k">Roles</span>': '<span class="k">職種</span>',
      '<span class="k">Contact</span>': '<span class="k">連絡先</span>',
      '<label for="f-name">Name <span class="req">*</span></label>': '<label for="f-name">お名前 <span class="req">*</span></label>',
      '<label for="f-email">Email <span class="req">*</span></label>': '<label for="f-email">メール <span class="req">*</span></label>',
      '<label for="f-link">Link <span class="opt">optional</span></label>': '<label for="f-link">リンク <span class="opt">任意</span></label>',
      '<label for="f-msg">Message <span class="req">*</span></label>': '<label for="f-msg">メッセージ <span class="req">*</span></label>',
      'placeholder="Your name"': 'placeholder="お名前"',
      'placeholder="you@studio.com"': 'placeholder="you@studio.com"',
      'placeholder="A thing you shipped"': 'placeholder="あなたが出荷したもの"',
      'placeholder="What do you want to build with us?"': 'placeholder="私たちと何をつくりたいですか？"',
      '<span class="btn__label">Send message</span>': '<span class="btn__label">メッセージを送る</span>',
      'We reply within two working days · Tokyo (JST).': '2営業日以内に返信します · 東京 (JST)',
      '>Start a project</a>': '>プロジェクトの相談</a>',
    },
  },
  zh: {
    dir: 'zh', base: '../', htmlLang: 'zh-Hant', ogLocale: 'zh_TW',
    title: 'Crealize — 把想像變成現實 | 東京獨立產品工作室',
    desc: 'Crealize 是位於東京的獨立產品工作室。我們把產品從 0 帶到 1 — 驗證、構築、出貨、打磨。Flutter、Next.js、Cloudflare、AI。',
    t: {
      '東京 / Tokyo — Independent Product Studio': '東京 — 獨立產品工作室',
      'Transforming imagination into reality.': '把想像，變成現實。',
      'Creative <span class="x">×</span> Realize — ideas are vapor; we condense them to <b>1.0</b>.':
        'Creative <span class="x">×</span> Realize — 點子是蒸氣；我們把它凝結成 <b>1.0</b>。',
      'Scroll to materialize': '捲動以實體化',
      '<span class="line">An idea weighs nothing <em>until it ships.</em></span>':
        '<span class="line">點子在出貨之前，<em>沒有重量。</em></span>',
      '<span class="line">We carry products from <span class="accent">0&thinsp;→&thinsp;1</span> — validate, build, ship, polish.</span>':
        '<span class="line">我們把產品從 <span class="accent">0&thinsp;→&thinsp;1</span> — 驗證、構築、出貨、打磨。</span>',
      'Everything interesting happens between&nbsp;0&nbsp;and&nbsp;1.':
        '所有有趣的事，都發生在 0 與 1 之間。',
      'We hire <span class="accent">makers</span>,<br/>not résumés.':
        '我們僱用<span class="accent">創作者</span>，<br/>不是履歷。',
      'A small constellation — remote-first, asynchronous, allergic to theater. Tokyo is our origin point; your timezone is whatever your terminal says. Bring one thing you shipped and still love.':
        '一個小小的星座 — 遠端優先、非同步、對表演過敏。東京是我們的原點；你的時區，就是你終端機顯示的那個。帶一件你出貨過、至今仍深愛的作品來。',
      '<span class="k">Base</span>': '<span class="k">據點</span>',
      '<span class="k">Roles</span>': '<span class="k">職位</span>',
      '<span class="k">Contact</span>': '<span class="k">聯絡</span>',
      '<label for="f-name">Name <span class="req">*</span></label>': '<label for="f-name">姓名 <span class="req">*</span></label>',
      '<label for="f-email">Email <span class="req">*</span></label>': '<label for="f-email">Email <span class="req">*</span></label>',
      '<label for="f-link">Link <span class="opt">optional</span></label>': '<label for="f-link">連結 <span class="opt">選填</span></label>',
      '<label for="f-msg">Message <span class="req">*</span></label>': '<label for="f-msg">訊息 <span class="req">*</span></label>',
      'placeholder="Your name"': 'placeholder="你的名字"',
      'placeholder="A thing you shipped"': 'placeholder="一件你出貨過的作品"',
      'placeholder="What do you want to build with us?"': 'placeholder="想跟我們一起做什麼？"',
      '<span class="btn__label">Send message</span>': '<span class="btn__label">送出訊息</span>',
      'We reply within two working days · Tokyo (JST).': '兩個工作天內回覆 · 東京 (JST)',
      '>Start a project</a>': '>開始一個專案</a>',
    },
  },
};

const PRODUCTS = [
  { name: 'PurityLens', cat: 'HealthApplication', os: 'iOS', desc: { en: 'AI skincare-ingredient safety scanner: photo → OCR → analysis.', ja: '撮影 → OCR → 判定。スキンケア成分のAI安全分析。', zh: '拍照 → OCR → 判定。AI 護膚成分安全分析。' } },
  { name: 'Fudeto', cat: 'GameApplication', os: 'iOS, Android', desc: { en: 'Daily one-stroke puzzle: one stroke, one graph, every morning.', ja: '一筆、一グラフ、毎朝の一筆書きパズル。', zh: '一筆、一圖、每個早晨的一筆畫謎題。' } },
  { name: 'Kichitto', cat: 'FinanceApplication', os: 'iOS', desc: { en: 'Receipt capture for solo founders: photo → AI OCR → auto-filed to Drive + Sheets.', ja: '領収書を撮影 → AI OCR → Drive + Sheets へ自動整理。', zh: '收據拍照 → AI OCR → 自動歸檔 Drive + Sheets。' } },
  { name: 'QiFlux', cat: 'HealthApplication', os: 'iOS', desc: { en: 'The quiet, privacy-first cycle tracker.', ja: '静かでプライバシー第一の周期トラッカー。', zh: '安靜、隱私優先的週期記錄。' } },
  { name: 'iDokuta', cat: 'MedicalApplication', os: 'iOS, Android', desc: { en: 'Multilingual telehealth for foreigners in Japan (in development).', ja: '在日外国人向け多言語オンライン診療（開発中）。', zh: '在日外國人多語線上診療（開發中）。' } },
  { name: 'Mairi', cat: 'HealthApplication', os: 'iOS, Android', desc: { en: 'Daily personal health record × hospital integration (in development).', ja: '毎日の健康記録 × 病院連携（開発中）。', zh: '每日健康紀錄 × 醫院整合（開發中）。' } },
  { name: 'Tendo', cat: 'GameApplication', os: 'Web', desc: { en: 'Daily Hamiltonian-path puzzle (in development).', ja: '一日一道のハミルトン路パズル（開発中）。', zh: '每日漢米爾頓路徑謎題（開發中）。' } },
];

function jsonLd(loc, key) {
  const org = {
    '@type': 'Organization',
    '@id': `${ORIGIN}/#org`,
    name: 'Crealize LLC',
    url: `${ORIGIN}/`,
    logo: `${ORIGIN}/assets/crealize-mark.png`,
    email: 'support@crealize.llc',
    slogan: 'Transforming imagination into reality.',
    address: { '@type': 'PostalAddress', addressLocality: 'Tokyo', addressCountry: 'JP' },
  };
  const site = {
    '@type': 'WebSite',
    '@id': `${ORIGIN}/#website`,
    url: `${ORIGIN}/`,
    name: 'Crealize',
    publisher: { '@id': `${ORIGIN}/#org` },
    inLanguage: loc.htmlLang,
  };
  const apps = PRODUCTS.map((p) => ({
    '@type': 'SoftwareApplication',
    name: p.name,
    applicationCategory: p.cat,
    operatingSystem: p.os,
    description: p.desc[key],
    author: { '@id': `${ORIGIN}/#org` },
  }));
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': [org, site, ...apps] });
}

function headBlock(loc, key) {
  const path = loc.dir ? `/${loc.dir}/` : '/';
  const b = loc.base;
  return `<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>${loc.title}</title>
<meta name="description" content="${loc.desc}" />
<link rel="canonical" href="${ORIGIN}${path}" />
<link rel="alternate" hreflang="en" href="${ORIGIN}/" />
<link rel="alternate" hreflang="ja" href="${ORIGIN}/ja/" />
<link rel="alternate" hreflang="zh-Hant" href="${ORIGIN}/zh/" />
<link rel="alternate" hreflang="x-default" href="${ORIGIN}/" />

<meta property="og:type" content="website" />
<meta property="og:site_name" content="Crealize" />
<meta property="og:title" content="${loc.title}" />
<meta property="og:description" content="${loc.desc}" />
<meta property="og:url" content="${ORIGIN}${path}" />
<meta property="og:image" content="${ORIGIN}/assets/og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:locale" content="${loc.ogLocale}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${loc.title}" />
<meta name="twitter:description" content="${loc.desc}" />
<meta name="twitter:image" content="${ORIGIN}/assets/og.png" />

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Bricolage+Grotesque:wght@600;700&family=Newsreader:ital,opsz,wght@1,18,400;1,18,500;0,18,400&family=Noto+Sans+JP:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

<link rel="icon" type="image/png" href="${b}assets/crealize-mark.png" />
<link rel="apple-touch-icon" href="${b}assets/crealize-mark.png" />
<link rel="stylesheet" href="${b}css/tokens.css" />
<link rel="stylesheet" href="${b}css/site.css" />
<link rel="stylesheet" href="${b}css/sections.css" />
<link rel="stylesheet" href="${b}css/work-modal.css" />
<script type="application/ld+json">${jsonLd(loc, key)}</script>`;
}

const src = readFileSync(SRC, 'utf8');

for (const [key, loc] of Object.entries(LOCALES)) {
  let html = src;

  // 1. replace whole <head> inner block
  html = html.replace(/<head>[\s\S]*?<\/head>/, `<head>\n${headBlock(loc, key)}\n</head>`);

  // 2. html lang attr (drop canvas-only data-jp)
  html = html.replace(/<html lang="en" data-jp="on">/, `<html lang="${loc.htmlLang}" data-jp="on">`);

  // 3. strip design-canvas-only pieces (tweaks mount div + React island), keep core scripts
  html = html.replace(/<!-- Tweaks mount -->\s*<div id="tweaks-root"><\/div>\s*/, '');
  html = html.replace(/<!-- React island : Tweaks only -->[\s\S]*?(?=<\/body>)/, '');

  // 4. language menu buttons → real locale links
  html = html.replace(
    /<div class="nav__langmenu" role="menu">[\s\S]*?<\/div>/,
    `<div class="nav__langmenu" role="menu">
        <a role="menuitem" class="${key === 'en' ? 'is-active' : ''}" href="${loc.base || './'}" hreflang="en" lang="en">English</a>
        <a role="menuitem" class="${key === 'ja' ? 'is-active' : ''}" href="${loc.base}ja/" hreflang="ja" lang="ja">日本語</a>
        <a role="menuitem" class="${key === 'zh' ? 'is-active' : ''}" href="${loc.base}zh/" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>
      </div>`
  );

  // 5. core scripts: add i18n data before site.js, rebase paths
  html = html.replace(
    /<script src="js\/atmosphere.js"><\/script>\s*<script src="js\/hero.js"><\/script>\s*<script src="js\/site.js"><\/script>\s*<script src="js\/work-modal.js"><\/script>/,
    `<script src="${loc.base}js/atmosphere.js" defer></script>
<script src="${loc.base}js/hero.js" defer></script>
<script src="${loc.base}js/i18n/${key}.js"></script>
<script src="${loc.base}js/site.js" defer></script>
<script src="${loc.base}js/work-modal.js" defer></script>`
  );

  // 6. nav logo asset path
  html = html.replaceAll('src="assets/crealize-mark.png"', `src="${loc.base}assets/crealize-mark.png"`);

  // 7. locale copy replacements
  for (const [from, to] of Object.entries(loc.t)) {
    if (!html.includes(from)) {
      console.warn(`⚠️  [${key}] source string not found: ${from.slice(0, 60)}…`);
      continue;
    }
    html = html.replaceAll(from, to);
  }

  // sanity: core scripts must survive all transforms
  for (const must of ['js/site.js', 'js/hero.js', `js/i18n/${key}.js`, 'application/ld+json']) {
    if (!html.includes(must)) throw new Error(`[${key}] build output missing: ${must}`);
  }
  if (html.includes('text/babel') || html.includes('tweaks')) {
    throw new Error(`[${key}] design-canvas-only code leaked into output`);
  }

  const outDir = loc.dir ? join(OUT, loc.dir) : OUT;
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), html);
  console.log(`✅ ${key} → ${join(outDir, 'index.html')} (${(html.length / 1024).toFixed(1)} KB)`);
}
