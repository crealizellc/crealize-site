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

/* 產品清單真相源 = site/js/i18n/en.js 的 CRZ_I18N.work（卡片實際渲染的那份）。
   本檔的 PRODUCTS 只補 registry 沒有、且與語言無關的 schema.org 中繼資料
   （applicationCategory / operatingSystem）+ 三語描述。兩者以名稱交叉驗證，
   不一致就中止建置 —— 以前兩份清單各自維護，且產品數是寫死的字串替換
   （'>07 products<' → '>08 products<'），加一個產品要記得改三個地方。 */
function loadWorkRegistry(root) {
  const src = readFileSync(join(root, 'site/js/i18n/en.js'), 'utf8');
  const win = {};
  new Function('window', src)(win);
  if (!win.CRZ_I18N?.work?.length) throw new Error('site/js/i18n/en.js 未產生 CRZ_I18N.work');
  return win.CRZ_I18N.work;
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/design-system/source/claude-design-export/Crealize Corporate Site.html');
const OUT = join(ROOT, 'site');
const ORIGIN = 'https://crealize.llc';

const LOCALES = {
  en: {
    dir: '', base: '', htmlLang: 'en', ogLocale: 'en_US',
    title: 'Crealize — Transforming Imagination into Reality | Tokyo Product Studio',
    desc: 'Crealize is an independent product studio in Tokyo. We research, design, build, launch, and improve digital products.',
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
    desc: 'Crealize は東京の独立系プロダクトスタジオです。調査、設計、開発、リリース、その後の改善まで一貫して取り組みます。',
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
      'Creative <span class="x">×</span> Realize — from first sketch to a product people can use.':
        'Creative <span class="x">×</span> Realize — アイデアを、実際に使われるプロダクトへ。',
      'Scroll to materialize': 'スクロールすると、かたちになります',
      '<span class="line">We turn promising ideas into <em>useful products.</em></span>':
        '<span class="line">着想を、<em>実際に役立つプロダクト</em>へ。</span>',
      '<span class="line">Research, design, engineering, launch — then keep improving.</span>':
        '<span class="line">調査、設計、開発、リリース。その後も改善を続けます。</span>',
      'A clear path from idea to launch.':
        'アイデアからリリースまで、明確な手順で進めます。',
      'Show us what<br/><span class="accent">you\'ve made.</span>':
        'これまでにつくったものを、<br/><span class="accent">見せてください。</span>',
      'We\'re a small, remote-first team based in Tokyo. We value clear communication, thoughtful craft, and work that reaches real users. If you\'d like to work with us, send one project you\'re proud of and tell us what you contributed.':
        '東京を拠点にする少人数のリモートチームです。わかりやすいコミュニケーション、丁寧なものづくり、実際に使われる成果を大切にしています。ご応募の際は、自信のあるプロジェクトをひとつ選び、担当したことを添えてお送りください。',
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
      '>Contact</a>': '>相談する</a>',
    },
  },
  zh: {
    dir: 'zh', base: '../', htmlLang: 'zh-Hant', ogLocale: 'zh_TW',
    stackLabel: '工程原則',
    principles: ['原子化 — 一個改動，一個意義', '依賴顯式化', '模組邊界', '型別安全為預設', '零依賴傾向', '程式碼即工藝'],
    title: 'Crealize — 把想像變成現實 | 東京獨立產品工作室',
    desc: 'Crealize 是位於東京的獨立產品工作室，從研究、設計、開發、上線到後續改進，全程參與數位產品製作。',
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
      'Creative <span class="x">×</span> Realize — from first sketch to a product people can use.':
        'Creative <span class="x">×</span> Realize — 把點子做成真正有人使用的產品。',
      'Scroll to materialize': '往下捲動，看想像成形',
      '<span class="line">We turn promising ideas into <em>useful products.</em></span>':
        '<span class="line">把值得做的點子，變成<em>實用的產品。</em></span>',
      '<span class="line">Research, design, engineering, launch — then keep improving.</span>':
        '<span class="line">從研究、設計、開發到上線，之後持續改進。</span>',
      'A clear path from idea to launch.':
        '從點子到上線，每一步都清楚。',
      'Show us what<br/><span class="accent">you\'ve made.</span>':
        '讓我們看看<br/><span class="accent">你做過的作品。</span>',
      'We\'re a small, remote-first team based in Tokyo. We value clear communication, thoughtful craft, and work that reaches real users. If you\'d like to work with us, send one project you\'re proud of and tell us what you contributed.':
        '我們是以東京為據點的小型遠端團隊，重視清楚溝通、紮實的設計與工程，以及真正被使用的成果。如果想加入我們，請選一個你最有信心的專案，告訴我們你負責了什麼。',
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
      '>Contact</a>': '>聯絡我們</a>',
    },
  },
};

const PRODUCTS = [
  { name: 'PurityLens', cat: 'HealthApplication', os: 'iOS', desc: { en: 'AI skincare-ingredient safety scanner: photo → OCR → analysis.', ja: '撮影 → OCR → 判定。スキンケア成分のAI安全分析。', zh: '拍照 → OCR → 判定。AI 護膚成分安全分析。' } },
  { name: 'Fudeto', cat: 'GameApplication', os: 'iOS, Android', desc: { en: 'Daily one-stroke puzzle: one stroke, one graph, every morning.', ja: '一筆、一グラフ、毎朝の一筆書きパズル。', zh: '一筆、一圖、每個早晨的一筆畫謎題。' } },
  { name: 'Kichitto', cat: 'FinanceApplication', os: 'iOS', desc: { en: 'Receipt capture for solo founders: photo → AI OCR → auto-filed to Drive + Sheets.', ja: '領収書を撮影 → AI OCR → Drive + Sheets へ自動整理。', zh: '收據拍照 → AI OCR → 自動歸檔 Drive + Sheets。' } },
  { name: 'QiFlux', cat: 'HealthApplication', os: 'iOS', desc: { en: 'The quiet, privacy-first cycle tracker.', ja: '静かでプライバシー第一の周期トラッカー。', zh: '安靜、隱私優先的週期記錄。' } },
  // 「telehealth / オンライン診療 / 線上診療」是錯的舊記載，2026-08-09 以產品自己的
  // 線上站 https://idokuta.smartrich.ai/ 第一手推翻（HTTP 200）：該站三處一致寫
  // 「5 Languages — Translate into Japanese and 4 more languages — English, Chinese,
  // Korean, Vietnamese」「5 Supported languages」，JSON-LD description 亦為「5 languages」。
  // 產品定位是「在日本就醫時把症狀寫成日文拿給對方看」的語言工具，不是線上診療服務 ——
  // 本站 work-copy.json 的正文本來就寫著「這是語言工具，不是醫療建議」，等於同一個
  // modal 裡上下兩段自相矛盾。宣稱看診有醫療廣告合規風險，一併改掉。
  // 「六種語言」的來源是 app UI 的 6 個 locale（5 個使用者語言 + 日文），
  // 被誤當成產品對外宣稱；stack 裡的 '6-locale i18n' 描述的是實作，維持不動。
  // cat 原為 'MedicalApplication' —— 那是 schema.org 的 MedicalEntity 子型別，
  // 不是 applicationCategory 的合法值；改用與其他健康類產品一致的 HealthApplication。
  { name: 'iDokuta', cat: 'HealthApplication', os: 'iOS, Android', desc: { en: 'Medical language tool for foreign residents in Japan: write symptoms in your own language, show clear Japanese at the clinic. Five languages (in development).', ja: '在日外国人向けの医療言語支援 — 母語で書いた症状を、受付で見せられる日本語に。5言語対応（開発中）。', zh: '在日外國人的醫療語言工具 — 用母語寫下症狀，在診所拿出清楚的日文。支援五種語言（開發中）。' } },
  // 「病院連携」是舊記載；線上 mairi.smartrich.ai 的實際定位是日中英三語 PHR，
  // 醫療機構相關的只有 Phase 1.5 的マイナポータル連携，且受診 QR 標為「今後対応予定」。
  // 2026-08-09 第一手複驗：Google Play `health.mairi.app` HTTP 200、標題「Mairi - まいり」、
  // 最終更新日 2026/07/29、更新說明「Mairi 初回リリース」、無「早期アクセス」標記 ——
  // **已公開上架**，站上原本標 status:'wip'（開發中）是低報。三語 i18n 已改為 shipped。
  // iOS 則確實沒有：itunes search「まいり」「Mairi」在 Crealize 名下 0 筆，
  // lookup bundleId health.mairi.app / ai.smartrich.mairi / com.crealize.mairi 皆 resultCount=0，
  // 故 os 從 'iOS, Android' 收斂為只寫已驗證的 Android（與 Tendo 同一處理）。
  { name: 'Mairi', cat: 'HealthApplication', os: 'Android', desc: { en: 'Trilingual personal health record (JA / 繁中 / EN): vitals, medication history and an AI symptom check that reads your own record.', ja: '日中英3言語のPHR — バイタル・薬歴と、自分の記録を文脈にしたAI症状チェック。', zh: '日中英三語 PHR — 生命徵象、用藥史，以及讀你自己紀錄的 AI 症狀速查。' } },
  // os 原記 'Web' 且描述標「開發中」，但 2026-08-08 實測 Google Play com.kkdstudios.tendo
  // 已公開上架（developer=Crealize）；iOS id6781214609 lookup resultCount=0，確實未上架。
  // 未取得公開 Web 版網址的第一手證據，故 os 只寫已驗證的 Android。
  { name: 'Tendo', cat: 'GameApplication', os: 'Android', desc: { en: 'Daily Hamiltonian-path puzzle: connect every dot in one unbroken path.', ja: '一日一道 — すべての点を一本の道でつなぐハミルトン路パズル。', zh: '每日漢米爾頓路徑謎題 — 把所有的點用一條路串起來。' } },
  { name: 'moonpacket', cat: 'FinanceApplication', os: 'Web, Telegram', desc: { en: 'Crypto red packets for Telegram communities — non-custodial, USDT / TON / SOL / ETH.', ja: 'Telegram コミュニティ向けクリプト紅包 — ノンカストディアル、USDT / TON / SOL / ETH 対応。', zh: 'Telegram 社群的加密貨幣紅包 — 非託管，支援 USDT / TON / SOL / ETH。' } },
  { name: 'Rythix 2048', cat: 'GameApplication', os: 'iOS, Android', desc: { en: 'Music-driven 2048: numbers merge on the beat.', ja: 'ビートに乗って数字が重なる音楽パズル 2048。', zh: '跟著節拍合併數字的音樂解謎 2048。' } },
  { name: 'Meishitto', cat: 'BusinessApplication', os: 'iOS, Android', desc: { en: 'Business-card scanner with on-device OCR — your contacts stay yours.', ja: '端末内 OCR の名刺スキャン — 連絡先の持ち主はあなたのまま。', zh: '裝置端 OCR 名片掃描 — 人脈始終是你的。' } },
  { name: 'XunNi', cat: 'LifestyleApplication', os: 'Android, Web', desc: { en: 'AI astrology and relationship readings across two charts.', ja: 'ふたつの命盤を読み解く AI 占星・相性鑑定。', zh: '解讀兩張命盤的 AI 占星與關係分析。' } },
  // 客戶案：株式会社YMY商事。schema.org 沒有「品牌識別專案」這個型別，
  // 用 CreativeWork 而不是硬套 SoftwareApplication —— 它不是一支 App。
  { name: 'YMY', cat: 'CreativeWork', os: 'Brand, Web', desc: { en: 'Whole-enterprise design for a Japanese trading company: CI standard, logo vector masters, mascot system, environmental graphics and a four-language corporate site.', ja: '株式会社YMY商事の企業まるごと設計 — CI規定、ロゴのベクター母版、マスコット体系、環境グラフィック、4言語コーポレートサイト。', zh: '株式会社YMY商事的全企業設計 — CI 規範、logo 向量母版、吉祥物體系、環境圖像與四語官網。' } },
  { name: 'Kizuki', cat: 'BusinessApplication', os: 'Web, Telegram', desc: { en: 'Social engagement OS: AI notices conversations across cultures, drafts the reply, a human sends it.', ja: 'ソーシャル運用OS — AIが多文化の会話に気付き返信を起草、送信は人が行う。', zh: '社群經營 OS — AI 跨文化察覺對話並草擬回覆，送出的是人。' } },
  { name: 'dramaflow', cat: 'CreativeWork', os: 'Internal', desc: { en: 'AI short-drama production line with a ratified world constitution and shot-chain continuity.', ja: '創作憲法とショット連鎖の連続性を持つAI短編ドラマ生産ライン。', zh: '以創作憲法與鏡頭連戲鏈運作的 AI 短劇生產線。' } },
  { name: 'Todoke', cat: 'CreativeWork', os: 'Internal', desc: { en: 'Narrated short-video pipeline: script to captioned, multilingual video and publishing.', ja: '台本から字幕付き多言語ナレーション動画と公開までを通すパイプライン。', zh: '從腳本到多語字幕旁白影片與發佈的影音管線。' } },
  { name: 'Meguru', cat: 'BusinessApplication', os: 'Web', desc: { en: 'Cross-border commerce platform: listings, orders and settlement in one loop.', ja: '越境ECプラットフォーム — 出品・受注・精算をひと巡り。', zh: '跨境電商平台 — 上架、接單、對帳一路循環。' } },
];

/* 交叉驗證：JSON-LD 中繼資料表必須與卡片 registry 的產品完全對應。
   任一邊加了產品而另一邊沒加，就在建置時中止 —— 不要等 SEO 靜默少一筆才發現。 */
const WORK = loadWorkRegistry(ROOT);
{
  const inRegistry = WORK.map((w) => w.name);
  const inMeta = PRODUCTS.map((p) => p.name);
  const missingMeta = inRegistry.filter((n) => !inMeta.includes(n));
  const orphanMeta = inMeta.filter((n) => !inRegistry.includes(n));
  if (missingMeta.length || orphanMeta.length) {
    throw new Error(
      '產品清單不同步：\n' +
        (missingMeta.length ? `  registry 有但 PRODUCTS 缺（JSON-LD 會少）：${missingMeta.join(', ')}\n` : '') +
        (orphanMeta.length ? `  PRODUCTS 有但 registry 缺（卡片不會顯示）：${orphanMeta.join(', ')}\n` : '') +
        '  → 兩處都要加。registry: site/js/i18n/*.js；中繼資料: scripts/build-site.mjs 的 PRODUCTS'
    );
  }
}
const PRODUCT_COUNT = String(WORK.length).padStart(2, '0');

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
<script src="${loc.base}js/work-v3.js" defer></script>
<script src="${loc.base}js/work-modal.js" defer></script>`
  );

  // 6. nav logo asset path
  html = html.replaceAll('src="assets/crealize-mark.png"', `src="${loc.base}assets/crealize-mark.png"`);

  // 6.5 common rewrites (all locales): products count + engineering principles strip
  // 產品數從 registry 算，不再寫死字串（原本是 '>07 products<' → '>08 products<'，
  // 每加一個產品都要記得回來改這行，且改錯不會有任何錯誤訊息）
  const countBefore = html;
  html = html.replace(
    /(<span class="sec-head__count">)\s*\d+(\s*products<\/span>)/,
    `$1${PRODUCT_COUNT}$2`
  );
  if (html === countBefore) throw new Error('找不到 sec-head__count 產品數節點，來源 HTML 結構已變');
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

/* ── sitemap.xml + llms.txt：從同一份清單生成 ──────────────────────────
   兩個檔原本手工維護，結果都爛掉了：sitemap 的 lastmod 停在 2026-06-10，
   llms.txt 只列到 8 個產品（實際 16），還把已上架的 Tendo 寫在「開發中」。
   對外檔案說謊比沒有更糟，所以改成生成 —— 清單一改，這兩個檔跟著對。 */
{
  const paths = ['/', '/ja/', '/zh/'];
  const alt = paths
    .map((p, i) => `    <xhtml:link rel="alternate" hreflang="${['en', 'ja', 'zh-Hant'][i]}" href="${ORIGIN}${p}"/>`)
    .concat(`    <xhtml:link rel="alternate" hreflang="x-default" href="${ORIGIN}/"/>`)
    .join('\n');
  /* lastmod 用建置日 —— 這個檔只在 build 時重寫，日期就是它最後一次為真的時刻。 */
  const today = new Date().toISOString().slice(0, 10);
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${paths.map((p) => `  <url>
    <loc>${ORIGIN}${p}</loc>
    <lastmod>${today}</lastmod>
${alt}
  </url>`).join('\n')}
</urlset>
`;
  writeFileSync(join(OUT, 'sitemap.xml'), sitemap);
  console.log(`✅ sitemap.xml (${paths.length} URL, lastmod ${today})`);

  /* llms.txt 的分組直接讀 registry 的 status，不另外判斷 —— 卡片顯示什麼狀態，
     這裡就寫什麼狀態，不會再出現「網站說已上架、llms.txt 說開發中」。 */
  const GROUPS = [
    ['shipped', '## Shipped products'],
    ['wip', '## In development'],
  ];
  /* registry 的 status 詞彙一旦多出一種，沒被歸類的產品會從 llms.txt 靜靜消失。
     第一版就踩到：只認 shipped/dev/ops，結果 wip 的四個產品（iDokuta / Mairi /
     Kizuki / Todoke）全數落榜，檔案看起來還是完整的。寧可中止建置。 */
  const known = new Set(GROUPS.map(([s]) => s));
  const stray = [...new Set(WORK.map((r) => r.status).filter((s) => !known.has(s)))];
  if (stray.length) {
    throw new Error(`llms.txt: registry 出現未分組的 status「${stray.join('、')}」—— 先在 GROUPS 加上對應標題，否則這些產品會被靜默略過`);
  }
  const byName = new Map(PRODUCTS.map((p) => [p.name, p]));
  const lines = [];
  for (const [status, heading] of GROUPS) {
    const items = WORK.filter((r) => r.status === status);
    if (!items.length) continue;
    lines.push('', heading, '');
    for (const r of items) {
      const meta = byName.get(r.name);
      const desc = meta ? meta.desc.en : '';
      const os = meta && meta.os ? ` (${meta.os})` : '';
      lines.push(`- ${r.name} — ${desc}${os}`);
    }
  }
  const llms = `# Crealize

> Crealize LLC is an independent product studio in Tokyo. We research, design,
> build, launch, and improve digital products.

Contact: support@crealize.llc
Languages: English (/), 日本語 (/ja/), 繁體中文 (/zh/)
Products: ${WORK.length}
${lines.join('\n')}

## Method

Research → Design → Build → Launch → Improve.
Engineering principles: atomicity (one change, one meaning), explicit dependencies,
module boundaries, type-safe by default, zero-dependency bias, code as craft.

## Hiring

Remote-first, Tokyo HQ. Roles: Design, Engineering, Growth.
Contact support@crealize.llc with a project you are proud of and the part you contributed.
`;
  writeFileSync(join(OUT, 'llms.txt'), llms);
  console.log(`✅ llms.txt (${WORK.length} 產品，依 registry 狀態分組)`);
}
