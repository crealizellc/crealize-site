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

  var LEDE = {
    en: "Twelve products. Each one is a mechanism we thought should exist — so we built the smallest honest version of it and shipped.",
    ja: "12のプロダクト。どれも「この仕組みはあるべきだ」という一点から始め、いちばん小さくて誠実な形にして世に出しました。",
    zh: "十二個產品。每一個都始於「這個機制應該存在」，然後做成最小、也最誠實的那個版本，送出去。"
  };

  var LEGEND = {
    en: [['live', 'shipped'], ['dev', 'in development'], ['ops', 'in operation']],
    ja: [['live', '公開中'], ['dev', '開発中'], ['ops', '運営中']],
    zh: [['live', '已上線'], ['dev', '開發中'], ['ops', '營運中']]
  };

  var UNRELEASED = { en: 'unreleased', ja: '未リリース', zh: '尚未上架' };

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
Object.assign(M, {ymy:"<svg class=\"m\" viewBox=\"0 0 320 240\"><g class=\"ymy-marks\" fill=\"none\" stroke=\"#FFF9F7\" stroke-width=\"13\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M56 84 L80 118 L104 84 M80 118 V162\"/><path d=\"M132 162 V96 L160 130 L188 96 V162\"/><path d=\"M216 84 L240 118 L264 84 M240 118 V162\"/></g><path class=\"ymy-tape m-draw\" style=\"--len:210\" d=\"M196 72 L146 178\" fill=\"none\" stroke=\"#D52A5B\" stroke-width=\"22\" stroke-linecap=\"square\"/></svg>"});

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
   "p": "Know what's actually in the jar before it touches your skin.",
   "b": "An ingredient list is written for regulators, not for you, and the internet will happily give you five contradictory answers about the same chemical. PurityLens reads the label and tells you where that product stands for <b>your</b> skin. What almost nobody else does: every verdict shows its receipts — how much came from TFDA, CosIng, CIR, PubChem, and how much from AI. If we aren't sure, you can see that we aren't sure."
  },
  "ja": {
   "p": "肌にのせる前に、その一本の中身がわかる。",
   "b": "成分表は規制のために書かれていて、消費者のためには書かれていません。ネットで調べれば同じ成分に五通りの説明が出てきます。PurityLensはラベルを読み取り、それが<b>あなたの</b>肌にとってどうなのかを示します。他がやっていないのは根拠の開示です。判定のうちTFDA・CosIng・CIR・PubChemが何割で、AIが何割か。自信がないときは、自信がないことがそのまま見えます。"
  },
  "zh": {
   "p": "在擦上去之前，先知道這罐裡面到底是什麼。",
   "b": "成分表是寫給主管機關看的，不是寫給你看的；上網查同一個成分，你會得到五種互相矛盾的說法。PurityLens 讀完標籤，告訴你這罐對<b>你的</b>膚況而言站在什麼位置。少有人做的是把依據攤開：這個判定有幾成來自 TFDA、CosIng、CIR、PubChem，幾成來自 AI。我們沒把握的時候，你看得出來我們沒把握。"
  }
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
   "p": "A 290-year-old maths problem, turned into a morning habit.",
   "b": "Most puzzle apps want your evening and your attention span. Fudeto wants ninety seconds: one unbroken stroke across every bridge, one puzzle a day, the same one for everyone on earth. The mechanism is Euler's, from 1736, and we say so — what we actually compete on is the packaging. Every board is generated live from a date hash, so the app ships with no artwork at all, and the share card exists to leave the app rather than trap you in it."
  },
  "ja": {
   "p": "290年前の数学の問題を、朝の習慣に。",
   "b": "パズルアプリの多くは、あなたの夜と集中力を丸ごと欲しがります。Fudetoが欲しいのは90秒だけ。すべての橋を一度ずつ渡る一筆書きを、世界共通の一日一問で。仕組みは1736年のオイラーのもので、そこは隠しません。競っているのは仕組みではなく、その包み方です。盤面は日付ハッシュから即時生成するので画像素材は一枚も持たず、共有カードはあなたを閉じ込めるためでなく、アプリの外へ出るために作りました。"
  },
  "zh": {
   "p": "把 290 年前的數學題，變成每天早上的習慣。",
   "b": "多數解謎 App 想要的是你整個晚上。Fudeto 只要九十秒：一筆走完所有的橋，一天一題，全世界同一題。機制是 1736 年歐拉的，我們直說——真正在競爭的是包裝，不是機制。每一局都由日期雜湊即時生成，所以整個 App 裡沒有一張美術圖；分享卡的存在是為了讓它離開 App，而不是把你留下來。"
  }
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
   "p": "Photograph a receipt, get one clean row in your own spreadsheet.",
   "b": "Japanese sole traders lose whole evenings to a shoebox of receipts, and most bookkeeping apps solve that by locking your data inside their database. Kichitto writes into <b>your</b> Drive and <b>your</b> Sheets, splits 8% and 10% consumption tax automatically, and never asks you to migrate anything. The unusual part is what it refuses to do: near-duplicate receipts are never silently merged. Registration numbers aren't guaranteed unique, and a merge that quietly eats a real transaction is worse than a duplicate you can see."
  },
  "ja": {
   "p": "レシートを一枚撮れば、あなたのシートに一行。",
   "b": "個人事業主の夜は、たまったレシートに消えていきます。多くの記帳アプリはそれを、自社のデータベースに囲い込むことで解決します。Kichittoが書き込むのは<b>あなたの</b>DriveとSheets。8%と10%の消費税は自動で分け、移行作業は一切求めません。特徴的なのは「やらないこと」です。似たレシートを黙って統合することは決してしません。登録番号は一意とは限らず、静かに本物の取引を消してしまうくらいなら、目に見える重複のほうがましだからです。"
  },
  "zh": {
   "p": "拍一張收據，變成你自己表格裡的一列。",
   "b": "日本的個人事業主，晚上都耗在一盒收據上；而多數記帳 App 的解法，是把你的資料鎖進它自己的資料庫。Kichitto 寫進的是<b>你的</b> Drive 與<b>你的</b> Sheets，8% 與 10% 消費稅自動拆開，不要求你搬家。比較少見的是它拒絕做的事：近似的重複收據永遠不會被靜默合併。登錄番號不保證唯一，與其安靜地吃掉一筆真交易，不如留一筆你看得見的重複。"
  }
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
   "p": "A cycle tracker that doesn't raise its voice.",
   "b": "Health apps have learned all the growth tricks — streaks you mustn't break, notifications that imply something is wrong, horoscopes bolted onto your body data. QiFlux does none of it. At least 60% of every screen stays empty, and when a screen feels crowded we delete something rather than rearrange it. And the cancel button is never hidden: if you want to leave, we are not going to make that hard."
  },
  "ja": {
   "p": "大きな声を出さない、周期トラッカー。",
   "b": "健康アプリはグロースの手口を覚えてしまいました。途切れさせてはいけない連続記録、何か異常があるかのような通知、体のデータに接ぎ木された占い。QiFluxはそのどれもやりません。画面の6割以上は余白のまま残し、詰まって見えたら並べ替えるのではなく削ります。解約ボタンを隠すこともしません。やめたいときに、やめにくくはしません。"
  },
  "zh": {
   "p": "一個不對你大聲說話的週期紀錄。",
   "b": "健康 App 把成長手法都學會了：不能斷的連續紀錄、暗示你身體出事的推播、接在生理數據上的占星。QiFlux 一樣都不做。每一屏至少留六成空白，哪裡覺得太滿，我們是刪掉而不是重排。取消訂閱的按鈕也永遠不藏——你想走的時候，我們不會讓它變難。"
  }
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
   "p": "Your business cards are read on your phone, and stay on your phone.",
   "b": "Every card scanner asks you to upload your professional network to someone else's server. Meishitto starts on-device: free ML Kit recognition first, and only what falls below a 0.75 confidence threshold is ever sent to a cloud model. Something you rarely see spelled out — animations are capped at 400ms and drop to zero under reduce-motion, because large motion can trigger vertigo in people with vestibular disorders. That reason is written in the source, not just in a policy page."
  },
  "ja": {
   "p": "名刺は端末の中で読み取り、そのまま端末に残ります。",
   "b": "名刺アプリはたいてい、あなたの人脈をどこかのサーバーに預けろと言います。Meishittoはまず端末内で処理します。無料のML Kitで読み取り、信頼度0.75を下回ったものだけがクラウドのモデルへ渡ります。あまり明文化されないところも書いています。アニメーションは上限400ms、reduce motion時はゼロ。大きな動きは前庭障害のある方にめまいを起こしうるからで、その理由はポリシーページではなくソースコードに残してあります。"
  },
  "zh": {
   "p": "名片在你手機裡辨識完，資料也留在你手機裡。",
   "b": "名片 App 幾乎都要你把人脈上傳到別人的伺服器。Meishitto 先在裝置上做：免費的 ML Kit 跑第一輪，只有信心低於 0.75 的才送雲端模型。比較少見的是把理由寫清楚——動畫上限 400ms、開啟「減少動態」時歸零，因為大幅位移可能誘發前庭功能障礙者暈眩。這個理由寫在程式碼註解裡，不是只寫在政策頁上。"
  }
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
   "p": "A number puzzle where every move sounds a note.",
   "b": "2048 is a solved genre — after a few hundred games it goes quiet. Rythix composes the soundtrack on your device while you play, so no two sessions sound alike; nothing is pre-recorded and nothing is streamed. The restraint is the point: mute it and you still have a perfectly good numbers puzzle. The music is addition, never a requirement, and never a reason to keep the volume up in a meeting."
  },
  "ja": {
   "p": "一手ごとに音が鳴る、数字パズル。",
   "b": "2048というジャンルはやり尽くされていて、何百局か遊ぶと静かになります。Rythixは遊んでいる最中に端末上で曲を生成するので、同じ一局は二度とありません。録音済みの音源も配信もありません。抑制がこの作品の要点です。消音にしても、ちゃんと面白い数字パズルとして成立します。音楽は足し算であって条件ではなく、会議中に音量を上げる理由にもなりません。"
  },
  "zh": {
   "p": "每走一步就發出一個音的數字謎題。",
   "b": "2048 這個類型早就被玩透了，幾百局之後就安靜了。Rythix 在你遊玩的當下於裝置上即時作曲，所以沒有兩局聽起來一樣，沒有預錄、也沒有串流。克制才是重點：靜音之後，它依然是個好玩的數字謎題。音樂是加法，不是門檻，也不會變成你在會議中非開喇叭不可的理由。"
  }
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
   "p": "Visit every point exactly once. There is no formula.",
   "b": "Its sibling Fudeto walks edges, which is easy maths — count how many points have an odd number of lines and you know the answer before you start. Tendo walks vertices, which is NP-complete: no formula exists, only intuition and backtracking. Realising that is the whole game. The part we're proudest of is quieter: it's fully playable with a single switch, and VoiceOver announces each vertex, so the puzzle stays a puzzle for people who can't swipe."
  },
  "ja": {
   "p": "すべての点を、ちょうど一度ずつ。公式はありません。",
   "b": "姉妹作のFudetoは辺をたどるので、数学的には簡単です。奇数本の線が集まる点を数えれば、始める前に答えがわかります。Tendoは点をたどる、NP完全の問題。公式は存在せず、直感とバックトラックしかありません。「公式がない」と気づく瞬間そのものが、この作品の山場です。もっと静かな自慢もあります。スイッチひとつで最後まで遊べ、VoiceOverが頂点を読み上げる。スワイプできない人にとっても、これはちゃんとパズルのままです。"
  },
  "zh": {
   "p": "每個點剛好走一次。沒有公式。",
   "b": "姊妹作 Fudeto 走的是邊，數學上很簡單——數一數有幾個點連著奇數條線，開始前就知道答案。Tendo 走的是點，屬於 NP-complete：沒有通解公式，只剩直覺與回溯。而「發現沒有公式」本身就是整個遊戲。我們更在意的是另一件比較安靜的事：它可以只用單一開關完整遊玩，VoiceOver 會逐頂點朗讀，讓滑不動螢幕的人也還有一個真正的謎題。"
  }
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
   "p": "The same two charts, read through a different lens, become a different reading.",
   "b": "Most divination apps are database lookups wearing a mystical skin: you get the same paragraph everyone else gets. Star Bonds reads a pair of charts through one of four relationships — love, family, work, or the people around you — and it's the interpretation logic that changes with the lens, not just the adjectives. The Voice of Mercury goes further and explains a public figure's most famous line by their Mercury placement, so the page reads like someone actually read for you."
  },
  "ja": {
   "p": "同じ二枚の盤も、レンズを替えれば別の読みになる。",
   "b": "占いアプリの多くは、神秘的な皮をかぶったデータベース検索です。誰が引いても同じ段落が返ってきます。Star Bondsは二枚の命盤を、恋愛・家族・仕事・人づきあいという四つの関係のいずれかを通して読みます。レンズで変わるのは形容詞ではなく、解釈のロジックそのものです。The Voice of Mercuryはさらに踏み込み、著名人の名言をその人の水星の配置から説き明かします。検索結果ではなく、誰かが本当に読んでくれた文章になるように。"
  },
  "zh": {
   "p": "同樣兩張盤，換一副鏡片，就是另一套讀法。",
   "b": "多數命理 App 是披著神秘外皮的資料庫查表：誰抽到都是同一段話。Star Bonds 把兩張命盤放進愛情、家人、工作、身邊的人四種關係之一底下解讀，而換鏡片改變的是解釋邏輯本身，不只是形容詞。The Voice of Mercury 更進一步，用名人的水星配置去解釋他最著名的那句話，讓一頁讀起來像真的有人替你讀過，而不是查了一次資料庫。"
  }
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
   "p": "The lunar new year red packet, as Web3's everyday gesture.",
   "b": "Web3 has airdrops, which happen once, and DeFi, which is rare and full of friction. What it has never had is something people do casually and often. A red packet is that gesture — non-custodial, multi-chain, dropped straight into a Telegram group where the conversation already is. The unusual decision is the ceiling: the referral loop is capped on purpose at 100 per person and ten million globally, because a growth mechanic with no limit stops being a gift and becomes a farm."
  },
  "ja": {
   "p": "紅包を、Web3の日常の動作に。",
   "b": "Web3には一度きりのエアドロップと、低頻度で摩擦の大きいDeFiしかありません。欠けているのは、人が気軽に何度もやることです。紅包はその動作になれます。ノンカストディアル、マルチチェーンで、会話がすでにあるTelegramのグループにそのまま投げ込めます。変わっているのは上限を設けたことです。紹介の輪は1人100件、全体で1,000万件で意図的に止めます。上限のないグロース施策は、贈り物ではなく農場になってしまうからです。"
  },
  "zh": {
   "p": "把紅包變成 Web3 的日常動作。",
   "b": "Web3 有一次性的空投，有低頻又高摩擦的 DeFi，唯獨沒有「人們會隨手、常常做」的那件事。紅包就是那個動作：非託管、多鏈，直接丟進對話本來就在的 Telegram 群組。比較少見的決定是我們刻意設了上限——推薦迴圈每人封頂 100、全球封頂一千萬。沒有上限的成長機制，就不再是禮物，而是農場。"
  }
 },
 {
  "s": "idokuta",
  "n": "iDokuta",
  "jp": "言葉を越える診療",
  "tint": "#F8FBFB",
  "st": "dev",
  "plat": [],
  "en": {
   "p": "For the moment you have to explain your symptoms in Japanese.",
   "b": "Living in Japan is fine until you're unwell at a clinic reception, holding a form, unable to say the one word that matters. iDokuta lets you write how you feel in your own language and hands it back as clear medical Japanese, with the key terms explained so you know what you just said. It isn't built to be a translator — it's built for the second you turn the phone around and show it to someone. Five languages. <b>A language tool, not medical advice — always consult a doctor.</b>"
  },
  "ja": {
   "p": "症状を日本語で説明しなければならない、その瞬間のために。",
   "b": "日本での暮らしは、体調を崩して受付に立ち、問診票を前に肝心のひと言が出てこないその瞬間まではうまくいきます。iDokutaは母語で書いた症状を、はっきりした日本語にして返します。要点の医療用語には説明がつくので、自分が何と言ったのかもわかります。翻訳機として作ったのではありません。画面を相手に向けて見せる、あの一瞬のために作りました。5言語対応。<b>これは言葉の道具であり、医療上の助言ではありません。必ず医師にご相談ください。</b>"
  },
  "zh": {
   "p": "為了你必須用日文說出哪裡不舒服的那一刻。",
   "b": "在日本生活一切都好，直到你身體不適、站在診所櫃檯前、手上拿著問診單，卻說不出最關鍵的那個詞。iDokuta 讓你用自己的語言寫下感受，換回清楚的醫療日文，關鍵術語附上解釋，所以你也知道自己剛剛說了什麼。它不是當翻譯機做的——是為了「把手機轉過去給對方看」的那一秒做的。支援五種語言。<b>這是語言工具，不是醫療建議 —— 請務必諮詢醫師。</b>"
  }
 },
 {
  "s": "mairi",
  "n": "Mairi",
  "jp": "毎日のカルテ",
  "tint": "#FAF8F5",
  "st": "dev",
  "plat": [],
  "en": {
   "p": "What you write down every day, made useful on the day you're seen.",
   "b": "Japan has no shortage of single-purpose health records — one app for blood pressure, another for medication, a paper notebook for the pharmacy. None of them carry a daily habit through to the ten minutes you actually get with a doctor. Mairi does, and hands the record over as a two-layer QR code. Here's the part nobody else ships: that code hard-expires in six hours and cannot be renewed. The usual medication notebook gives out a permanent code — we decided expiry was a feature, not a limitation."
  },
  "ja": {
   "p": "毎日つけているものが、受診の日に効く。",
   "b": "日本に単機能の健康記録は数えきれないほどあります。血圧はこのアプリ、薬はあのアプリ、薬局には紙の手帳。けれど毎日の習慣を、医師と向き合うあの十分間まで運んでくれるものはありません。Mairiはそれをやり、記録を二層QRで渡します。他がやっていないのはここです。そのコードは6時間で強制的に失効し、延長できません。従来のお薬手帳は永続QRを配ります。私たちは、失効することを制約ではなく機能だと考えました。"
  },
  "zh": {
   "p": "每天記下的那些，在就診那天真的派得上用場。",
   "b": "日本不缺單點功能的健康紀錄：血壓一個 App、用藥一個 App、藥局再給你一本紙手帳。但沒有一個能把每天的習慣，帶到你真正見到醫師的那十分鐘。Mairi 做到了，並且用雙層 QR 把紀錄交出去。少有人敢做的是這一步：那組碼六小時硬過期，而且不可續期。一般的お薬手帳給的是永久 QR——我們認為「會過期」是功能，不是限制。"
  }
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
   "p": "Listing, order, support and payout, closed into one loop.",
   "b": "A resale business that grows fast ends up running on about forty microservices that nobody can hold in their head at once. Meguru folds that into a single platform. What makes it unusual isn't the consolidation, it's where we drew the line for automation: a reconciliation difference only ever produces a proposal, and a person approves it. Refunds, complaints and angry messages are never answered automatically. Human-in-the-loop here is structural, written into the system, not a promise in a deck."
  },
  "ja": {
   "p": "出品・受注・サポート・支払いを、ひと巡りに閉じる。",
   "b": "リセール事業は伸びるほど、誰も全体を把握できない40ほどのマイクロサービスの上で回るようになります。Meguruはそれをひとつのプラットフォームに畳みました。特徴は統合そのものではなく、自動化の線をどこに引いたかです。対帳の差異は提案を出すだけで、承認するのは必ず人。返金・クレーム・強い怒りを含む連絡には、自動では返しません。human-in-the-loopは資料上の約束ではなく、システムの構造として組み込んであります。"
  },
  "zh": {
   "p": "上架、接單、客服、撥款，收成一圈。",
   "b": "轉售生意長得越快，最後就跑在大約四十個沒有人能同時掌握的微服務上。Meguru 把它們收斂成單一平台。真正特別的不是整合，而是我們把自動化的線畫在哪：對帳差異只會產生一份提案，動手核准的一定是人；退款、客訴與高怒氣訊息，絕不自動回覆。human-in-the-loop 在這裡是結構性的，寫進系統裡，不是簡報上的一句承諾。"
  }
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
   "p": "One company, designed end to end.",
   "b": "YMY sources and fulfils for individual sellers on Japan's marketplaces — and it arrived with no identity at all. We designed the whole enterprise: the CI standard down to logo vector masters and safe-space rules, the mascot and its generation standard, the signage, uniforms, vehicles and merchandise, the four-language corporate site, and the way the business and its distribution actually work. The discipline is in the restraint. The magenta diagonal — taken from packing tape and the path goods travel — is the only accent in the entire identity, and the standard forbids adding a second one."
  },
  "ja": {
   "p": "一社まるごと、端から端まで設計する。",
   "b": "YMYは日本のECモール上の個人商店に仕入れと物流を提供する会社で、依頼を受けた時点でアイデンティティは何もありませんでした。企業全体を設計しています。ロゴのベクター母版とアイソレーションまで定めたCI規定、マスコットとその生成基準、看板・制服・車輌・グッズ、4言語のコーポレートサイト、そして事業と流通の仕組みそのもの。要はどこまで我慢するかです。封函テープと物が流れる経路から取った洋紅の斜線は、この識別全体で唯一の強調で、規定は二つ目を足すことを禁じています。"
  },
  "zh": {
   "p": "一整間公司，從頭到尾一次設計。",
   "b": "YMY 為日本電商平台上的個人商家做採購與代發，接手時它沒有任何識別。我們設計的是整間企業：從 logo 向量母版與安全空間規則的 CI 規範、吉祥物與它的生成標準、招牌制服車輛周邊、四語官網，一直到事業與經銷制度本身怎麼運作。真正的功夫在克制——那道取自封箱膠帶與貨物流動路徑的洋紅斜線，是整套識別裡唯一的強調，而規範明文禁止再加第二個。"
  }
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

  function cardHTML(p) {
    var t = p[L];
    var idx = byIndex[p.s];
    var reg = idx === undefined ? null : REG[idx];
    var plat = p.plat.length
      ? p.plat.map(function (b) { return '<b>' + b + '</b>'; }).join('')
      : '<b class="none">' + UNRELEASED[L] + '</b>';
    /* 三層混合（Yves 2026-08-09 拍板：「混合，兩邊各做各擅長的」）
         底層 AI 生成的品牌氛圍底圖 —— 材質、光線、景深，程式做不出來
         中層 程式即時渲染的 motif —— 會動、向量清晰，AI 做不到
         角落 該產品官方 app icon —— 統一尺寸與位置
       **不放手機或任何裝置外框**（Yves 講過兩次：那是十年前的設計）。
       slogan 不燒進圖裡，留在下面的 meta，否則 ja/zh 頁會變成英文圖 + 本地化字的重複。 */
    var bg = reg ? '<img class="stage__bg" src="' + reg.img + '" alt="" loading="lazy" decoding="async" width="1600" height="1200" />' : '';
    var icon = reg
      ? '<img class="stage__icon" src="' + reg.img.replace(/assets\/kv\/[^/]+$/, 'assets/icons/' + p.s + '.webp') +
        '" alt="' + p.n + ' icon" loading="lazy" decoding="async" width="256" height="256" />'
      : '';
    return '<article class="card work-card" data-work-index="' + idx + '" tabindex="0" role="button" aria-label="Open ' + p.n + '">'
      + '<div class="stage" style="--tint:' + p.tint + '"' + (p.flat ? ' data-flat="1"' : '') + (p.border ? ' data-border="1"' : '') + '>' + bg + M[p.s] + icon + '</div>'
      + '<div class="card__meta"><h3 class="card__name"><em>' + p.n + '</em><i class="dot dot--' + p.st + '"></i></h3>'
      + '<span class="card__jp">' + p.jp + '</span>'
      + '<p class="card__pos">' + t.p + '</p><p class="card__body">' + t.b + '</p>'
      + '<div class="plat">' + plat + '</div></div></article>';
  }

  var ledeEl = document.getElementById('work-lede');
  var legendEl = document.getElementById('work-legend');
  if (ledeEl) ledeEl.textContent = LEDE[L];
  if (legendEl) {
    legendEl.innerHTML = LEGEND[L].map(function (x) {
      return '<span><i class="dot dot--' + x[0] + '"></i>' + x[1] + '</span>';
    }).join('');
  }
  host.innerHTML = P.map(cardHTML).join('');

  /* ── reveal：卡片進入視窗才播它自己的動畫 ──
     沿用 canvas 的 scroll 驅動寫法。site.js 的 reveal 也是 scroll 驅動，
     理由相同：IntersectionObserver 在部分瀏覽器被節流時會漏觸發。 */
  var cards = [].slice.call(host.querySelectorAll('.card'));
  var pending = cards.slice();
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
  }
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check);
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
