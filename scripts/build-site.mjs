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
    desc: 'Crealize is a Tokyo-based independent product studio. We carry products from 0 to 1 — validate, build, ship, polish. Flutter, Next.js, TypeScript, AI.',
    stackLabel: 'Engineering principles',
    principles: ['Atomicity — one change, one meaning', 'Explicit dependencies', 'Module boundaries', 'Type-safe by default', 'Zero-dependency bias', 'Code as craft'],
    t: {
      '<h2 class="sec-head__kicker">Vision / 理念</h2>': '<h2 class="sec-head__kicker">Vision</h2>',
      '<h2 class="sec-head__kicker">Selected Work / 制作実績</h2>': '<h2 class="sec-head__kicker">Selected Work</h2>',
      '<h2 class="sec-head__kicker">Method / 進め方</h2>': '<h2 class="sec-head__kicker">Method</h2>',
      '<h2 class="sec-head__kicker">Join / Contact — 採用・お問い合わせ</h2>': '<h2 class="sec-head__kicker">Join / Contact</h2>',
    }, // EN: strip JP halves from functional labels
  },
  ja: {
    dir: 'ja', base: '../', htmlLang: 'ja', ogLocale: 'ja_JP',
    stackLabel: 'エンジニアリング原則',
    principles: ['原子性 — 1つの変更に1つの意味', '依存関係の明示', 'モジュール境界', '型安全がデフォルト', 'ゼロ依存志向', 'コードは工芸品'],
    title: 'Crealize — 想像を、現実に。| 東京のプロダクトスタジオ',
    desc: 'Crealize は東京の独立系プロダクトスタジオ。プロダクトを 0 から 1 へ — 検証、構築、リリース、磨き込み。Flutter、Next.js、TypeScript、AI。',
    t: {
      '<span class="nav__idx">01</span> Vision</a>': '<span class="nav__idx">01</span> 理念</a>',
      '<span class="nav__idx">02</span> Work</a>': '<span class="nav__idx">02</span> 制作実績</a>',
      '<span class="nav__idx">03</span> Method</a>': '<span class="nav__idx">03</span> 進め方</a>',
      '<span class="nav__idx">04</span> Join</a>': '<span class="nav__idx">04</span> 採用</a>',
      '<h2 class="sec-head__kicker">Vision / 理念</h2>': '<h2 class="sec-head__kicker">理念</h2>',
      '<h2 class="sec-head__kicker">Selected Work / 制作実績</h2>': '<h2 class="sec-head__kicker">制作実績</h2>',
      '<h2 class="sec-head__kicker">Method / 進め方</h2>': '<h2 class="sec-head__kicker">進め方</h2>',
      '<h2 class="sec-head__kicker">Join / Contact — 採用・お問い合わせ</h2>': '<h2 class="sec-head__kicker">採用・お問い合わせ</h2>',
      '<span class="foot__h">Studio</span>': '<span class="foot__h">スタジオ</span>',
      '<span class="foot__h">Contact</span>': '<span class="foot__h">連絡先</span>',
      '<a href="#vision">Vision</a>': '<a href="#vision">理念</a>',
      '<a href="#work">Work</a>': '<a href="#work">制作実績</a>',
      '<a href="#method">Method</a>': '<a href="#method">進め方</a>',
      '<a href="#join">Join</a>': '<a href="#join">採用</a>',
      'Tokyo, Japan <span class="jp-accent" aria-hidden="true">日本・東京</span>': '日本・東京',
      '<span class="foot__muted">Remote-first</span>': '<span class="foot__muted">リモートファースト</span>',
      '東京 / Tokyo — Independent Product Studio': '東京の独立系プロダクトスタジオ',
      'Transforming imagination into reality.': '想像を、現実に。',
      'Creative <span class="x">×</span> Realize — ideas are vapor; we condense them to <b>1.0</b>.':
        'Creative <span class="x">×</span> Realize — 曖昧なアイデアを、動く <b>1.0</b> に仕上げます。',
      'Scroll to materialize': 'スクロールすると、かたちになります',
      '<span class="line">An idea weighs nothing <em>until it ships.</em></span>':
        '<span class="line">アイデアは、<em>リリースされるまで</em>価値を持ちません。</span>',
      '<span class="line">We carry products from <span class="accent">0&thinsp;→&thinsp;1</span> — validate, build, ship, polish.</span>':
        '<span class="line">私たちはプロダクトを <span class="accent">0&thinsp;→&thinsp;1</span> へ — 検証し、つくり、世に出し、磨き上げます。</span>',
      'Everything interesting happens between&nbsp;0&nbsp;and&nbsp;1.':
        '面白いことはすべて、0 と 1 のあいだで起こる。',
      'We hire <span class="accent">makers</span>,<br/>not résumés.':
        '履歴書より、<br/><span class="accent">あなたがつくったもの</span>を見せてください。',
      'A small constellation — remote-first, asynchronous, allergic to theater. Tokyo is our origin point; your timezone is whatever your terminal says. Bring one thing you shipped and still love.':
        '私たちは少人数のリモートチームです。会議や形式より、動くものをつくることを大切にしています。拠点は東京、働く時間帯は自由。応募の際は、自分でつくって今も気に入っているものを、ひとつ見せてください。',
      '<span class="v">Remote-first · Tokyo HQ <span class="jp-accent" aria-hidden="true">東京</span></span>': '<span class="v">リモートファースト · 東京本社</span>',
      '<span class="v">Design · Engineering · Growth</span>': '<span class="v">デザイン · エンジニアリング · グロース</span>',
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
    stackLabel: '工程原則',
    principles: ['原子化 — 一個改動，一個意義', '依賴顯式化', '模組邊界', '型別安全為預設', '零依賴傾向', '程式碼即工藝'],
    title: 'Crealize — 把想像變成現實 | 東京獨立產品工作室',
    desc: 'Crealize 是位於東京的獨立產品工作室。我們把產品從 0 帶到 1 — 驗證、打造、上線、打磨。Flutter、Next.js、TypeScript、AI。',
    t: {
      '<span class="nav__idx">01</span> Vision</a>': '<span class="nav__idx">01</span> 理念</a>',
      '<span class="nav__idx">02</span> Work</a>': '<span class="nav__idx">02</span> 作品</a>',
      '<span class="nav__idx">03</span> Method</a>': '<span class="nav__idx">03</span> 方法</a>',
      '<span class="nav__idx">04</span> Join</a>': '<span class="nav__idx">04</span> 加入</a>',
      '<h2 class="sec-head__kicker">Vision / 理念</h2>': '<h2 class="sec-head__kicker">理念</h2>',
      '<h2 class="sec-head__kicker">Method / 進め方</h2>': '<h2 class="sec-head__kicker">工作方法</h2>',
      '<span class="foot__h">Studio</span>': '<span class="foot__h">工作室</span>',
      '<span class="foot__h">Contact</span>': '<span class="foot__h">聯絡</span>',
      '<a href="#vision">Vision</a>': '<a href="#vision">理念</a>',
      '<a href="#work">Work</a>': '<a href="#work">作品</a>',
      '<a href="#method">Method</a>': '<a href="#method">方法</a>',
      '<a href="#join">Join</a>': '<a href="#join">加入</a>',
      'Tokyo, Japan <span class="jp-accent" aria-hidden="true">日本・東京</span>': '日本・東京',
      '<span class="foot__muted">Remote-first</span>': '<span class="foot__muted">遠端優先</span>',
      '<span class="jp-accent hero__jp" aria-hidden="true">創造と実現</span>': '<span class="jp-accent hero__jp" aria-hidden="true">創造 × 實現</span>',
      '<span class="foot__muted">創造 × 実現</span>': '<span class="foot__muted">創造 × 實現</span>',
      '<span class="jp-accent sec-head__jp" aria-hidden="true">創造 × 実現</span>': '<span class="jp-accent sec-head__jp" aria-hidden="true">創造 × 實現</span>',
      '東京 / Tokyo — Independent Product Studio': '東京・獨立產品工作室',
      'Transforming imagination into reality.': '把想像，變成現實。',
      'Creative <span class="x">×</span> Realize — ideas are vapor; we condense them to <b>1.0</b>.':
        'Creative <span class="x">×</span> Realize — 把還很模糊的點子，做成能上線的 <b>1.0</b>。',
      'Scroll to materialize': '往下捲動，看想像成形',
      '<span class="line">An idea weighs nothing <em>until it ships.</em></span>':
        '<span class="line">點子在上線之前，<em>都還不算數。</em></span>',
      '<span class="line">We carry products from <span class="accent">0&thinsp;→&thinsp;1</span> — validate, build, ship, polish.</span>':
        '<span class="line">我們把產品從 <span class="accent">0&thinsp;→&thinsp;1</span> — 驗證、打造、上線、打磨。</span>',
      'Everything interesting happens between&nbsp;0&nbsp;and&nbsp;1.':
        '所有有趣的事，都發生在 0 與 1 之間。',
      'We hire <span class="accent">makers</span>,<br/>not résumés.':
        '我們看<span class="accent">作品</span>，<br/>不看履歷。',
      'A small constellation — remote-first, asynchronous, allergic to theater. Tokyo is our origin point; your timezone is whatever your terminal says. Bring one thing you shipped and still love.':
        '我們是一支小而精的遠端團隊：重成果、輕形式，不開沒必要的會。據點在東京，工作時區由你自己決定。應徵時，請帶上一件你親手做過、至今仍引以為傲的作品。',
      '<span class="v">Remote-first · Tokyo HQ <span class="jp-accent" aria-hidden="true">東京</span></span>': '<span class="v">遠端優先 · 東京總部</span>',
      '<span class="v">Design · Engineering · Growth</span>': '<span class="v">設計 · 工程 · 成長</span>',
      'Selected Work / 制作実績': '代表作品',
      'Join / Contact — 採用・お問い合わせ': '加入我們・聯絡',
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
      '>Start a project</a>': '>洽談專案</a>',
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
  { name: 'moonpacket', cat: 'FinanceApplication', os: 'Web, Telegram', desc: { en: 'Crypto red packets for Telegram communities — non-custodial, USDT / TON / SOL / ETH.', ja: 'Telegram コミュニティ向けクリプト紅包 — ノンカストディアル、USDT / TON / SOL / ETH 対応。', zh: 'Telegram 社群的加密貨幣紅包 — 非託管，支援 USDT / TON / SOL / ETH。' } },
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

  // 6.5 common rewrites (all locales): products count + engineering principles strip
  html = html.replace('>07 products<', '>08 products<');
  html = html.replace(
    /<span class="method__stack-label">Stack we master \/ 常用技術<\/span>\s*<ul class="method__stack-list">[\s\S]*?<\/ul>/,
    `<span class="method__stack-label">${loc.stackLabel}</span>
        <ul class="method__stack-list">
          ${loc.principles.map((p) => `<li>${p}</li>`).join('\n          ')}
        </ul>`
  );

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
