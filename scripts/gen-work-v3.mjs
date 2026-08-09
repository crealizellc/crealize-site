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
import { readFileSync, writeFileSync } from 'node:fs';
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
const P = `var P=${JSON.stringify(meta, null, 1)};`;

// 交叉驗證：兩個宣告都必須恰好涵蓋 12 個產品，否則寧可失敗也不產出殘缺檔。
const slugs = meta.map((m) => m.s);
const motifKeys = [...M.matchAll(/^([a-z0-9]+):'<svg/gm)].map((m) => m[1]);
if (slugs.length !== 12 || motifKeys.length !== 12) {
  console.error(`❌ 產品數不符：P=${slugs.length} motif=${motifKeys.length}（期望各 12）`);
  process.exit(2);
}
const noMotif = slugs.filter((s) => !motifKeys.includes(s));
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

/* ── motifs: authored from each product's real mechanism（原樣自 canvas 切出） ── */
${M}

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
      ? '<img class="stage__icon" src="' + reg.img.replace(/assets\\/kv\\/[^/]+$/, 'assets/icons/' + p.s + '.webp') +
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
`;

writeFileSync(OUT, out);
console.log(`✅ site/js/work-v3.js 已生成（${slugs.length} 產品 / ${motifKeys.length} motif，${out.length} bytes）`);
console.log(`   產品：${slugs.join(', ')}`);
