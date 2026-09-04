#!/usr/bin/env node
/* ============================================================
   gen-work-v3.mjs — 由 Claude Design 的 Work v3 產出 site/js/work-v3.js

   為什麼要生成而不是手抄：`M`（12 個 motif SVG）與 `P`（12 產品 × 三語文案）
   合計約 14KB，手抄一次就是一次轉錄漂移的機會，而且下次 canvas 更新又要再抄一次。
   這支腳本從落檔的 export HTML **原樣切出**那兩個宣告，外面包上正式站需要的殼。
   canvas 改版 → 重新 DesignSync 落檔 → 跑這支 → diff 只會出現真正的內容差異。

   用法：node scripts/gen-work-v3.mjs
   退出：0 成功 / 2 來源結構不符（不靜默產出殘缺檔）
   ============================================================ */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'docs/design-system/source/claude-design-export/Work v3.html');
const OUT = join(ROOT, 'site/js/work-v3.js');

const src = readFileSync(SRC, 'utf8');

/** 原樣切出一段宣告：從 `var <name>` 起，到該行層級的結尾標記為止。 */
function slice(name, endMark) {
  const start = src.indexOf(`var ${name}=`);
  if (start < 0) {
    console.error(`❌ 來源找不到 \`var ${name}=\` — Work v3.html 結構已變，拒絕產出`);
    process.exit(2);
  }
  const end = src.indexOf(endMark, start);
  if (end < 0) {
    console.error(`❌ \`var ${name}\` 找不到結尾標記 ${JSON.stringify(endMark)}`);
    process.exit(2);
  }
  return src.slice(start, end + endMark.length);
}

const M = slice('M', '</svg>\'};');
const P_RAW = slice('P', '\n];');

/* 文案的真相源是 docs/design-system/work-copy.json，不是 canvas。
   Yves 2026-08-09：「文字的说明要更人类一点，说明产品是什么？解决什么问题，
   有什么地方特别，别人少见，我们做的很好的」。canvas 那版偏工程筆記，
   而且以後新增產品時，改一個 JSON 比回頭改畫布容易得多。
   canvas 仍然是 **motif 與版位 meta**（tint / status / 平台 / flat·nophone·border）的來源。 */
const COPY = JSON.parse(readFileSync(join(ROOT, 'docs/design-system/work-copy.json'), 'utf8'));
const meta = new Function(`${P_RAW}\nreturn P;`)();
const missingCopy = meta.filter((m) => !COPY[m.s]).map((m) => m.s);
if (missingCopy.length) {
  console.error(`❌ work-copy.json 缺這些產品的文案：${missingCopy.join(', ')}`);
  process.exit(2);
}
for (const m of meta) {
  for (const l of ['en', 'ja', 'zh']) {
    const c = COPY[m.s][l];
    if (!c || !c.pos || !c.body) { console.error(`❌ ${m.s} 缺 ${l} 文案`); process.exit(2); }
    m[l] = { p: c.pos, b: c.body };
  }
}
/* canvas 之外新增的產品（例如客戶案 YMY）：在 work-copy.json 自己的區塊裡
   多帶 meta 與 motif 兩個欄位，這裡自動接上。以後加新產品只要改那一個檔。 */
const canvasSlugs = new Set(meta.map((m) => m.s));
const extraMotifs = [];
const overrides = [];
for (const [slug, entry] of Object.entries(COPY)) {
  if (slug.startsWith('$')) continue;
  /* canvas 產品也可以覆寫 motif —— 但必須寫明理由，否則就是在無聲偏離設計稿。
     目前唯一案例：mairi 的 canvas motif 畫的是「鳥居 + 六小時失效 QR」，
     而線上站台把受診 QR 列為「今後対応予定」，那個 motif 在講還沒有的功能。 */
  if (canvasSlugs.has(slug)) {
    if (!entry.motif) continue;
    if (!entry.$motifOverride) {
      console.error(`❌ ${slug} 覆寫了 canvas motif，必須在 work-copy.json 同時寫 $motifOverride 說明理由`);
      process.exit(2);
    }
    overrides.push(`${slug}:${JSON.stringify(entry.motif)}`);
    console.log(`↻ ${slug} motif 覆寫 canvas：${entry.$motifOverride}`);
    continue;
  }
  if (!entry.meta || !entry.motif) {
    console.error(`❌ ${slug} 是 canvas 之外的新產品，必須同時提供 meta 與 motif`);
    process.exit(2);
  }
  const m = { ...entry.meta };
  for (const l of ['en', 'ja', 'zh']) m[l] = { p: entry[l].pos, b: entry[l].body };
  meta.push(m);
  extraMotifs.push(`${slug}:${JSON.stringify(entry.motif)}`);
}
/* icon 檔不存在就不要渲染 <img> —— 否則瀏覽器顯示破圖與 alt 文字，
   看起來像一個寫著產品名的白方塊（2026-08-09 實拍抓到 Mairi/Kizuki/Todoke 都這樣）。
   缺哪些由 audit-work-v3 的 AC-3 列名回報，不自己補一個 icon。 */
for (const m of meta) {
  m.hasIcon = existsSync(join(ROOT, 'site/assets/icons', `${m.s}.webp`)) ? 1 : 0;
}
const P = `var P=${JSON.stringify(meta, null, 1)};`;

// 交叉驗證：兩個宣告都必須恰好涵蓋 12 個產品，否則寧可失敗也不產出殘缺檔。
const slugs = meta.map((m) => m.s);
const motifKeys = [...M.matchAll(/^([a-z0-9]+):'<svg/gm)].map((m) => m[1]);
const allMotifKeys = motifKeys.concat(extraMotifs.map((e) => e.split(':')[0]));
if (slugs.length !== allMotifKeys.length) {
  console.error(`❌ 產品數不符：P=${slugs.length} motif=${allMotifKeys.length}`);
  process.exit(2);
}
const noMotif = slugs.filter((s) => !allMotifKeys.includes(s));
if (noMotif.length) {
  console.error(`❌ 這些產品沒有對應 motif：${noMotif.join(', ')}`);
  process.exit(2);
}

const out = `/* ============================================================
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

/* ── motifs：canvas 的原樣切出，加上 work-copy.json 帶進來的新產品 ── */
${M}
${extraMotifs.length ? `Object.assign(M, {${extraMotifs.join(',')}});` : ''}
${overrides.length ? `/* 覆寫 canvas motif（理由見 work-copy.json 的 $motifOverride） */\nObject.assign(M, {${overrides.join(',')}});` : ''}

/* ── 12 產品 × 三語（各自撰寫，非直譯；原樣自 canvas 切出） ── */
${P}

  /* ── registry 對帳：兩個真相源必須完全對得上，對不上就大聲失敗 ──
     CRZ_I18N.work 決定產品數與 modal 索引；P 決定文案與 motif。
     任一邊多／少一個產品，靜默渲染出殘缺清單比整區壞掉更難被發現。 */
  function slugOf(w) {
    var m = /([^/]+)\\.webp$/.exec(w.img || '');
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

  function jpLangAttr(txt) { return /[\u3040-\u30ff]/.test(String(txt || '')) ? ' lang="ja"' : ''; }
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
    var bg = reg ? '<img class="stage__bg" src="' + reg.img + '" alt="" loading="lazy" decoding="async" width="1600" height="1200" />' : '';
    /* 沒有官方 icon 的產品就不放標記 —— 不自己生一個。
       缺哪些由 audit-work-v3 的 AC-3 列名回報，等真的 icon 進來再補。 */
    var icon = (reg && p.hasIcon)
      ? '<img class="stage__icon" src="' + reg.img.replace(/assets\\/kv\\/[^/]+$/, 'assets/icons/' + p.s + '.webp') +
        '" alt="' + p.n + ' icon" loading="lazy" decoding="async" width="144" height="144" />'
      : '';
    return '<article class="card work-card" data-work-index="' + idx + '" tabindex="0" role="button" aria-label="Open ' + p.n + '">'
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
     \`animation: ... both\`（只播一次），而那一次是在卡片剛越過 vh*0.9、還在畫面
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
`;

writeFileSync(OUT, out);
console.log(`✅ site/js/work-v3.js 已生成（${slugs.length} 產品 / ${allMotifKeys.length} motif，${out.length} bytes）`);
console.log(`   產品：${slugs.join(', ')}`);
