/* ============================================================
   CREALIZE — SELECTED WORK v3
   ⚠️ 本檔由 scripts/gen-work-v3.mjs 生成，請勿手改。
   真相源：docs/design-system/source/claude-design-export/Work v3.html
   （Claude Design 專案 dbbc5234-c185-49b2-97b2-09bf8b59aaf0，
     2026-08-09 以 DesignSync get_file 取回，truncated:false）

   相對 canvas 原檔的三處差異，以及為什麼：

   1. 拿掉 runtime 語言切換器。線上站是三個 per-locale 靜態頁，語言由
      <html lang> 決定，只 render 一次。canvas 需要那個切換器，是為了在
      單一畫布預覽三語；正式站有它反而會與 URL 的語言狀態打架。

   2. 卡片改為三層混合：AI 底圖（assets/kv）+ 程式動態 motif + 官方 icon（assets/icons）。
      canvas 原檔在角落放一支手機裝產品截圖，那個整組移除 —— Yves 講過兩次
      「故意放個手機是十年前的設計」。路徑吃 window.CRZ_I18N.work[].img，
      per-locale 的 i18n 檔已帶正確相對路徑，不需要另做 base path 管線。

   3. 每張卡帶 class="work-card" 與 data-work-index，讓 work-modal.js 既有的
      事件委派（'.work-card[data-work-index], .index-row[data-work-index]'）繼續有效。

   M（motif SVG）與版位 meta 由生成器從 canvas 原檔原樣切出；
   三語文案來自 docs/design-system/work-copy.json（那才是文案的真相源）。
   樣式在 site/css/sections.css 的「WORK v3」區塊，全部 scope 在 #work 之下；
   token 一律用 site/css/tokens.css 的既有名稱（--ease-cond / --dur-1..3 / --font-*），
   canvas 自帶的那份 :root 刻意不移植 —— tokens.css 是唯一真相源。
   ============================================================ */
(function () {
  'use strict';

  var host = document.getElementById('work-cards');
  if (!host) return;

  var REG = (window.CRZ_I18N && window.CRZ_I18N.work) || [];

  /* 語言：<html lang> 是唯一來源。zh-Hant → zh。 */
  var lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  var L = lang.indexOf('ja') === 0 ? 'ja' : lang.indexOf('zh') === 0 ? 'zh' : 'en';

  /* {n} 由 registry 長度填入 —— 曾經寫死「Twelve / 12 / 十二」，
     產品加到 16 之後三語都還在說十二個，右上角的計數卻是 16。
     產品數只能有一個真相源，就是 registry 本身。 */
  var LEDE = {
    en: "{n} products. Each one is a mechanism we thought should exist — so we built the smallest honest version of it and shipped.",
    ja: "{n}のプロダクト。どれも「この仕組みはあるべきだ」という一点から始め、いちばん小さくて誠実な形にして世に出しました。",
    zh: "{n} 個產品。每一個都始於「這個機制應該存在」，然後做成最小、也最誠實的那個版本，送出去。"
  };

  var LEGEND = {
    en: [['live', 'shipped'], ['dev', 'in development'], ['ops', 'in operation']],
    ja: [['live', '公開中'], ['dev', '開発中'], ['ops', '運営中']],
    zh: [['live', '已上線'], ['dev', '開發中'], ['ops', '營運中']]
  };

  var UNRELEASED = { en: 'unreleased', ja: '未リリース', zh: '尚未上架' };

  /* 卡片上的「還有更多」提示。2026-08-09 之前卡片把整段 body 印在外面，
     modal 只有一句 registry line + stack —— 點開比不點還少，Yves 直接問
     「那還有必要打開嗎」。現在卡片＝鉤子，modal＝完整內容，所以卡片要說得出
     「裡面還有東西」，否則沒人會點。 */
  var MORE = { en: 'Read the full story', ja: '詳しく読む', zh: '看完整說明' };
  /* 卡片 aria-label 與 modal CTA 共用同一組語序模板：日文動詞在後（{name} を開く），不是英式「開く X」。 */
  var OPEN = { en: 'Open {name}', ja: '{name} を開く', zh: '前往 {name}' };
  /* stage__bg 的 sizes：對應 sections.css 的 #work-cards 欄數（≥1101 三欄、≥641 兩欄、其餘一欄），
     數值由 2026-09-04 CDP 量測校準：1440→419、1280→372（29vw）；1080→482、768→341（44.5vw）；390→350（90vw）。 */
  var SIZES = '(min-width: 1101px) 29vw, (min-width: 641px) 44.5vw, 90vw';

/* ── motifs：canvas 的原樣切出，加上 work-copy.json 帶進來的新產品 ── */
var M={
puritylens:'<svg class="m" viewBox="0 0 320 240"><defs><radialGradient id="plB" cx="34%" cy="30%" r="74%"><stop offset="0" stop-color="#fff"/><stop offset=".38" stop-color="#DCEAF2"/><stop offset="1" stop-color="#7BB8D4"/></radialGradient></defs>'
+'<g class="pl-ball m-vb" style="transform-origin:112px 120px"><circle cx="112" cy="120" r="66" fill="url(#plB)"/><circle cx="90" cy="98" r="15" fill="#fff" opacity=".72"/></g>'
+'<g fill="#7BB8D4"><rect class="pl-row" x="186" y="70" width="104" height="9" rx="2"/><rect class="pl-row" style="animation-delay:80ms" x="186" y="92" width="82" height="9" rx="2" opacity=".72"/><rect class="pl-row" style="animation-delay:160ms" x="186" y="114" width="96" height="9" rx="2" opacity=".54"/><rect class="pl-row" style="animation-delay:240ms" x="186" y="136" width="68" height="9" rx="2" opacity=".38"/></g>'
+'<circle class="pl-dial m-draw m-vb" style="--len:396" cx="112" cy="120" r="84" fill="none" stroke="#4E8FB0" stroke-width="7" stroke-linecap="round" transform="rotate(-90 112 120)"/></svg>',

fudeto:'<svg class="m" viewBox="0 0 320 240"><path class="fd-spiral m-draw" style="--len:820" d="M300 44 C230 6 128 14 76 68 C24 122 34 196 96 214 C158 232 214 190 206 146 C198 102 148 92 128 118 C108 144 126 172 150 168 C168 165 174 148 164 138" fill="none" stroke="#1A1A1A" stroke-width="6" stroke-linecap="round"/><circle class="fd-gold m-vb" cx="164" cy="138" r="9" fill="#EAB308" style="transform-origin:164px 138px"/></svg>',

kichitto:'<svg class="m" viewBox="0 0 320 240"><g class="ki-receipt"><path d="M40 26 L56 16 L72 26 L88 16 L104 26 L120 16 L136 26 L136 130 L40 130 Z" fill="#E97B47"/><rect x="54" y="48" width="68" height="7" fill="#FAFAF8"/><rect x="54" y="68" width="44" height="7" fill="#FAFAF8"/><rect x="54" y="88" width="68" height="7" fill="#FAFAF8"/></g>'
+'<rect class="ki-row" x="40" y="176" width="176" height="26" rx="2" fill="#E97B47" opacity=".9"/>'
+'<g class="ki-fab m-vb" style="transform-origin:262px 58px"><circle cx="262" cy="58" r="22" fill="#E97B47"/><circle cx="262" cy="58" r="8" fill="#FAFAF8"/></g></svg>',

qiflux:'<svg class="m" viewBox="0 0 320 240"><defs><radialGradient id="qfP" cx="28%" cy="26%" r="82%"><stop offset="0" stop-color="#FDF2F1"/><stop offset=".34" stop-color="#E38497"/><stop offset="1" stop-color="#261849"/></radialGradient></defs><g class="qf-breathe m-vb" style="transform-origin:160px 120px"><circle cx="160" cy="120" r="74" fill="url(#qfP)"/></g></svg>',

meishitto:'<svg class="m" viewBox="0 0 320 240"><path d="M36 108 H172 V206 A6 6 0 0 1 166 212 H42 A6 6 0 0 1 36 206 Z" fill="none" stroke="#5254E0" stroke-width="4" opacity=".4"/>'
+'<g class="me-card"><rect x="48" y="60" width="112" height="70" rx="4" fill="#5254E0"/></g>'
+'<g fill="#5254E0"><rect class="me-row" style="animation-delay:.4s" x="192" y="86" width="72" height="12" rx="2"/><rect class="me-row" style="animation-delay:.48s" x="192" y="108" width="58" height="12" rx="2" opacity=".6"/><rect class="me-row" style="animation-delay:.56s" x="192" y="130" width="44" height="12" rx="2" opacity=".34"/></g></svg>',

rythix2048:'<svg class="m" viewBox="0 0 320 240"><defs><linearGradient id="rxN" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F2C6DC"/><stop offset="1" stop-color="#BBBBFD"/></linearGradient></defs>'
+'<rect class="rx-a" x="40" y="42" width="56" height="56" rx="4" fill="#F2C6DC"/><rect x="104" y="42" width="56" height="56" rx="4" fill="#BBBBFD"/>'
+'<rect class="rx-b m-vb" x="104" y="42" width="56" height="56" rx="4" fill="url(#rxN)" style="transform-origin:132px 70px"/>'
+'<g fill="url(#rxN)">'
+['0','.05s','.1s','.15s','.2s','.25s','.3s','.35s'].map(function(d,i){return '<rect class="rx-bar" style="animation-delay:'+d+'" x="'+(44+i*34)+'" y="'+(200-(i%3===0?66:i%3===1?46:84))+'" width="18" height="'+(i%3===0?66:i%3===1?46:84)+'" rx="2"/>'}).join('')
+'</g></svg>',

tendo:'<svg class="m" viewBox="0 0 320 240"><path class="td-path m-draw" style="--len:940" d="M62 54 L160 54 L160 118 L62 118 L62 182 L160 182 L258 182 L258 118 L258 54" fill="none" stroke="#C9A961" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>'
+'<g fill="#C9A961">'
+[[62,54],[160,54],[160,118],[62,118],[62,182],[160,182],[258,182],[258,118],[258,54]].map(function(p,i){return '<circle class="td-node" style="animation-delay:'+(i*0.26).toFixed(2)+'s" cx="'+p[0]+'" cy="'+p[1]+'" r="10"/>'}).join('')
+'</g></svg>',

xunni:'<svg class="m" viewBox="0 0 320 240"><defs><radialGradient id="xnG" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#F4C430" stop-opacity=".22"/><stop offset="1" stop-color="#F4C430" stop-opacity="0"/></radialGradient></defs>'
+'<g class="xn-shell m-vb" style="transform-origin:160px 118px"><circle cx="160" cy="118" r="96" fill="url(#xnG)"/><circle cx="160" cy="118" r="82" fill="none" stroke="#F4C430" stroke-width="1.5" opacity=".5"/></g>'
+'<polygon class="xn-r1" points="160,52 218,104 196,178 124,178 102,104" fill="none" stroke="#F4C430" stroke-width="4"/>'
+'<polygon class="xn-r2" points="160,74 206,112 186,166 132,158 112,98" fill="none" stroke="#F4C430" stroke-width="4"/>'
+'<g fill="#F4C430"><circle cx="112" cy="222" r="4" opacity=".4"/><circle cx="138" cy="222" r="4" opacity=".4"/><circle cx="164" cy="222" r="4" opacity=".4"/><circle cx="190" cy="222" r="4" opacity=".4"/></g>'
+'<circle class="xn-lens" cx="112" cy="222" r="7" fill="#F4C430"/></svg>',

moonpacket:'<svg class="m" viewBox="0 0 320 240"><circle cx="244" cy="58" r="40" fill="#FFBA00"/>'
+'<g class="mp-coin m-vb" style="transform-origin:106px 132px"><circle cx="106" cy="132" r="17" fill="#FFBA00"/></g>'
+'<rect x="56" y="112" width="100" height="112" rx="4" fill="#E32521"/>'
+'<g class="mp-flap m-vb" style="transform-origin:106px 112px"><path d="M56 112 L156 112 L106 158 Z" fill="#A81A17"/></g></svg>',

idokuta:'<svg class="m" viewBox="0 0 320 240"><defs><filter id="idSh" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="1" flood-color="#0F2E3A" flood-opacity=".04"/><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0F2E3A" flood-opacity=".04"/></filter></defs>'
+'<g class="id-card"><rect x="46" y="54" width="150" height="132" rx="24" fill="#fff" stroke="rgba(15,46,58,.08)" stroke-width="1" filter="url(#idSh)"/>'
+'<g class="id-src"><rect x="70" y="86" width="86" height="8" rx="4" fill="#5C7280" opacity=".5"/><rect x="70" y="106" width="62" height="8" rx="4" fill="#5C7280" opacity=".5"/></g>'
+'<g class="id-ja"><rect x="70" y="86" width="102" height="8" rx="4" fill="#04A29E"/><rect x="70" y="106" width="74" height="8" rx="4" fill="#04A29E" opacity=".62"/><rect x="70" y="132" width="52" height="6" rx="3" fill="#037A77" opacity=".4"/></g></g>'
+'<g class="id-hand" fill="none" stroke="#04A29E" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
+'<path d="M232 128 v-34 a7 7 0 0 1 14 0 v30"/><path d="M246 118 v-40 a7 7 0 0 1 14 0 v40"/><path d="M260 122 v-30 a7 7 0 0 1 14 0 v34"/>'
+'<path d="M232 124 q-14 6 -10 22 l10 30 a18 18 0 0 0 16 10 h24 a18 18 0 0 0 18 -18 v-42"/></g></svg>',

mairi:'<svg class="m" viewBox="0 0 320 240"><g fill="#C95A3F"><rect x="52" y="40" width="180" height="12" rx="2"/><rect x="68" y="70" width="148" height="9" rx="2"/><rect x="76" y="52" width="12" height="140" rx="2"/><rect x="196" y="52" width="12" height="140" rx="2"/></g>'
+'<path class="mr-line m-draw" style="--len:340" d="M14 128 H72 L90 92 L108 156 L126 120 H236" fill="none" stroke="#1A2B3C" stroke-width="6" stroke-linejoin="round" stroke-linecap="round"/>'
+'<g class="mr-qr m-vb" style="transform-origin:142px 196px"><rect x="118" y="172" width="48" height="48" rx="4" fill="#1A2B3C"/><rect x="128" y="182" width="12" height="12" fill="#FAF8F5"/><rect x="146" y="200" width="10" height="10" fill="#FAF8F5"/>'
+'<circle class="mr-timer m-vb" style="--len:176" cx="142" cy="196" r="28" fill="none" stroke="#C95A3F" stroke-width="3" stroke-dasharray="176" transform="rotate(-90 142 196)"/></g></svg>',

meguru:'<svg class="m" viewBox="0 0 320 240">'
+'<circle class="mg-loop" cx="160" cy="120" r="86" fill="none" stroke="#0E0E10" stroke-width="3" stroke-dasharray="10 14" stroke-linecap="round" opacity=".45"/>'
+'<path class="mg-flap" d="M112 158 V96 a22 22 0 0 1 22 -22 h4 v84 Z" fill="#B51452"/>'
+'<g fill="none" stroke="#0E0E10" stroke-width="9" stroke-linejoin="round" stroke-linecap="round">'
+'<path d="M112 158 V96 a22 22 0 0 1 22 -22 a22 22 0 0 1 22 22 v62"/>'
+'<path d="M156 158 V96 a22 22 0 0 1 22 -22 a22 22 0 0 1 22 22 v50 l-14 12"/></g>'
+'<g fill="#B51452"><circle class="mg-node" cx="160" cy="34" r="5"/><circle class="mg-node" style="animation-delay:1.4s" cx="246" cy="120" r="5"/><circle class="mg-node" style="animation-delay:2.8s" cx="160" cy="206" r="5"/></g></svg>'};
Object.assign(M, {ymy:"<svg class=\"m\" viewBox=\"0 0 320 240\"><g class=\"ymy-marks\" fill=\"none\" stroke=\"#FFF9F7\" stroke-width=\"13\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M56 84 L80 118 L104 84 M80 118 V162\"/><path d=\"M132 162 V96 L160 130 L188 96 V162\"/><path d=\"M216 84 L240 118 L264 84 M240 118 V162\"/></g><path class=\"ymy-tape m-draw\" style=\"--len:210\" d=\"M196 72 L146 178\" fill=\"none\" stroke=\"#D52A5B\" stroke-width=\"22\" stroke-linecap=\"square\"/></svg>",kizuki:"<svg class=\"m\" viewBox=\"0 0 320 240\"><g class=\"kz-ripple\" fill=\"none\" stroke=\"#FAFAF7\" stroke-width=\"2\" opacity=\".4\"><circle cx=\"160\" cy=\"116\" r=\"84\"/><circle cx=\"160\" cy=\"116\" r=\"112\"/><circle cx=\"160\" cy=\"116\" r=\"140\"/></g><path class=\"kz-bulb m-draw\" style=\"--len:300\" d=\"M160 44 a52 52 0 0 1 32 93 v20 h-64 v-20 a52 52 0 0 1 32 -93z\" fill=\"none\" stroke=\"#FAFAF7\" stroke-width=\"7\" stroke-linejoin=\"round\"/><path class=\"kz-spark\" d=\"M148 108 L160 78 L172 108 L160 130 Z\" fill=\"#DC322F\"/><g fill=\"#FAFAF7\" opacity=\".55\"><rect x=\"132\" y=\"182\" width=\"56\" height=\"7\" rx=\"3\"/><rect x=\"142\" y=\"198\" width=\"36\" height=\"7\" rx=\"3\"/></g></svg>",dramaflow:"<svg class=\"m\" viewBox=\"0 0 320 240\"><g class=\"df-frames\"><rect x=\"28\" y=\"84\" width=\"76\" height=\"58\" rx=\"6\" fill=\"none\" stroke=\"#5b8cff\" stroke-width=\"5\"/><rect x=\"122\" y=\"84\" width=\"76\" height=\"58\" rx=\"6\" fill=\"none\" stroke=\"#5b8cff\" stroke-width=\"5\"/><rect x=\"216\" y=\"84\" width=\"76\" height=\"58\" rx=\"6\" fill=\"none\" stroke=\"#5b8cff\" stroke-width=\"5\"/></g><path class=\"df-chain m-draw\" style=\"--len:200\" d=\"M104 113 H122 M198 113 H216\" fill=\"none\" stroke=\"#3ddc97\" stroke-width=\"7\" stroke-linecap=\"round\"/><g class=\"df-gate\" fill=\"#3ddc97\"><circle cx=\"160\" cy=\"48\" r=\"9\"/></g><path d=\"M160 57 V84\" stroke=\"#3ddc97\" stroke-width=\"4\" opacity=\".5\"/><g fill=\"#5b8cff\" opacity=\".35\"><rect x=\"28\" y=\"170\" width=\"264\" height=\"5\" rx=\"2\"/></g></svg>",todoke:"<svg class=\"m\" viewBox=\"0 0 320 240\"><rect x=\"112\" y=\"36\" width=\"96\" height=\"168\" rx=\"10\" fill=\"none\" stroke=\"#4059A6\" stroke-width=\"6\"/><g class=\"td-wave\" fill=\"#F2EDE4\"><rect x=\"128\" y=\"104\" width=\"7\" height=\"32\" rx=\"3\"/><rect x=\"142\" y=\"88\" width=\"7\" height=\"64\" rx=\"3\"/><rect x=\"156\" y=\"72\" width=\"7\" height=\"96\" rx=\"3\"/><rect x=\"170\" y=\"92\" width=\"7\" height=\"56\" rx=\"3\"/><rect x=\"184\" y=\"110\" width=\"7\" height=\"20\" rx=\"3\"/></g><g class=\"td-cap\" fill=\"#A79E90\"><rect x=\"124\" y=\"176\" width=\"72\" height=\"7\" rx=\"3\"/><rect x=\"134\" y=\"189\" width=\"52\" height=\"7\" rx=\"3\"/></g><g class=\"td-locales\" fill=\"#4059A6\"><circle cx=\"52\" cy=\"120\" r=\"11\"/><circle cx=\"52\" cy=\"84\" r=\"8\" opacity=\".6\"/><circle cx=\"52\" cy=\"156\" r=\"8\" opacity=\".6\"/></g></svg>"});
/* 覆寫 canvas motif（理由見 work-copy.json 的 $motifOverride） */
Object.assign(M, {mairi:"<svg class=\"m\" viewBox=\"0 0 320 240\"><g class=\"mr-strand\" fill=\"none\" stroke=\"#8EE6EB\" stroke-width=\"6\" stroke-linecap=\"round\" opacity=\".6\"><path class=\"m-draw\" style=\"--len:210\" d=\"M34 62 C118 62 128 120 200 120\"/><path class=\"m-draw\" style=\"--len:170\" d=\"M34 120 H200\"/><path class=\"m-draw\" style=\"--len:210\" d=\"M34 178 C118 178 128 120 200 120\"/></g><path class=\"mr-spine\" fill=\"none\" stroke=\"#2BD982\" stroke-width=\"7\" stroke-linecap=\"round\" d=\"M200 120 H292\"/><path class=\"mr-beat\" fill=\"none\" stroke=\"#2BD982\" stroke-width=\"7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" d=\"M206 120 l14 -34 l16 66 l14 -44 l12 12 H292\"/><circle class=\"mr-join\" cx=\"200\" cy=\"120\" r=\"9\" fill=\"#2BD982\"/></svg>"});

/* ── 12 產品 × 三語（各自撰寫，非直譯；原樣自 canvas 切出） ── */
var P=[
 {
  "s": "puritylens",
  "n": "PurityLens",
  "jp": "成分をひと目で",
  "tint": "#EEF4F8",
  "st": "live",
  "plat": [
   "iOS"
  ],
  "en": {
   "p": "Photograph a cosmetic label to check its ingredients and the evidence behind each rating.",
   "b": "A cosmetic ingredient list is written for regulators, not for the person holding the bottle. If you look an ingredient up online, you get several answers that contradict each other. PurityLens photographs the label and tells you what each ingredient means for your skin. Every rating also shows where it came from: how much is based on TFDA, CosIng, CIR and PubChem data, and how much came from AI. When the evidence is thin, the app says so instead of guessing."
  },
  "ja": {
   "p": "化粧品のラベルを撮影し、成分と判定根拠を確認できます。",
   "b": "化粧品の成分表は規制のために書かれていて、持っている人のためには書かれていません。ネットで調べると、同じ成分でも説明がいくつも出てきて食い違います。PurityLens はラベルを撮影して、それぞれの成分があなたの肌にとってどういうものかを示します。判定には根拠も添えます。TFDA・CosIng・CIR・PubChem のデータが何割で、AI の判断が何割か。根拠が薄いときは、薄いとそのまま表示します。"
  },
  "zh": {
   "p": "拍下化妝品標籤，查看成分與每項判定的依據。",
   "b": "化妝品的成分表是寫給主管機關看的，不是寫給拿著瓶子的人看的。上網查一個成分，會查到好幾種互相矛盾的說法。PurityLens 拍下標籤，告訴你每個成分對你的皮膚代表什麼。每個判定都附上依據：有幾成來自 TFDA、CosIng、CIR、PubChem 的資料，幾成來自 AI。依據不夠的時候，它會直接說依據不夠，不會硬猜。"
  },
  "hasIcon": 1
 },
 {
  "s": "fudeto",
  "n": "Fudeto",
  "jp": "一筆書き",
  "tint": "#FAFAFA",
  "flat": 1,
  "st": "live",
  "plat": [
   "iOS"
  ],
  "en": {
   "p": "A new one-stroke bridge puzzle each day, the same one for every player.",
   "b": "Fudeto is a one-stroke puzzle: cross every bridge exactly once. There is one puzzle a day, and everyone in the world gets the same one, so a round takes about ninety seconds. The maths behind it is Euler's, from 1736. Each board is generated from the date, so the app ships without any stored artwork. The share card is there so you can send today's puzzle to a friend, not to keep you in the app."
  },
  "ja": {
   "p": "世界共通の一筆書きパズルを、毎日一問届けます。",
   "b": "Fudeto は一筆書きのパズルです。すべての橋を一度ずつ渡ります。問題は一日一問で、世界中の人が同じ問題を解きます。一問はだいたい90秒。仕組みは1736年のオイラーの数学です。盤面はその日の日付から生成するので、アプリの中に画像素材は入っていません。共有カードは今日の問題を友だちに送るためのもので、アプリに留まってもらうためのものではありません。"
  },
  "zh": {
   "p": "每天提供一道全球玩家共用的一筆畫謎題。",
   "b": "Fudeto 是一筆畫謎題：每座橋都走過一次，不重複。一天一題，全世界的人解的是同一題，一局大概九十秒。背後的數學是 1736 年歐拉的定理。每天的盤面由日期算出來，所以 App 裡沒有存任何圖片。分享卡是拿來把今天的題目傳給朋友的，不是用來把你留在 App 裡的。"
  },
  "hasIcon": 1
 },
 {
  "s": "kichitto",
  "n": "Kichitto",
  "jp": "きちっと",
  "tint": "#FBEFE8",
  "st": "live",
  "plat": [
   "iOS JP"
  ],
  "en": {
   "p": "Photograph a receipt and save the details to your own Drive and Sheets.",
   "b": "Kichitto is for sole traders in Japan who put off bookkeeping because the receipts pile up. You photograph a receipt, and the app reads it and writes the details into your own Google Drive and Sheets. It splits 8% and 10% consumption tax automatically, and you never have to move your data into someone else's system. One deliberate choice: receipts that look alike are never merged automatically. Registration numbers are not always unique, and a duplicate you can see is safer than a real transaction that quietly disappears."
  },
  "ja": {
   "p": "領収書を撮影すると、読み取った内容を自分の Drive と Sheets に保存します。",
   "b": "Kichitto は、領収書がたまって記帳を後回しにしがちな個人事業主のためのアプリです。領収書を撮ると内容を読み取って、あなた自身の Google Drive と Sheets に書き込みます。8% と 10% の消費税は自動で分けます。データをよそのシステムに移す必要はありません。ひとつだけ、意図して「やらない」ことがあります。似た領収書を自動でまとめることです。登録番号は必ずしも一意ではないので、本物の取引が消えるより、目に見える重複のほうが安全だと考えています。"
  },
  "zh": {
   "p": "拍下收據，將辨識結果存進你自己的 Drive 與 Sheets。",
   "b": "Kichitto 是給日本個人事業主用的記帳 App，適合收據一直堆著、記帳一直拖的人。拍下收據，它會讀出內容，寫進你自己的 Google Drive 和 Sheets。8% 和 10% 的消費稅會自動分開。你的資料不用搬進別人的系統。有一件事它刻意不做：長得很像的收據不會自動合併。因為登錄番號不一定是唯一的，留一筆看得見的重複，比讓一筆真的交易消失來得安全。"
  },
  "hasIcon": 1
 },
 {
  "s": "qiflux",
  "n": "QiFlux",
  "jp": "静かな記録",
  "tint": "#F6EDF0",
  "st": "live",
  "plat": [
   "iOS"
  ],
  "en": {
   "p": "A period tracker that keeps your records on your own phone.",
   "b": "QiFlux is a period tracker that keeps your records on your phone. It doesn't use the usual tricks: no streaks to keep up, no alarming notifications, no horoscopes mixed into your health data. Screens are kept mostly empty on purpose, and when one gets crowded we remove something rather than rearrange it. The cancel button is always easy to find."
  },
  "ja": {
   "p": "記録を端末内に保存する、プライバシー重視の周期トラッカーです。",
   "b": "QiFlux は生理周期の記録アプリです。記録はスマートフォンの中に保存します。よくある仕掛けは使っていません。途切れさせてはいけない連続記録も、不安をあおる通知も、体のデータに混ぜた占いもありません。画面はなるべく空けたままにして、詰まってきたら並べ替えるより先に何かを削ります。解約のボタンは、いつでも見つかる場所にあります。"
  },
  "zh": {
   "p": "重視隱私的週期紀錄工具，所有資料都保留在你的裝置上。",
   "b": "QiFlux 是生理週期紀錄 App，資料都留在你的手機裡。常見的那些手法它都沒用：沒有不能中斷的連續紀錄，沒有嚇人的通知，也沒有把占星混進健康資料。畫面刻意留很多空白，哪一頁變擠了，我們先刪東西，而不是重新排。取消訂閱的按鈕一直都很好找。"
  },
  "hasIcon": 1
 },
 {
  "s": "meishitto",
  "n": "Meishitto",
  "jp": "名刺っと",
  "tint": "#EDEDFB",
  "st": "live",
  "plat": [
   "iOS",
   "Android"
  ],
  "en": {
   "p": "Scan business cards on your phone and keep the contact data yourself.",
   "b": "Meishitto scans business cards on your phone. It reads them with on-device recognition first, and only sends a card to a cloud model when the confidence score is below 0.75, so most of your contacts never leave the device. Small things are written down too: animations last at most 400 ms and switch off when \"reduce motion\" is on, because large movement can cause dizziness for people with vestibular disorders. That reason is noted in the source code, not only in a policy page."
  },
  "ja": {
   "p": "名刺を端末内で読み取り、連絡先データを自分で管理できます。",
   "b": "Meishitto は名刺をスマートフォンで読み取るアプリです。まず端末内で認識して、信頼度が 0.75 を下回った名刺だけをクラウドのモデルに送ります。ほとんどの連絡先は端末の外に出ません。細かいことも決めてあります。アニメーションは長くても 400ms、「視差効果を減らす」がオンなら動かしません。大きな動きは前庭に疾患のある方にめまいを起こすことがあるからです。その理由はポリシーのページだけでなく、ソースコードにも書いてあります。"
  },
  "zh": {
   "p": "在裝置上辨識名片，聯絡人資料仍由你自己掌握。",
   "b": "Meishitto 在你的手機上掃名片。先用裝置本身的辨識，只有信心分數低於 0.75 的名片才會送到雲端模型，所以大部分的聯絡人資料不會離開手機。小地方也有寫清楚：動畫最長 400 毫秒，開啟「減少動態效果」就完全不動，因為大幅度的移動可能讓前庭功能有問題的人頭暈。這個理由寫在程式碼裡，不只寫在政策頁上。"
  },
  "hasIcon": 1
 },
 {
  "s": "rythix2048",
  "n": "Rythix 2048",
  "jp": "音で解く 2048",
  "tint": "#F6EEF4",
  "st": "live",
  "plat": [
   "iOS",
   "Android"
  ],
  "en": {
   "p": "A 2048-style number puzzle that composes music as you play.",
   "b": "Rythix 2048 is the familiar 2048 number puzzle with one change: your phone composes music while you play, so each game sounds different. Nothing is pre-recorded and nothing is streamed. Mute it and it is still a good number puzzle. The music is a bonus, not a requirement."
  },
  "ja": {
   "p": "プレイに合わせて音楽が生成される、2048型の数字パズルです。",
   "b": "Rythix 2048 は、おなじみの 2048 に一つだけ変更を加えた数字パズルです。遊んでいる間に端末が音楽を作るので、一局ごとに違う曲になります。録音された音源はなく、配信もしていません。消音にしても、数字パズルとしてそのまま遊べます。音楽はおまけで、条件ではありません。"
  },
  "zh": {
   "p": "遊玩時即時生成音樂的 2048 類數字謎題。",
   "b": "Rythix 2048 就是你熟悉的 2048 數字謎題，只改了一件事：你玩的時候，手機會即時作曲，所以每一局聽起來都不一樣。沒有預錄，也沒有串流。靜音之後，它還是一個好玩的數字謎題。音樂是加分，不是條件。"
  },
  "hasIcon": 1
 },
 {
  "s": "tendo",
  "n": "Tendo",
  "jp": "一日一道",
  "tint": "#F5F1E8",
  "flat": 1,
  "st": "live",
  "plat": [
   "Android"
  ],
  "en": {
   "p": "A daily path puzzle where every point must be visited exactly once.",
   "b": "Tendo is a daily path puzzle: visit every point exactly once. It looks like its sibling Fudeto, but the maths is different. Fudeto follows edges, which can be solved by counting; Tendo follows points, which has no formula, so you play by intuition and by backtracking. It can be played with a single switch, and VoiceOver reads out each point, so the puzzle works for people who can't swipe."
  },
  "ja": {
   "p": "すべての点を一度ずつ通る、毎日一問の経路パズルです。",
   "b": "Tendo は毎日一問の経路パズルです。すべての点を一度ずつ通ります。見た目は姉妹作の Fudeto に似ていますが、数学が違います。Fudeto は辺をたどるので、数えれば解けます。Tendo は点をたどるので公式がなく、直感と試行錯誤で解きます。スイッチひとつで最後まで遊べて、VoiceOver が点を一つずつ読み上げるので、スワイプができない人も同じパズルを遊べます。"
  },
  "zh": {
   "p": "每天一道路徑謎題，每個點都必須剛好走過一次。",
   "b": "Tendo 是每天一題的路徑謎題：每個點都要剛好經過一次。它看起來像姊妹作 Fudeto，但數學不一樣。Fudeto 走的是邊，用數的就能解；Tendo 走的是點，沒有公式，只能靠直覺和回頭重試。它可以只用一個開關玩到底，VoiceOver 會把每個點唸出來，所以滑不了螢幕的人也玩得了同一道題。"
  },
  "hasIcon": 1
 },
 {
  "s": "xunni",
  "n": "XunNi",
  "jp": "尋你",
  "tint": "#141210",
  "st": "live",
  "plat": [
   "Android",
   "Web"
  ],
  "en": {
   "p": "AI relationship readings based on two astrological charts.",
   "b": "XunNi reads two birth charts together and explains the relationship between them: as a couple, as family, as colleagues, or as people around you. The interpretation changes with the relationship, not just the wording. Most astrology apps return the same paragraph to everyone; XunNi writes the reading for the two charts in front of it. A second feature, The Voice of Mercury, explains a public figure's best-known quote through their Mercury placement."
  },
  "ja": {
   "p": "二人分の命盤をもとに、関係性を読み解くAIサービスです。",
   "b": "XunNi は二人分の命盤を並べて、その関係を読み解きます。恋人として、家族として、同僚として、あるいは身近な人として。関係が変わると、言い回しだけでなく解釈そのものが変わります。占いアプリの多くは誰にでも同じ文章を返しますが、XunNi は目の前の二枚の命盤に合わせて書きます。もう一つの機能 The Voice of Mercury は、著名人の有名な言葉を、その人の水星の位置から説明します。"
  },
  "zh": {
   "p": "依照兩張命盤分析關係的 AI 輔助解讀服務。",
   "b": "XunNi 把兩張命盤放在一起看，解讀兩個人之間的關係：當情侶、當家人、當同事，或是身邊的人。關係換了，改變的是解讀本身，不只是措辭。多數命理 App 給每個人的都是同一段話；XunNi 是照眼前這兩張命盤寫的。另一個功能 The Voice of Mercury，會用一位名人的水星位置，解釋他最有名的那句話。"
  },
  "hasIcon": 1
 },
 {
  "s": "moonpacket",
  "n": "moonpacket",
  "jp": "月へ、紅包を",
  "tint": "#0C1E3A",
  "st": "live",
  "plat": [
   "Web",
   "Telegram"
  ],
  "en": {
   "p": "Send crypto red packets in Telegram with USDT, TON, SOL or ETH, with no custodian.",
   "b": "moonpacket lets you send crypto red packets in a Telegram group, in USDT, TON, SOL or ETH, without anyone holding the funds for you. Airdrops happen once and DeFi takes effort; a red packet is something people can do casually and often. The referral programme is capped on purpose, at 100 per person and ten million in total, so that sharing doesn't turn into farming rewards."
  },
  "ja": {
   "p": "Telegram で送れるノンカストディアルのクリプト紅包。USDT・TON・SOL・ETH に対応します。",
   "b": "moonpacket は Telegram のグループで送れるクリプトの紅包です。USDT・TON・SOL・ETH に対応していて、資金を預かる業者はいません。エアドロップは一度きりで、DeFi は手間がかかります。紅包は、人が気軽に何度でもできる動作です。紹介プログラムには上限を設けています。一人 100 件まで、全体で 1,000 万件まで。上限がないと、贈り物のはずが報酬目当ての作業になってしまうからです。"
  },
  "zh": {
   "p": "在 Telegram 發送非託管的加密貨幣紅包，支援 USDT、TON、SOL 與 ETH。",
   "b": "moonpacket 讓你在 Telegram 群組裡發加密貨幣紅包，支援 USDT、TON、SOL 和 ETH，過程中沒有任何一方替你保管資金。空投只發一次，DeFi 又很費事；紅包是大家可以隨手、常常做的事。推薦計畫有上限：每人一百次，全球一千萬次。不設上限的話，本來是送禮，會變成刷獎勵。"
  },
  "hasIcon": 1
 },
 {
  "s": "idokuta",
  "n": "iDokuta",
  "jp": "言葉を越える診療",
  "tint": "#F8FBFB",
  "st": "dev",
  "plat": [],
  "en": {
   "p": "A language tool for explaining symptoms at a clinic in Japan.",
   "b": "iDokuta is for foreign residents in Japan who get sick and can't explain it at the clinic. You write how you feel in your own language; the app turns it into clear medical Japanese and explains the key terms so you know what it says. Then you turn the phone around and show it to the receptionist or the doctor. Five languages. <b>It is a language tool, not medical advice. Always consult a doctor.</b>"
  },
  "ja": {
   "p": "日本での受診時に、症状を日本語で伝えるための言語支援ツールです。",
   "b": "iDokuta は、日本で体調を崩したときに症状をうまく伝えられない在住外国人のためのツールです。自分の言葉で症状を書くと、わかりやすい医療日本語に変わり、大事な用語には説明がつきます。あとは画面を相手に向けて、受付や医師に見せるだけです。5言語に対応しています。<b>これは言葉の道具で、医療上の助言ではありません。必ず医師に相談してください。</b>"
  },
  "zh": {
   "p": "協助使用者在日本就醫時，以日文說明症狀的語言工具。",
   "b": "iDokuta 是給在日本生病、卻沒辦法在診所說清楚的外國人用的。你用自己的語言寫下哪裡不舒服，它會換成清楚的醫療日文，重要的詞附上解釋，讓你知道自己在說什麼。然後把手機轉過去，給櫃檯或醫師看就好。支援五種語言。<b>這是語言工具，不是醫療建議，請務必諮詢醫師。</b>"
  },
  "hasIcon": 1
 },
 {
  "s": "mairi",
  "n": "Mairi",
  "jp": "毎日のカルテ",
  "tint": "#FAF8F5",
  "st": "dev",
  "plat": [],
  "en": {
   "p": "A multilingual daily health record you can bring to a hospital visit.",
   "b": "Mairi is a daily health record for people in Japan who don't read Japanese well: foreign residents, exchange students, families where parent and child read different languages. It has been available in Japanese, Traditional Chinese and English from day one. The symptom check reads your own record before it answers, instead of treating you as a stranger. Accessibility is part of the spec: 17px body text, 56pt tap targets, 7:1 contrast."
  },
  "ja": {
   "p": "毎日の健康記録を、受診時に活用できる多言語サービスです。",
   "b": "Mairi は、日本語が得意でない人のための毎日の健康記録です。在住外国人、留学生、親と子で読める言語が違うご家族など。最初から日本語・繁体字中国語・英語で作りました。症状チェックは、答える前にあなた自身の記録を読みます。初めての相手のようには扱いません。読みやすさも仕様で決めています。本文 17px、タップ領域 56pt、コントラスト 7:1。"
  },
  "zh": {
   "p": "可在就醫時使用的多語言日常健康紀錄服務。",
   "b": "Mairi 是給日文不太好的人用的日常健康紀錄：在日本的外國人、留學生、父母和小孩讀不同語言的家庭。它從第一天就有日文、繁體中文和英文，不是後來才補的。症狀速查會先讀你自己的紀錄再回答，不會把你當成陌生人。好讀也寫進規格：內文 17px、點擊區 56pt、對比 7:1。"
  },
  "hasIcon": 1
 },
 {
  "s": "meguru",
  "n": "Meguru",
  "jp": "めぐる",
  "tint": "#FAF7F2",
  "nophone": 1,
  "border": 1,
  "st": "ops",
  "plat": [
   "Internal"
  ],
  "en": {
   "p": "One platform for listings, orders, customer support and payouts.",
   "b": "Meguru is an operations platform for cross-border e-commerce. As a shop grows, its listings, orders, support and payouts end up spread across dozens of separate services, each with its own idea of what an order is. Meguru brings them into one loop. Some things are deliberately not automated: when the books don't match, the system only proposes a fix and a person approves it, and refunds, complaints and angry messages are never answered automatically."
  },
  "ja": {
   "p": "出品、受注、顧客対応、支払いを一つの運営基盤にまとめます。",
   "b": "Meguru は越境 EC の運営基盤です。店が大きくなると、出品・受注・顧客対応・支払いが何十ものサービスに散らばって、「注文」の定義さえサービスごとに違ってきます。Meguru はそれを一つの流れにまとめます。意図して自動化していないところもあります。帳簿が合わないときは、システムは修正案を出すだけで、承認するのは人です。返金、クレーム、怒っているお客様への返信は、自動では行いません。"
  },
  "zh": {
   "p": "把商品上架、接單、客服與撥款整合在同一個營運平台。",
   "b": "Meguru 是跨境電商的營運平台。店做大之後，上架、接單、客服、撥款會散在幾十個各自為政的服務裡，連「一筆訂單」的定義都不一樣。Meguru 把它們收成同一條流程。有些地方是刻意不自動化的：帳對不上的時候，系統只提出修正建議，由人來核准；退款、客訴和生氣的客人，一律不自動回覆。"
  },
  "hasIcon": 1
 },
 {
  "s": "ymy",
  "n": "YMY",
  "jp": "株式会社YMY商事",
  "tint": "#1A1418",
  "st": "ops",
  "plat": [
   "Brand",
   "Web"
  ],
  "border": 1,
  "en": {
   "p": "Corporate identity, multilingual website and operating model for YMY.",
   "b": "YMY sources and ships goods for individual sellers on Japan's marketplaces. When it came to us it had no visual identity at all. We designed the whole company: the CI manual down to logo master files and clear-space rules, the mascot and how it may be drawn, signage, uniforms, vehicles and merchandise, a four-language corporate site, and how the business and its distribution actually run. There is only one accent colour in the entire identity, a magenta diagonal taken from packing tape, and the manual doesn't allow a second one."
  },
  "ja": {
   "p": "YMYの企業識別、多言語サイト、事業と流通の仕組みを設計しました。",
   "b": "YMY は、日本のモールで販売する個人商店のために仕入れと発送を行う会社です。依頼を受けたとき、ブランドの見た目はまだ何もありませんでした。会社全体を設計しました。ロゴの原本データと余白のルールまで定めた CI マニュアル、マスコットとその描き方、看板、制服、車両、グッズ、4言語のコーポレートサイト、そして事業と流通の仕組みそのもの。識別に使う強調色は一つだけです。梱包テープから取ったマゼンタの斜線で、マニュアルは二つ目を認めていません。"
  },
  "zh": {
   "p": "為 YMY 設計企業識別、多語言官網與事業流通制度。",
   "b": "YMY 幫日本電商平台上的個人賣家做採購和出貨。剛找上我們的時候，它連一個識別都沒有。我們把整間公司設計出來：CI 手冊細到 logo 原始檔和留白規則、吉祥物和它的畫法、招牌、制服、車輛、周邊、四種語言的官網，還有這門生意和物流實際上怎麼運作。整套識別只有一個強調色：取自封箱膠帶的洋紅斜線，手冊不允許再加第二個。"
  },
  "hasIcon": 1
 },
 {
  "s": "kizuki",
  "n": "Kizuki",
  "jp": "気付き",
  "tint": "#14100F",
  "st": "dev",
  "plat": [
   "Web",
   "Telegram"
  ],
  "en": {
   "p": "Finds conversations about your products and drafts replies for a person to approve.",
   "b": "Kizuki finds conversations about your products, on your own listings and elsewhere, including ones in languages you don't read. It drafts a reply that reads naturally in that culture rather than a translation, and sends the draft to you in Telegram. It never posts on its own: a person taps send every time."
  },
  "ja": {
   "p": "商品に関する会話を見つけ、返信案を作成します。送信は人が確認して行います。",
   "b": "Kizuki は、あなたの商品について交わされている会話を見つけます。自社のページでも、それ以外の場所でも、読めない言語のものも含めて。返信は翻訳ではなく、その文化で自然に読める文面として下書きし、Telegram に届けます。自動で投稿することはありません。送信のボタンは毎回、人が押します。"
  },
  "zh": {
   "p": "找出與商品有關的討論，準備回覆草稿，再由人確認送出。",
   "b": "Kizuki 幫你找出別人在談論你產品的對話，不管是在你自己的商品頁，還是在其他地方，包括你看不懂的語言。它會擬一份在那個文化裡讀起來自然的回覆，不是翻譯，然後送到你的 Telegram。它不會自己發文，每一則都要有人按送出。"
  },
  "hasIcon": 1
 },
 {
  "s": "dramaflow",
  "n": "dramaflow",
  "jp": "短編ドラマ生産ライン",
  "tint": "#07080B",
  "st": "ops",
  "plat": [
   "Internal"
  ],
  "en": {
   "p": "A production pipeline for short drama that enforces rules for era, wardrobe and shot continuity.",
   "b": "dramaflow is a production pipeline for serialised vertical drama. Generated footage drifts easily: a phone shows up in a Qing-dynasty scene, a costume changes between cuts. So the pipeline starts with a rulebook for the series, covering era, vocabulary, wardrobe and taboos. Nothing is generated until the rulebook exists, and the pipeline enforces it rather than relying on people to remember. Every shot records which shot came before it, so the last frame of one becomes the first frame of the next."
  },
  "ja": {
   "p": "時代設定、衣装、連続性のルールを工程で守る短編ドラマ制作基盤です。",
   "b": "dramaflow は縦型の連続ドラマを作るための制作パイプラインです。生成した映像はすぐにずれます。清朝の場面にスマートフォンが映る、カットの間で衣装が変わる。だから最初に作品のルールブックを作ります。時代、語彙、衣装、禁じ手。ルールブックができるまで何も生成せず、守るのは人の注意ではなくパイプラインです。各カットは直前のカットを記録しているので、前の最後のフレームが次の最初のフレームになります。"
  },
  "zh": {
   "p": "用流程規則管理年代、服裝與鏡頭連戲的短劇製作平台。",
   "b": "dramaflow 是做直式連續短劇的製作流程。AI 生成的畫面很容易走樣：清朝的場景出現手機，兩個鏡頭之間服裝換了。所以一開始先訂這部戲的規則：年代、用詞、服裝、禁忌。規則沒訂好之前什麼都不生成，而且是流程本身擋住，不是靠大家自律。每個鏡頭都記著前一個鏡頭是誰，所以前一鏡的最後一格，就是下一鏡的第一格。"
  },
  "hasIcon": 1
 },
 {
  "s": "todoke",
  "n": "Todoke",
  "jp": "届け",
  "tint": "#1A1714",
  "st": "dev",
  "plat": [
   "Internal"
  ],
  "en": {
   "p": "Turn one script into narrated, subtitled videos in three languages.",
   "b": "Todoke turns one script into finished videos. It handles screen capture or motion graphics, text-to-speech narration, word-level subtitles, three languages, publishing, thumbnails and the view counts afterwards. We built it as a pipeline instead of an editor because the expensive part was never the cutting. It was repeating the same twelve steps for the second language, and then the third."
  },
  "ja": {
   "p": "一つの台本から、字幕とナレーション付き動画を3言語で制作します。",
   "b": "Todoke は一本の台本から完成した動画を作ります。画面収録かモーショングラフィック、読み上げのナレーション、単語ごとの字幕、3言語、公開、サムネイル、その後の再生数まで。編集ソフトではなくパイプラインとして作ったのは、高くつくのが編集そのものではなかったからです。二つ目の言語、三つ目の言語で、同じ12の工程をもう一度やること。それが高くつきました。"
  },
  "zh": {
   "p": "把一份腳本製作成三種語言的旁白與字幕影片。",
   "b": "Todoke 把一份腳本做成完整的影片：螢幕錄影或動態圖像、AI 旁白、逐字字幕、三種語言，然後發佈、縮圖，和之後回來的觀看數。我們把它做成流水線而不是剪輯軟體，因為真正花時間的從來不是剪片，而是為了第二種語言、第三種語言，把同樣的十二個步驟再做一遍。"
  },
  "hasIcon": 1
 }
];

  /* ── registry 對帳：兩個真相源必須完全對得上，對不上就大聲失敗 ──
     CRZ_I18N.work 決定產品數與 modal 索引；P 決定文案與 motif。
     任一邊多／少一個產品，靜默渲染出殘缺清單比整區壞掉更難被發現。 */
  function slugOf(w) {
    var m = /([^/]+)\.webp$/.exec(w.img || '');
    return m ? m[1] : null;
  }
  var byIndex = {};
  REG.forEach(function (w, i) {
    var s = slugOf(w);
    if (s) byIndex[s] = i;
  });
  var missing = P.filter(function (p) { return !(p.s in byIndex); }).map(function (p) { return p.s; });
  var extra = Object.keys(byIndex).filter(function (s) {
    return !P.some(function (p) { return p.s === s; });
  });
  if (missing.length || extra.length) {
    console.error('[work-v3] registry 對帳失敗 — P 缺:', missing, '/ registry 多:', extra);
  }

  function jpLangAttr(txt) { return /[぀-ヿ]/.test(String(txt || '')) ? ' lang="ja"' : ''; }
  function cardHTML(p) {
    var t = p[L];
    var idx = byIndex[p.s];
    var reg = idx === undefined ? null : REG[idx];
    var jpText = (reg && reg.jp) || p.jp;
    var plat = p.plat.length
      ? p.plat.map(function (b) { return '<b>' + b + '</b>'; }).join('')
      : '<b class="none">' + UNRELEASED[L] + '</b>';
    /* 三層混合（Yves 2026-08-09 拍板：「混合，兩邊各做各擅長的」）
         底層 AI 生成的品牌氛圍底圖 —— 材質、光線、景深，程式做不出來
         中層 程式即時渲染的 motif —— 會動、向量清晰，AI 做不到
         角落 該產品官方 app icon —— 統一尺寸與位置
       **不放手機或任何裝置外框**（Yves 講過兩次：那是十年前的設計）。
       slogan 不燒進圖裡，留在下面的 meta，否則 ja/zh 頁會變成英文圖 + 本地化字的重複。 */
    var bg = reg ? '<img class="stage__bg" src="' + reg.img
      + '" srcset="' + reg.img.replace('assets/kv/', 'assets/kv-800/') + ' 800w, ' + reg.img + ' 1600w" sizes="' + SIZES
      + '" alt="" loading="lazy" decoding="async" width="1600" height="1200" />' : '';
    /* 沒有官方 icon 的產品就不放標記 —— 不自己生一個。
       缺哪些由 audit-work-v3 的 AC-3 列名回報，等真的 icon 進來再補。 */
    var icon = (reg && p.hasIcon)
      ? '<img class="stage__icon" src="' + reg.img.replace(/assets\/kv\/[^/]+$/, 'assets/icons/' + p.s + '.webp') +
        '" alt="' + p.n + ' icon" loading="lazy" decoding="async" width="144" height="144" />'
      : '';
    return '<article class="card work-card" data-work-index="' + idx + '" tabindex="0" role="button" aria-label="' + OPEN[L].replace('{name}', p.n) + '">'
      + '<div class="stage" style="--tint:' + p.tint + '"' + (p.flat ? ' data-flat="1"' : '') + (p.border ? ' data-border="1"' : '') + '>' + bg + M[p.s] + icon + '</div>'
      + '<div class="card__meta"><h3 class="card__name"><em>' + p.n + '</em><i class="dot dot--' + p.st + '"></i></h3>'
      /* 副名（2026-09-04）：優先取本頁 i18n registry 的 jp（zh 頁有 10/16 是中文譯名），
         沒有才退回 work-copy.json 的日文。這樣卡片與 modal（都讀 registry）不會一個日文一個中文。
         lang="ja" 依假名偵測：有假名一定是日文；純漢字分不出日／中，不宣稱（WCAG 3.1.2）。 */
      + '<span class="card__jp"' + jpLangAttr(jpText) + '>' + jpText + '</span>'
      + '<p class="card__pos">' + t.p + '</p>'
      + '<div class="plat">' + plat + '</div>'
      + '<span class="card__more">' + MORE[L] + ' <i aria-hidden="true">→</i></span>'
      /* 完整正文放進卡片的 DOM（hidden），modal 開啟時直接讀它。
         兩個理由：① 不執行 JS 的 AI 爬蟲讀得到真正的內容，不是只有一句摘要
         ② modal 與爬蟲吃的是同一份字串，不可能分岔。
         這是標準的 accordion／tab 揭露模式 —— 內容對使用者真的可及（點卡片就看得到），
         不是藏字。 */
      + '<div class="card__detail" hidden>' + t.b + '</div>'
      + '</div></article>';
  }

  var ledeEl = document.getElementById('work-lede');
  var legendEl = document.getElementById('work-legend');
  if (ledeEl) ledeEl.textContent = LEDE[L].replace('{n}', String(REG.length));
  if (legendEl) {
    legendEl.innerHTML = LEGEND[L].map(function (x) {
      return '<span><i class="dot dot--' + x[0] + '"></i>' + x[1] + '</span>';
    }).join('');
  }
  /* 卡片可能已經由 prerender-work.mjs 靜態寫進 HTML（給不執行 JS 的 AI 爬蟲看）。
     已經有卡片就不要重畫 —— 內容一模一樣（同一份 cardHTML 產生），重畫只會多一次
     reflow，還會把已經套上的 reveal 狀態洗掉。 */
  if (!host.querySelector('.card')) host.innerHTML = P.map(cardHTML).join('');

  /* 把當前語言的完整文案交給 work-modal.js，索引與 CRZ_I18N.work 對齊
     （對帳在上面已做過，對不上會先大聲失敗）。
     modal 讀不到 body 就只能印 registry 的一句 line —— 那正是「點開反而更少」的成因。

     來源是 DOM 的 .card__detail，不是重新從 P 算一遍 —— 不管卡片是剛畫的還是
     prerender-work.mjs 早就靜態寫進 HTML 的，讀到的都是同一份字串，不會有
     「爬蟲看到的內容」與「modal 顯示的內容」兩份真相源分岔的可能。 */
  window.CRZ_WORK_COPY = REG.map(function () { return null; });
  [].forEach.call(host.querySelectorAll('.card'), function (card) {
    var i = Number(card.getAttribute('data-work-index'));
    var detail = card.querySelector('.card__detail');
    var pos = card.querySelector('.card__pos');
    if (!Number.isNaN(i) && detail) {
      window.CRZ_WORK_COPY[i] = { pos: pos ? pos.textContent : '', body: detail.innerHTML };
    }
  });

  /* ── reveal：卡片進入視窗才播它自己的動畫 ──
     沿用 canvas 的 scroll 驅動寫法。site.js 的 reveal 也是 scroll 驅動，
     理由相同：IntersectionObserver 在部分瀏覽器被節流時會漏觸發。 */
  var cards = [].slice.call(host.querySelectorAll('.card'));
  var pending = cards.slice();

  /* 觸控裝置沒有 hover，下面那組 mouseenter 重播永遠不會觸發。卡片的 motif 多半是
     `animation: ... both`（只播一次），而那一次是在卡片剛越過 vh*0.9、還在畫面
     下緣時播完的 —— 手機使用者實際上永遠看不到動態，只看得到停在最後一格的靜止圖。
     所以在 coarse pointer 上改成「卡片進入畫面中央帶就持續循環」：沿用既有的
     .is-looping（work-modal.css，本身包在 prefers-reduced-motion: no-preference
     內，暈動症使用者不受影響），不另外寫一套動畫。
     只讓中央帶內的卡片循環 —— 390px 螢幕同時至多 1–2 張在跑，不會 16 張一起燒電。 */
  var COARSE = window.matchMedia && window.matchMedia('(hover: none)').matches;

  function check() {
    var vh = window.innerHeight;
    for (var i = pending.length - 1; i >= 0; i--) {
      var el = pending[i], r = el.getBoundingClientRect();
      if (r.top < vh * 0.9 && r.bottom > vh * 0.05) {
        el.classList.add('is-in');
        el.querySelector('.stage').classList.add('is-live');
        pending.splice(i, 1);
      }
    }
    if (!COARSE) return;
    for (var j = 0; j < cards.length; j++) {
      var c = cards[j], b = c.getBoundingClientRect(), st = c.querySelector('.stage');
      if (!st) continue;
      st.classList.toggle('is-looping', b.top < vh * 0.85 && b.bottom > vh * 0.15);
    }
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
  /* 循環開關只在捲動位置改變時需要重算，交給上面的 scroll/resize 監聽即可 ——
     不留常駐 interval，手機才不會在使用者停著不動時持續空轉耗電。 */
  var timer = setInterval(function () { check(); if (!pending.length) clearInterval(timer); }, 300);
  check();

  cards.forEach(function (c) {
    var stage = c.querySelector('.stage');
    function replay() {
      stage.classList.remove('is-live');
      void stage.offsetWidth;
      stage.classList.add('is-live');
    }
    c.addEventListener('mouseenter', replay);
    c.addEventListener('focus', replay);
  });
})();
