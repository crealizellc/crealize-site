#!/usr/bin/env node
/* ============================================================
   audit-kv-quality — 主視覺底圖的品質不變式（混合管線版，v3）

   2026-08-09 整支重寫，理由要寫清楚：

   v2 是為「裝置外框 + 真實截圖」的海報管線寫的，量的是「面板佔畫面幾成」
   與「面板邊界的亮度階差」。那個版型已經整組移除（Yves 講過三次
   「故意放個手機是十年前的設計」），於是 v2 的 AC 變成在量一個不存在的東西 ——
   門檻照跑、照紅，但跟成品完全無關。留著它比刪掉更糟，那是假指標。

   現在的底圖來自 gen-kv-chatgpt.mjs（AI）或 build-kv-code.mjs（程式），
   兩者都只負責「氛圍」，主體與文字由頁面上的動態層提供。所以值得機械檢查的是：

     AC-1 有層次      全圖亮度標準差 —— 純色底圖等於沒設計。
                      **不用四角落差**：深色構圖的四角本來就都是暗的，
                      XunNi 那張漂亮的金色星盤就是這樣被誤判為「幾乎純色」。
     AC-2 曝光可用    平均亮度落在區間內，卡片上的文字才讀得到
     AC-3 品牌色      主色調落在該產品 product-palette.json 的色系家族內
     AC-4 左下安靜    icon 疊在左下，那一區的細節量不得高於全圖

   量測方式：sips 轉成小尺寸 PNG，再用 Node 內建 zlib 自行解碼取樣。
   不經瀏覽器、不新增依賴，結果完全確定性。

   它擋得掉的失敗：純色底、全黑或死白、色系跑到別的品牌、左下太花壓不住 icon。
   它擋不掉的：美醜、構圖、圖上有沒有出現不該有的文字。那些要用眼睛看。

   用法：node scripts/audit-kv-quality.mjs
   退出：0 全過 / 1 有不合格 / 2 環境問題
   ============================================================ */
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KV = join(ROOT, 'site/assets/kv');
const PALETTE = JSON.parse(readFileSync(join(ROOT, 'docs/design-system/product-palette.json'), 'utf8')).products;

/** slug → product-palette.json 的鍵 */
const KEY = {
  puritylens: 'PurityLens', fudeto: 'Fudeto', kichitto: 'Kichitto', qiflux: 'QiFlux',
  meishitto: 'Meishitto', rythix2048: 'Rythix2048', tendo: 'Tendo', xunni: 'XunNi',
  moonpacket: 'moonpacket', idokuta: 'iDokuta', mairi: 'Mairi', meguru: 'Meguru',
  ymy: 'YMY', kizuki: 'Kizuki', dramaflow: 'dramaflow', todoke: 'Todoke',
};

const HUE_TOL = 34;        // 色系家族容差（度）。底圖是氛圍層，比 UI 色寬鬆是刻意的
const LOW_SAT = 12;        // 飽和度低於此的品牌色不拿來比 hue —— 近灰色談色相沒意義
const LUM_MIN = 8, LUM_MAX = 240;
const LUM_STD_MIN = 10;    // 全圖亮度標準差下限（純色底趨近 0）
const QUIET_RATIO = 1.15;  // 左下細節量相對全圖的上限

function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const l = (mx + mn) / 2;
  const s = d ? d / (1 - Math.abs(2 * l - 1)) : 0;
  return { h, s: s * 100, l: l * 100 };
}

function paletteHues(slug) {
  const p = PALETTE[KEY[slug]];
  if (!p) return [];
  return Object.values(p.palette || {})
    .filter((v) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v))
    .map(hexToHsl)
    .filter((c) => c.s >= LOW_SAT)
    .map((c) => c.h);
}

const files = readdirSync(KV).filter((f) => f.endsWith('.webp')).sort();
if (!files.length) { console.error('❌ site/assets/kv/ 沒有 webp'); process.exit(2); }

/* AC-0：來源必須是「生成的橫向底圖」，不是我上傳的參考圖。
   build-kv-assets 一律把輸出裁成 1600×1200，所以 site/assets/kv/ 這一層
   永遠是 4:3，量它等於沒量 —— 要看的是 kv-ai/ 與 kv-gen/ 的原始檔。
   2026-08-09：ymy.png 是 945×2048 的 YMY 官網截圖（圖上有真實日文與按鈕），
   AC-1..AC-4 四條全綠 —— 因為它們只看亮度與色相，看不出「這是一張截圖」。 */
const SRC_DIRS = ['site-assets/kv-ai', 'site-assets/kv-gen'];
const srcFails = [];
for (const dir of SRC_DIRS) {
  const abs = join(ROOT, dir);
  let entries = [];
  try { entries = readdirSync(abs).filter((f) => f.endsWith('.png')); } catch { continue; }
  for (const f of entries) {
    const buf = readFileSync(join(abs, f));
    if (buf.readUInt32BE(0) !== 0x89504e47 || buf.toString('ascii', 12, 16) !== 'IHDR') {
      srcFails.push(`AC-0 ${dir}/${f}：不是可解析的 PNG`);
      continue;
    }
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    if (w <= h) srcFails.push(`AC-0 ${dir}/${f}：${w}×${h} 非橫向 —— 這是參考圖或截圖，不是生成的底圖`);
  }
}
if (srcFails.length) {
  for (const f of srcFails) console.error(`   ✗ ${f}`);
  console.error(`\n❌ audit-kv-quality — 來源底圖有 ${srcFails.length} 張不是橫向生成圖`);
  process.exit(2);
}
console.log(`   ✓ AC-0 來源底圖全為橫向生成圖`);

/* 取樣改用 sips → PNG → zlib 解碼，不經瀏覽器。
   原本想用 Chrome 的 canvas，實測在 file:// + --virtual-time-budget 下
   img.decode() 不保證在 --dump-dom 之前完成，量測腳本永遠回 "init"。
   PNG 只需要 IHDR + inflate + 反濾波，Node 內建 zlib 就夠，也不必新增依賴。 */
function readPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('不是 PNG');
  let pos = 8, w = 0, h = 0, depth = 0, ctype = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0); h = data.readUInt32BE(4);
      depth = data[8]; ctype = data[9];
      if (depth !== 8 || (ctype !== 2 && ctype !== 6)) throw new Error(`不支援的 PNG 格式 depth=${depth} ctype=${ctype}`);
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const bpp = ctype === 6 ? 4 : 3;
  const raw = inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  let rp = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[rp++];
    const line = raw.subarray(rp, rp + stride); rp += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prev ? prev[i] : 0;
      const c = (prev && i >= bpp) ? prev[i - bpp] : 0;
      let v = line[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
      }
      cur[i] = v & 0xff;
    }
  }
  return { w, h, bpp, data: out };
}

function sample(file) {
  const tmp = join(tmpdir(), `crz-kvq-${Math.abs(hashCode(file))}.png`);
  try {
    execFileSync('sips', ['-s', 'format', 'png', '-z', '150', '200', file, '--out', tmp], { stdio: 'ignore' });
    const img = readPng(readFileSync(tmp));
    const { w, h, bpp, data } = img;
    const px = (i, j) => { const k = (j * w + i) * bpp; return [data[k], data[k + 1], data[k + 2]]; };

    let sumL = 0, sumL2 = 0, n = 0;
    const hist = new Map();
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const [r, g, b] = px(i, j);
      const L = (r + g + b) / 3;
      sumL += L; sumL2 += L * L; n++;
      const c = rgbToHsl(r, g, b);
      if (c.s >= 15 && c.l > 8 && c.l < 94) {
        const bin = Math.round(c.h / 8) * 8;
        hist.set(bin, (hist.get(bin) || 0) + 1);
      }
    }
    const cs = [[6, 6], [w - 7, 6], [6, h - 7], [w - 7, h - 7]]
      .map(([i, j]) => { const q = px(i, j); return (q[0] + q[1] + q[2]) / 3; });
    const detail = (x0, y0, x1, y1) => {
      let s = 0, c = 0;
      for (let j = y0; j < y1 - 1; j++) for (let i = x0; i < x1 - 1; i++) {
        const a = px(i, j), b = px(i + 1, j), e = px(i, j + 1);
        s += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])
           + Math.abs(a[0] - e[0]) + Math.abs(a[1] - e[1]) + Math.abs(a[2] - e[2]);
        c++;
      }
      return c ? s / c : 0;
    };
    let dom = null, best = -1, total = 0;
    for (const [bin, cnt] of hist) { total += cnt; if (cnt > best) { best = cnt; dom = bin; } }
    return {
      lum: +(sumL / n).toFixed(1),
      lumStd: +Math.sqrt(Math.max(0, sumL2 / n - (sumL / n) ** 2)).toFixed(1),
      cornerSpread: +(Math.max(...cs) - Math.min(...cs)).toFixed(1),
      domHue: dom,
      chromaticPx: total,
      detailAll: +detail(0, 0, w, h).toFixed(1),
      detailQuiet: +detail(0, Math.round(h * 0.55), Math.round(w * 0.55), h).toFixed(1),
    };
  } finally {
    rmSync(tmp, { force: true });
  }
}

function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function rgbToHsl(r, g, b) { return hexToHsl('#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')); }

const raw = {};
for (const f of files) {
  try { raw[f] = sample(join(KV, f)); }
  catch (e) { raw[f] = null; console.error(`   ! ${f} 取樣失敗：${e.message}`); }
}

const fails = [];
const notes = [];
for (const f of files) {
  const slug = f.replace('.webp', '');
  const r = raw[f];
  if (!r) { fails.push(`${slug}：取樣失敗（圖片可能損毀）`); continue; }

  if (r.lumStd >= LUM_STD_MIN) console.log(`   ✓ AC-1 ${slug.padEnd(12)} 亮度標準差 ${r.lumStd}（四角落差 ${r.cornerSpread}）`);
  else fails.push(`AC-1 有層次 [${slug}]：全圖亮度標準差僅 ${r.lumStd}（門檻 ${LUM_STD_MIN}）—— 幾乎是純色底`);

  if (r.lum >= LUM_MIN && r.lum <= LUM_MAX) console.log(`   ✓ AC-2 ${slug.padEnd(12)} 平均亮度 ${r.lum}`);
  else fails.push(`AC-2 曝光 [${slug}]：平均亮度 ${r.lum} 不在 ${LUM_MIN}–${LUM_MAX}`);

  const hues = paletteHues(slug);
  if (!hues.length) {
    notes.push(`AC-3 [${slug}] palette 無高飽和色可比對，跳過色系檢查`);
  } else if (r.chromaticPx < 200 || r.domHue === null) {
    notes.push(`AC-3 [${slug}] 幾乎無彩度像素（近灰底），色系檢查不適用`);
  } else {
    const dist = Math.min(...hues.map((h) => { const d = Math.abs(h - r.domHue) % 360; return Math.min(d, 360 - d); }));
    if (dist <= HUE_TOL) console.log(`   ✓ AC-3 ${slug.padEnd(12)} 主色 ${r.domHue}° 距品牌色系 ${dist.toFixed(0)}°`);
    else fails.push(`AC-3 品牌色 [${slug}]：主色 ${r.domHue}° 距最近的品牌色 ${dist.toFixed(0)}°（容差 ${HUE_TOL}°）`);
  }

  if (r.detailQuiet <= r.detailAll * QUIET_RATIO) console.log(`   ✓ AC-4 ${slug.padEnd(12)} 左下細節 ${r.detailQuiet} / 全圖 ${r.detailAll}`);
  else fails.push(`AC-4 左下安靜 [${slug}]：該區細節 ${r.detailQuiet} 超過全圖 ${r.detailAll} 的 ${QUIET_RATIO} 倍 —— icon 會被壓不住`);
}

console.log('');
for (const n of notes) console.log(`ℹ️  ${n}`);
if (fails.length) {
  console.error(`\n❌ audit-kv-quality — ${fails.length} 項不合格\n`);
  for (const f of fails) console.error(`   • ${f}`);
  process.exit(1);
}
console.log(`✅ audit-kv-quality — ${files.length} 張底圖全數通過（有層次 · 曝光 · 品牌色系 · 左下留白）`);
