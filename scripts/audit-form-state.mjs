#!/usr/bin/env node
/* ============================================================
   audit-form-state.mjs — 聯絡表單「錯誤可見」與 aria-invalid 的一致性（TODO.md:207）

   不變量（2026-09-04 Codex 對齊）：
     錯誤可見（.field.is-error） = aria-invalid="true" = submitted && invalid(value)
   送出前（S0 / S0b）兩者一律 false，不管欄位值有效與否 —— 不提前報錯。
   送出後每次 input 都要按欄位「真實有效性」重驗：改了一個字但仍無效（例如 email「a@」）
   必須維持錯誤；有效才清除；再次清空要重新標錯。

   預期值是下表寫死的明確案例，不呼叫產品的謂詞當 oracle。
   三語各跑一次（三頁共用 ../js/site.js；note 文字對各語 formErr 寫死）。
   絕不送出有效表單（那會導向 mailto:）；S3 只斷言欄位狀態，不 requestSubmit。

   反向測試（拿掉修正要紅）：① input 監聽改回只 remove class → S2/S3/S4 紅
   ② 拿掉 submitted 閘 → S0b 紅 ③ mark 只設 class 不設 aria → 不變量紅。
   ============================================================ */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { attach, listPages } from './lib/cdp.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Chromium.app/Contents/MacOS/Chromium'].filter(Boolean).find((p) => existsSync(p));
if (!CHROME) { console.error('❌ 找不到 Chrome —— 環境問題，不是內容問題'); process.exit(2); }
const PORT = Number(process.env.CDP_PORT || 9339);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = [];
const ok = (m) => console.log(`   ✓ ${m}`);
const bad = (m) => { console.log(`   ✗ ${m}`); fails.push(m); };

const PAGES = [
  { key: 'en', file: 'site/index.html', formErr: 'Please fill the required fields marked in orange.' },
  { key: 'ja', file: 'site/ja/index.html', formErr: 'オレンジ色の必須項目をご記入ください。' },
  { key: 'zh', file: 'site/zh/index.html', formErr: '請填寫以橘色標示的必填欄位。' },
];
const FIELDS = ['f-name', 'f-email', 'f-msg'];
// E = 錯誤可見且 aria-invalid="true"；- = 兩者皆否。每一步的期望值都是寫死的。
const STEPS = [
  { id: 'S0  未送出（載入）', expect: { 'f-name': false, 'f-email': false, 'f-msg': false } },
  { id: 'S0b 送出前打字 email「a@」→ 不提前報錯', type: [['f-email', 'a@']], expect: { 'f-name': false, 'f-email': false, 'f-msg': false } },
  { id: 'S0c 清回空值（仍未送出）', type: [['f-email', '']], expect: { 'f-name': false, 'f-email': false, 'f-msg': false } },
  { id: 'S1  空欄送出 → 三欄錯誤', submit: true, expect: { 'f-name': true, 'f-email': true, 'f-msg': true }, note: true },
  { id: 'S2  修正仍無效：name「 」、email「a@」', type: [['f-name', ' '], ['f-email', 'a@']], expect: { 'f-name': true, 'f-email': true, 'f-msg': true } },
  { id: 'S2b email「a@b」（無點）仍無效', type: [['f-email', 'a@b']], expect: { 'f-name': true, 'f-email': true, 'f-msg': true } },
  { id: 'S2c email「a b@c.d」（含空白）仍無效', type: [['f-email', 'a b@c.d']], expect: { 'f-name': true, 'f-email': true, 'f-msg': true } },
  { id: 'S3  全欄有效：Yves / a@b.co / hi', type: [['f-name', 'Yves'], ['f-email', 'a@b.co'], ['f-msg', 'hi']], expect: { 'f-name': false, 'f-email': false, 'f-msg': false }, noteInfo: true },
  { id: 'S4  再次清空 email、msg', type: [['f-email', ''], ['f-msg', '']], expect: { 'f-name': false, 'f-email': true, 'f-msg': true } },
];

const snapshot = () => {
  const f = document.getElementById('join-form');
  const out = { href: location.href, note: document.getElementById('f-note').textContent.trim(), fields: {} };
  for (const i of f.querySelectorAll('[required]')) out.fields[i.id] = { value: i.value, isError: i.closest('.field').classList.contains('is-error'), aria: i.getAttribute('aria-invalid') };
  return out;
};
const typeInto = (id, v) => { const i = document.getElementById(id); i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); };
const submitForm = () => { document.getElementById('join-form').requestSubmit(); };

const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
  '--window-size=1280,900', '--user-data-dir=' + join(ROOT, '.chrome-shoot-profile'), 'about:blank'], { stdio: 'ignore' });
try {
  let up = false; for (let i = 0; i < 60; i++) { try { await listPages(PORT); up = true; break; } catch { await sleep(250); } }
  if (!up) throw new Error(`Chrome 沒有在 ${PORT} 開出 CDP 端點`);

  for (const p of PAGES) {
    console.log(`▶ ${p.key}：${p.file} —— 錯誤可見 = aria-invalid = submitted && invalid(value)`);
    const target = (await listPages(PORT)).find((t) => t.type === 'page'); const s = await attach(target);
    await s.navigate(`file://${join(ROOT, p.file)}`); await sleep(1200);
    const href0 = (await s.evaluate(snapshot)).href;
    for (const step of STEPS) {
      for (const [id, v] of step.type || []) await s.evaluate(typeInto, id, v);
      if (step.submit) { await s.evaluate(submitForm); await sleep(150); }
      const snap = await s.evaluate(snapshot);
      const wrong = [];
      for (const id of FIELDS) {
        const f = snap.fields[id]; const exp = step.expect[id];
        if (!f) { wrong.push(`${id} 不存在`); continue; }
        if (f.isError !== exp || f.aria !== String(exp)) wrong.push(`${id} v=${JSON.stringify(f.value)} 期望 ${exp ? 'E' : '-'}，實際 .is-error=${f.isError} aria-invalid=${f.aria}`);
      }
      if (step.note && snap.note !== p.formErr) wrong.push(`#f-note 期望「${p.formErr}」，實際「${snap.note}」`);
      if (snap.href !== href0) wrong.push(`href 變了（${snap.href}）—— 不該走到 mailto`);
      wrong.length ? bad(`${p.key} ${step.id} — ${wrong.join('；')}`) : ok(`${p.key} ${step.id}`);
      if (step.noteInfo) console.log(`   ℹ ${p.key} S3 全欄有效後 #f-note 仍為「${snap.note}」—— 恢復缺口，本 gate 不驗收（見 TODO.md）`);
    }
    s.close();
  }
} finally { chrome.kill(); }

console.log('');
if (fails.length) { console.error(`❌ audit-form-state — ${fails.length} 項失敗`); process.exit(2); }
console.log('✅ audit-form-state — 三語 × 9 步：錯誤可見與 aria-invalid 一致，送出前不提前報錯，未觸發 mailto');
