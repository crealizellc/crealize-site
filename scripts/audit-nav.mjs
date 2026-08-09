#!/usr/bin/env node
/**
 * 導覽可用性驗收 —— 三語 × 窄視口。
 *
 * 為什麼要有這支：site.css 的 `@media (max-width:1080px){ .nav__links{display:none} }`
 * 從一開始就在，卻沒有任何替代入口。平板與全部手機上四個區塊完全無法跳轉，只能捲完
 * 五萬多像素 —— 而既有五道 gate（kv 母版 / kv registry / kv 畫質 / work v3 AC / token drift）
 * 沒有一道會叫，因為它們量的是主視覺與 Selected Work，不是導覽。
 * 「全綠」在這個缺口上是假指標，所以補這道。
 *
 * Chrome headless 在 macOS 把視窗寬度硬夾在 500px（audit-work-v3.mjs 同一個坑），
 * 所以窄寬度一律走 iframe —— 媒體查詢對 iframe 自己的寬度生效，是真的視口測試。
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = join(ROOT, 'site');
const CHROME = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
].find((p) => existsSync(p));
if (!CHROME) {
  console.error('❌ 找不到 Chrome —— 這是環境問題，不是 AC 失敗');
  process.exit(2);
}

const LOCALES = [
  { key: 'en', dir: SITE },
  { key: 'ja', dir: join(SITE, 'ja') },
  { key: 'zh', dir: join(SITE, 'zh') },
];
const NARROW = 390;          // iPhone 14/15 直向
const TAP_MIN = 44;          // WCAG 2.5.8 觸控目標下限

/* finally 在 SIGINT 下不會跑；集中登記，訊號時一併清掉暫存頁。
   （audit-work-v3 的暫存頁曾被 auto-save cron commit 進公開 repo。） */
const TMP = new Set();
const cleanup = () => { for (const f of TMP) { try { rmSync(f, { force: true }); } catch {} } TMP.clear(); };
process.on('exit', cleanup);
for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => { cleanup(); process.exit(130); });

function probe(loc) {
  const inner = join(loc.dir, '__audit-nav.html');
  const outer = join(loc.dir, '__audit-nav-parent.html');
  TMP.add(inner); TMP.add(outer);

  /* 不要等 window.load —— 那要等 16 張 KV 底圖全下載完，實測會撞到虛擬時間上限，
     結果就是「有時綠有時紅」的假不穩。導覽跟圖片無關，DOM 解析完 + site.js 初始化即可測。 */
  const probeJs = `<script>
(function ready(fn){ if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); })(function () { setTimeout(function () {
  var o = {};
  var btn = document.querySelector('.nav__menu');
  o.btnExists = !!btn;
  if (btn) {
    var cs = getComputedStyle(btn), r = btn.getBoundingClientRect();
    o.btnVisible = cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0';
    o.btnW = Math.round(r.width); o.btnH = Math.round(r.height);
    btn.click();
    var panel = document.getElementById('nav-panel');
    o.panelOpen = !!panel && !panel.hidden;
    o.ariaExpanded = btn.getAttribute('aria-expanded');
    var as = panel ? [].slice.call(panel.querySelectorAll('a')) : [];
    o.links = as.map(function (a) {
      return { href: a.getAttribute('href'), text: a.textContent.trim(), h: Math.round(a.getBoundingClientRect().height) };
    });
    var first = as[0]; if (first) first.click();
    o.closedAfterClick = !!panel && panel.hidden;
  }
  var deskLinks = [].slice.call(document.querySelectorAll('.nav__links a'));
  o.deskHrefs = deskLinks.map(function (a) { return a.getAttribute('href'); });
  o.deskHidden = deskLinks.every(function (a) { return getComputedStyle(a.parentNode).display === 'none'; });
  o.docW = document.documentElement.scrollWidth;
  o.winW = window.innerWidth;
  var pre = document.createElement('pre'); pre.id = '__r'; pre.textContent = JSON.stringify(o);
  document.body.appendChild(pre);
}, 900); });
</script>`;

  writeFileSync(inner, readFileSync(join(loc.dir, 'index.html'), 'utf8').replace('</body>', probeJs + '</body>'));
  writeFileSync(outer, `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0}iframe{width:${NARROW}px;height:800px;border:0;display:block}</style>
<iframe src="__audit-nav.html"></iframe><pre id="__r"></pre>
<script>
var t0=Date.now();(function p(){
  var d; try { d = frames[0].document; } catch(e){ document.getElementById('__r').textContent=JSON.stringify({error:'讀不到 iframe：'+e.message}); return; }
  var i=d.getElementById('__r');
  if(i&&i.textContent){document.getElementById('__r').textContent=i.textContent;return;}
  if(Date.now()-t0>9000){document.getElementById('__r').textContent=JSON.stringify({error:'iframe 內沒有量測結果（readyState='+d.readyState+'）'});return;}
  setTimeout(p,100);
})();
</script>`);

  try {
    const dom = execFileSync(CHROME, [
      '--headless', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', '--allow-file-access-from-files',
      // 不等圖片後 6s 已綽綽有餘（內頁 DOMContentLoaded+900ms，父頁輪詢 100ms）。
      '--window-size=560,900', '--virtual-time-budget=6000', '--dump-dom', `file://${outer}`,
    ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = /<pre id="__r">([\s\S]*?)<\/pre>/.exec(dom);
    if (!m) throw new Error('父頁沒有產出結果');
    const dec = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
    const r = JSON.parse(dec(m[1]));
    if (r.error) throw new Error(r.error);
    return r;
  } finally {
    rmSync(inner, { force: true }); rmSync(outer, { force: true });
    TMP.delete(inner); TMP.delete(outer);
  }
}

const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };

console.log(`▶ 窄視口（${NARROW}px）導覽必須可用`);
for (const loc of LOCALES) {
  const r = probe(loc);

  if (r.winW !== NARROW) { bad(`${loc.key}: 視口實際是 ${r.winW}px，這格沒測到，不算通過`); continue; }
  if (!r.deskHidden) { ok(`${loc.key}: 桌面導覽在 ${NARROW}px 仍可見（無需精簡選單）`); continue; }

  if (!r.btnExists || !r.btnVisible) { bad(`${loc.key}: 桌面導覽被隱藏，卻沒有可見的替代入口 —— 四個區塊無法跳轉`); continue; }
  ok(`${loc.key}: 有可見的選單按鈕`);

  if (r.btnW >= TAP_MIN && r.btnH >= TAP_MIN) ok(`${loc.key}: 按鈕 ${r.btnW}×${r.btnH} ≥ ${TAP_MIN}px 觸控下限`);
  else bad(`${loc.key}: 按鈕 ${r.btnW}×${r.btnH}，小於 ${TAP_MIN}px 觸控下限`);

  if (r.panelOpen && r.ariaExpanded === 'true') ok(`${loc.key}: 點擊後面板開啟且 aria-expanded=true`);
  else bad(`${loc.key}: 點擊後面板未開啟（panelOpen=${r.panelOpen} aria-expanded=${r.ariaExpanded}）`);

  // 面板連結必須「完整覆蓋」桌面導覽 —— 少一個就是窄視口的人到不了那個區塊。
  const panelHrefs = r.links.map((l) => l.href);
  const missing = r.deskHrefs.filter((h) => !panelHrefs.includes(h));
  if (!missing.length && panelHrefs.length === r.deskHrefs.length) ok(`${loc.key}: 面板覆蓋全部 ${panelHrefs.length} 個區塊 ${JSON.stringify(r.links.map((l) => l.text))}`);
  else bad(`${loc.key}: 面板漏了 ${JSON.stringify(missing)}（面板 ${panelHrefs.length} / 桌面 ${r.deskHrefs.length}）`);

  const small = r.links.filter((l) => l.h < TAP_MIN);
  if (!small.length) ok(`${loc.key}: 面板連結全部 ≥ ${TAP_MIN}px 高`);
  else bad(`${loc.key}: 面板有 ${small.length} 個連結低於 ${TAP_MIN}px（${small.map((l) => l.text + '=' + l.h).join(', ')}）`);

  // 同頁錨點不觸發任何導航事件，面板不自己收就會蓋住剛捲到的區塊。
  if (r.closedAfterClick) ok(`${loc.key}: 點連結後面板自動收起`);
  else bad(`${loc.key}: 點連結後面板仍開著，會蓋住目標區塊`);

  if (r.docW === r.winW) ok(`${loc.key}: 無水平溢出（${r.docW}）`);
  else bad(`${loc.key}: 水平溢出 ${r.docW - r.winW}px`);
}

console.log();
if (fails.length) {
  console.error(`❌ audit-nav — ${fails.length} 項未通過`);
  process.exit(2);
}
console.log('✅ audit-nav — 三語窄視口導覽皆可用');
